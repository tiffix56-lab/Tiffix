import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25
      hover:from-primary-400 hover:to-primary-500 hover:shadow-primary-500/40 hover:scale-[1.02]
      focus:ring-primary-500 active:scale-[0.98]
    `,
    secondary: `
      bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/25
      hover:from-secondary-400 hover:to-secondary-500 hover:shadow-secondary-500/40 hover:scale-[1.02]
      focus:ring-secondary-500 active:scale-[0.98]
    `,
    outline: `
      border-2 border-gray-600 text-gray-300 bg-transparent
      hover:border-primary-500 hover:text-primary-400 hover:bg-primary-500/10
      focus:ring-primary-500
    `,
    ghost: `
      text-gray-300 bg-transparent hover:bg-gray-700/50 hover:text-white
      focus:ring-gray-500
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25
      hover:from-red-400 hover:to-red-500 hover:shadow-red-500/40 hover:scale-[1.02]
      focus:ring-red-500 active:scale-[0.98]
    `,
    success: `
      bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25
      hover:from-green-400 hover:to-green-500 hover:shadow-green-500/40 hover:scale-[1.02]
      focus:ring-green-500 active:scale-[0.98]
    `
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5',
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin absolute" />
      )}
      
      <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
      </span>
    </button>
  );
};

export default Button;