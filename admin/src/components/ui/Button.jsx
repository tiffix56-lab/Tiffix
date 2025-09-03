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
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
    disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden
    active:scale-95
  `;

  const variants = {
    primary: `
      bg-orange-500 text-white shadow-md
      hover:bg-orange-400 hover:shadow-lg focus:ring-orange-500/50
    `,
    secondary: `
      bg-slate-700 text-slate-100 shadow-sm border border-slate-600/50
      hover:bg-slate-600 hover:border-slate-500 focus:ring-slate-500/50
    `,
    outline: `
      border border-orange-500 text-orange-500 bg-transparent
      hover:bg-orange-500 hover:text-white focus:ring-orange-500/50
    `,
    ghost: `
      text-slate-300 bg-transparent hover:bg-slate-700/50 hover:text-orange-400
      focus:ring-slate-500/50
    `,
    danger: `
      bg-red-600 text-white shadow-md
      hover:bg-red-500 hover:shadow-lg focus:ring-red-500/50
    `,
    success: `
      bg-emerald-600 text-white shadow-md
      hover:bg-emerald-500 hover:shadow-lg focus:ring-emerald-500/50
    `
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5',
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
    xl: 'px-6 py-3.5 text-base gap-3'
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