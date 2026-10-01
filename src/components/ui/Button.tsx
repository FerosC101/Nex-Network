import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from '@/components/ui/buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${buttonClasses(variant, size)} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
