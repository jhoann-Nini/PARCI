import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-linea bg-papel px-3 text-sm text-tinta placeholder:text-tinta-suave focus:outline-2 focus:outline-lapiz-rojo transition-colors disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
