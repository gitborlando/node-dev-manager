#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    collections::HashMap,
    io::{BufRead, BufReader, Read},
    process::{Child, Command, Stdio},
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

const PROCESS_EVENT_NAME: &str = "process-event";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
enum ProcessStatus {
    Starting,
    Running,
    Stopping,
    Stopped,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProcessStartInput {
    id: String,
    cwd: String,
    command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProcessSnapshot {
    id: String,
    status: ProcessStatus,
    pid: Option<u32>,
    started_at: Option<String>,
    updated_at: String,
    exit_code: Option<i32>,
    last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
enum ProcessLogLevel {
    Stdout,
    Stderr,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum ProcessEvent {
    Status {
        process_id: String,
        snapshot: ProcessSnapshot,
        time: String,
    },
    Log {
        process_id: String,
        level: ProcessLogLevel,
        message: String,
        time: String,
    },
}

#[derive(Debug, Clone)]
struct ManagedProcess {
    snapshot: ProcessSnapshot,
    stop_requested: bool,
}

#[derive(Default)]
struct ProcessManager {
    processes: Mutex<HashMap<String, ManagedProcess>>,
}

#[tauri::command]
fn list_process_snapshots(state: State<'_, Arc<ProcessManager>>) -> Vec<ProcessSnapshot> {
    let processes = state.processes.lock().unwrap();
    processes
        .values()
        .map(|item| item.snapshot.clone())
        .collect()
}

#[tauri::command]
fn start_process(
    app_handle: AppHandle,
    state: State<'_, Arc<ProcessManager>>,
    input: ProcessStartInput,
) -> Result<ProcessSnapshot, String> {
    start_process_impl(app_handle, state.inner().clone(), input)
}

#[tauri::command]
fn stop_process(
    app_handle: AppHandle,
    state: State<'_, Arc<ProcessManager>>,
    process_id: String,
) -> Result<ProcessSnapshot, String> {
    stop_process_impl(app_handle, state.inner().clone(), &process_id)
}

#[tauri::command]
fn restart_process(
    app_handle: AppHandle,
    state: State<'_, Arc<ProcessManager>>,
    input: ProcessStartInput,
) -> Result<ProcessSnapshot, String> {
    let manager = state.inner().clone();
    let existing_snapshot = {
        let processes = manager.processes.lock().unwrap();
        processes.get(&input.id).map(|item| item.snapshot.clone())
    };

    if let Some(snapshot) = existing_snapshot {
        if is_active_status(&snapshot.status) {
            stop_process_impl(app_handle.clone(), manager.clone(), &input.id)?;
            thread::sleep(Duration::from_millis(350));
        }
    }

    start_process_impl(app_handle, manager, input)
}

fn start_process_impl(
    app_handle: AppHandle,
    manager: Arc<ProcessManager>,
    input: ProcessStartInput,
) -> Result<ProcessSnapshot, String> {
    {
        let processes = manager.processes.lock().unwrap();
        if let Some(record) = processes.get(&input.id) {
            if is_active_status(&record.snapshot.status) {
                return Err("PROCESS_ALREADY_RUNNING".into());
            }
        }
    }

    let now = iso_now();
    let mut command = build_shell_command(&input);
    command
        .current_dir(&input.cwd)
        .env("FORCE_COLOR", "1")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = command
        .spawn()
        .map_err(|error| format!("PROCESS_START_FAILED: {}", error))?;

    let pid = child.id();
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let snapshot = ProcessSnapshot {
        id: input.id.clone(),
        status: ProcessStatus::Running,
        pid: Some(pid),
        started_at: Some(now.clone()),
        updated_at: now.clone(),
        exit_code: None,
        last_error: None,
    };

    {
        let mut processes = manager.processes.lock().unwrap();
        processes.insert(
            input.id.clone(),
            ManagedProcess {
                snapshot: snapshot.clone(),
                stop_requested: false,
            },
        );
    }

    emit_event(
        &app_handle,
        ProcessEvent::Status {
            process_id: input.id.clone(),
            snapshot: snapshot.clone(),
            time: now.clone(),
        },
    );
    emit_event(
        &app_handle,
        ProcessEvent::Log {
            process_id: input.id.clone(),
            level: ProcessLogLevel::System,
            message: format!("启动命令：{}", input.command),
            time: now,
        },
    );

    if let Some(stdout) = stdout {
        spawn_reader(
            app_handle.clone(),
            input.id.clone(),
            ProcessLogLevel::Stdout,
            stdout,
        );
    }

    if let Some(stderr) = stderr {
        spawn_reader(
            app_handle.clone(),
            input.id.clone(),
            ProcessLogLevel::Stderr,
            stderr,
        );
    }

    spawn_waiter(app_handle, manager, input.id, child);

    Ok(snapshot)
}

fn stop_process_impl(
    app_handle: AppHandle,
    manager: Arc<ProcessManager>,
    process_id: &str,
) -> Result<ProcessSnapshot, String> {
    let (pid, snapshot) = {
        let mut processes = manager.processes.lock().unwrap();
        let Some(record) = processes.get_mut(process_id) else {
            return Err("PROCESS_NOT_FOUND".into());
        };

        if !is_active_status(&record.snapshot.status) {
            return Ok(record.snapshot.clone());
        }

        let Some(pid) = record.snapshot.pid else {
            return Err("PROCESS_PID_MISSING".into());
        };

        record.stop_requested = true;
        record.snapshot.status = ProcessStatus::Stopping;
        record.snapshot.updated_at = iso_now();
        (pid, record.snapshot.clone())
    };

    emit_event(
        &app_handle,
        ProcessEvent::Status {
            process_id: process_id.to_string(),
            snapshot: snapshot.clone(),
            time: snapshot.updated_at.clone(),
        },
    );
    emit_event(
        &app_handle,
        ProcessEvent::Log {
            process_id: process_id.to_string(),
            level: ProcessLogLevel::System,
            message: "收到停止指令".into(),
            time: iso_now(),
        },
    );

    if kill_process_tree(pid) {
        return Ok(snapshot);
    }

    let failed_snapshot = {
        let mut processes = manager.processes.lock().unwrap();
        let Some(record) = processes.get_mut(process_id) else {
            return Err("PROCESS_NOT_FOUND".into());
        };

        record.snapshot.status = ProcessStatus::Error;
        record.snapshot.updated_at = iso_now();
        record.snapshot.last_error = Some("PROCESS_STOP_FAILED".into());
        record.snapshot.clone()
    };

    emit_event(
        &app_handle,
        ProcessEvent::Status {
            process_id: process_id.to_string(),
            snapshot: failed_snapshot.clone(),
            time: failed_snapshot.updated_at.clone(),
        },
    );

    Err("PROCESS_STOP_FAILED".into())
}

fn spawn_reader<R: Read + Send + 'static>(
    app_handle: AppHandle,
    process_id: String,
    level: ProcessLogLevel,
    reader: R,
) {
    thread::spawn(move || {
        for line in BufReader::new(reader).lines() {
            match line {
                Ok(message) => {
                    let normalized = message.trim_end().to_string();
                    if normalized.is_empty() {
                        continue;
                    }

                    emit_event(
                        &app_handle,
                        ProcessEvent::Log {
                            process_id: process_id.clone(),
                            level: level.clone(),
                            message: normalized,
                            time: iso_now(),
                        },
                    );
                }
                Err(error) => {
                    emit_event(
                        &app_handle,
                        ProcessEvent::Log {
                            process_id: process_id.clone(),
                            level: ProcessLogLevel::System,
                            message: format!("日志读取失败：{}", error),
                            time: iso_now(),
                        },
                    );
                    break;
                }
            }
        }
    });
}

fn spawn_waiter(
    app_handle: AppHandle,
    manager: Arc<ProcessManager>,
    process_id: String,
    mut child: Child,
) {
    thread::spawn(move || {
        let wait_result = child.wait();
        let (snapshot, log_message) = {
            let mut processes = manager.processes.lock().unwrap();
            let Some(record) = processes.get_mut(&process_id) else {
                return;
            };

            record.snapshot.pid = None;
            record.snapshot.updated_at = iso_now();

            match &wait_result {
                Ok(status) => {
                    record.snapshot.exit_code = status.code();

                    if record.stop_requested || status.success() {
                        record.snapshot.status = ProcessStatus::Stopped;
                        record.snapshot.last_error = None;
                    } else {
                        record.snapshot.status = ProcessStatus::Error;
                        record.snapshot.last_error =
                            Some(format!("进程异常退出，code={}", format_code(status.code())));
                    }
                }
                Err(error) => {
                    record.snapshot.status = ProcessStatus::Error;
                    record.snapshot.last_error = Some(format!("等待进程退出失败：{}", error));
                }
            }

            let snapshot = record.snapshot.clone();
            let log_message = match wait_result {
                Ok(status) => format!("进程退出：code={}", format_code(status.code())),
                Err(error) => format!("进程退出异常：{}", error),
            };
            (snapshot, log_message)
        };

        emit_event(
            &app_handle,
            ProcessEvent::Log {
                process_id: process_id.clone(),
                level: ProcessLogLevel::System,
                message: log_message,
                time: iso_now(),
            },
        );
        emit_event(
            &app_handle,
            ProcessEvent::Status {
                process_id,
                snapshot: snapshot.clone(),
                time: snapshot.updated_at.clone(),
            },
        );
    });
}

fn build_shell_command(input: &ProcessStartInput) -> Command {
    if cfg!(target_os = "windows") {
        let mut command = Command::new("cmd");
        command.args(["/C", &input.command]);
        return command;
    }

    let mut command = Command::new("sh");
    command.args(["-lc", &input.command]);
    command
}

fn kill_process_tree(pid: u32) -> bool {
    if cfg!(target_os = "windows") {
        return Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .status()
            .map(|status| status.success())
            .unwrap_or(false);
    }

    Command::new("kill")
        .args(["-TERM", &pid.to_string()])
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

fn emit_event(app_handle: &AppHandle, event: ProcessEvent) {
    let _ = app_handle.emit(PROCESS_EVENT_NAME, event);
}

fn iso_now() -> String {
    Utc::now().to_rfc3339()
}

fn format_code(code: Option<i32>) -> String {
    code.map(|value| value.to_string())
        .unwrap_or_else(|| "null".into())
}

fn is_active_status(status: &ProcessStatus) -> bool {
    matches!(
        status,
        ProcessStatus::Starting | ProcessStatus::Running | ProcessStatus::Stopping
    )
}

fn main() {
    tauri::Builder::default()
        .manage(Arc::new(ProcessManager::default()))
        .invoke_handler(tauri::generate_handler![
            list_process_snapshots,
            start_process,
            stop_process,
            restart_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
