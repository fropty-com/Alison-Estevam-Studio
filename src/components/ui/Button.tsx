import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'sage'

interface BaseProps {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  arrow?: boolean
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type AnchorProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' }
type Props = ButtonProps | AnchorProps

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-gold text-charcoal-deep',
    'hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(201,169,110,0.26)]',
    'active:translate-y-0'
  ),
  secondary: cn(
    'bg-transparent border border-offwhite/20 text-offwhite/60',
    'hover:border-offwhite/[0.6] hover:text-offwhite'
  ),
  ghost: cn(
    'bg-transparent text-offwhite/40',
    'hover:text-offwhite/80',
    'underline underline-offset-4 decoration-offwhite/10 hover:decoration-offwhite/30'
  ),
  sage: cn(
    'bg-sage text-charcoal-deep',
    'hover:bg-sage-light hover:-translate-y-0.5'
  ),
  destructive: cn(
    'bg-error/10 border border-error/25 text-[#C97070]',
    'hover:bg-error/15'
  ),
}

const sizes = {
  sm: 'text-xs tracking-nav px-5 py-[11px]',
  md: 'text-xs tracking-nav px-8 py-[14px]',
  lg: 'text-sm tracking-nav px-10 py-[17px]',
}

export function Button({ variant = 'primary', size = 'md', loading, arrow, children, className, ...props }: Props) {
  const classes = cn(
    'inline-flex items-center justify-center gap-4',
    'font-body font-light uppercase transition-all duration-300 ease-brand-out',
    'relative overflow-hidden',
    'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
    variants[variant],
    sizes[size],
    className
  )

  const content = (
    <>
      {loading ? (
        <span className="flex items-center gap-3">
          <span className="flex gap-1">
            {[0, 200, 400].map(delay => (
              <span
                key={delay}
                className="w-1 h-1 rounded-full bg-current animate-dot-loading"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
          <span className="text-xs tracking-nav">Aguarde</span>
        </span>
      ) : (
        <>
          {children}
          {arrow && <span aria-hidden="true" className="transition-transform duration-300 ease-brand-out group-hover:translate-x-1.5">→</span>}
        </>
      )}
    </>
  )

  if ((props as AnchorProps).as === 'a') {
    const { as: _, ...anchorProps } = props as AnchorProps
    return <a className={cn(classes, 'group')} {...anchorProps}>{content}</a>
  }

  const { as: _, ...buttonProps } = props as ButtonProps
  return (
    <button className={cn(classes, 'group')} disabled={loading} {...buttonProps}>
      {content}
    </button>
  )
}
