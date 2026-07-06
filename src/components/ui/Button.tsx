import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:   'bg-tinta text-papel hover:bg-tinta/90 active:scale-[.98]',
  secondary: 'bg-papel border border-linea text-tinta hover:border-tinta-suave',
  accent:    'bg-resaltador text-[#4A3800] hover:bg-resaltador/90 active:scale-[.98]',
  ghost:     'text-tinta-suave hover:text-tinta hover:bg-linea/40',
  danger:    'bg-lapiz-rojo text-papel hover:bg-lapiz-rojo/90',
}

const sizes: Record<Size, string> = {
  sm: 'h-8  px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-2 focus-visible:outline-lapiz-rojo disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button }
