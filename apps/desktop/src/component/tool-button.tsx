import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@linaria/core'
import { toolButtonClass } from '../style/common'

type ToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export const ToolButton = ({
  children,
  className = '',
  ...rest
}: ToolButtonProps) => (
  <button className={cx(toolButtonClass, className)} {...rest}>
    {children}
  </button>
)
