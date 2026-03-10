import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@linaria/core'
import { iconButtonClass } from '../style/common'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export const IconButton = ({
  children,
  className = '',
  ...rest
}: IconButtonProps) => (
  <button className={cx(iconButtonClass, className)} draggable={false} {...rest}>
    {children}
  </button>
)
