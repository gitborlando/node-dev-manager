import fs from 'node:fs/promises'
import path from 'node:path'
import { rcedit } from 'rcedit'

type AfterPackContext = {
  appOutDir: string
  electronPlatformName: string
  packager: {
    appInfo: {
      productFilename: string
    }
    getIconPath?: () => Promise<string | null>
  }
}

const applyWindowsExeIcon = async (context: AfterPackContext) => {
  if (context.electronPlatformName !== 'win32') {
    return
  }

  const iconPath = await context.packager.getIconPath?.()

  if (!iconPath) {
    return
  }

  const exePath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.exe`,
  )

  await fs.access(exePath)
  await rcedit(exePath, { icon: iconPath })
}

export default applyWindowsExeIcon
