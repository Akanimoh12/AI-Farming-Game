import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

// Exclude motion-conflicting props from button attributes
export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
  > {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-600 shadow-lg hover:shadow-primary/50',
  secondary: 'bg-secondary text-dark hover:bg-secondary-600 shadow-lg hover:shadow-secondary/50',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-gray-300 hover:bg-dark-200 hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-600/50',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-5 py-2.5 text-base',
  md: 'px-6 py-3.5 text-lg',
  lg: 'px-8 py-4 text-xl',
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
}

/**
 * Reusable Button component with multiple variants and sizes
 * Includes loading states, icons, and full accessibility support
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const buttonClasses = [
      'inline-flex items-center justify-center gap-2',
      'rounded-lg font-medium',
      'transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark-300',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? 'w-full' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <motion.button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        onClick={onClick}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <Loader2 className={`animate-spin ${iconSizeStyles[size]}`} aria-hidden="true" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className={iconSizeStyles[size]} aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className={iconSizeStyles[size]} aria-hidden="true">
            {icon}
          </span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
