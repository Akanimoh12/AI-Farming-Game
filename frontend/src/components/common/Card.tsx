import { forwardRef, HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'bordered' | 'elevated'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  clickable?: boolean
  onClick?: () => void
}

const variantStyles = {
  default: 'bg-dark-200 border border-dark-100',
  glass: 'glass border border-white/10',
  bordered: 'bg-transparent border-2 border-primary/30',
  elevated: 'bg-dark-200 shadow-xl border border-dark-100',
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

/**
 * Card component with glassmorphism and hover effects
 * Supports multiple variants and responsive padding
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      hover = false,
      padding = 'md',
      clickable = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const cardClasses = [
      'rounded-xl',
      'transition-all duration-200',
      variantStyles[variant],
      paddingStyles[padding],
      clickable && 'cursor-pointer',
    ]
      .filter(Boolean)
      .join(' ')

    const Component = hover || clickable ? motion.div : 'div'
    const motionProps =
      hover || clickable
        ? {
            whileHover: { scale: 1.02, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' },
            whileTap: clickable ? { scale: 0.98 } : undefined,
          }
        : {}

    return (
      <Component
        ref={ref}
        className={cardClasses}
        onClick={onClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClick?.()
                }
              }
            : undefined
        }
        {...motionProps}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

/**
 * Card Header component
 */
export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>
}

/**
 * Card Title component
 */
export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xl font-display font-bold text-white">{children}</h3>
}

/**
 * Card Description component
 */
export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-400 mt-1">{children}</p>
}

/**
 * Card Content component
 */
export function CardContent({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

/**
 * Card Footer component
 */
export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="mt-6 pt-4 border-t border-white/10">{children}</div>
}
