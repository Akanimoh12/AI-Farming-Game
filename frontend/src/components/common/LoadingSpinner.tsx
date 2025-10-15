import { type HTMLAttributes } from 'react'

export interface LoadingSpinnerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  variant?: 'primary' | 'secondary' | 'white'
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

const variantStyles = {
  primary: 'border-primary/20 border-t-primary',
  secondary: 'border-secondary/20 border-t-secondary',
  white: 'border-white/20 border-t-white',
}

/**
 * Animated loading spinner with multiple sizes and variants
 */
export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  variant = 'primary',
  ...props
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3" {...props}>
      <div
        className={`spinner rounded-full ${sizeStyles[size]} ${variantStyles[variant]}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className="text-sm text-gray-400 animate-pulse">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-300">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * Loading skeleton for content placeholders
 */
export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-dark-100 rounded ${className}`}
      role="status"
      aria-label="Loading content"
      {...props}
    />
  )
}

/**
 * Skeleton text lines
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  )
}
