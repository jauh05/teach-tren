import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'locked'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-[#CBD5E1] bg-white text-ink hover:bg-slate-50',
  locked: 'bg-slate-100 text-slate-400',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

// Touch targets are 44px on mobile and compact on desktop (docs/role.md 3.2).
export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0 md:py-2',
        variantClass[variant],
        className,
      )}
      {...props}
    />
  )
}
