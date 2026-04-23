import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300',
  danger: 'bg-transparent hover:bg-red-50 text-red-600 border border-red-300',
}

export function Button({ variant = 'ghost', className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
