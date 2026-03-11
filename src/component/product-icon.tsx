import { css, cx } from '@linaria/core'
import iconUrl from '../../assets/icon.png'

type ProductIconProps = {
  className?: string
  alt?: string
}

export const ProductIcon = ({ className = '', alt = '' }: ProductIconProps) => (
  <img
    alt={alt}
    className={cx(iconClass, className)}
    draggable={false}
    src={iconUrl}
  />
)

const iconClass = css`
  display: block;
  height: 100%;
  width: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
`
