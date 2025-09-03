import React from 'react';

const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`
            w-full px-3 py-2.5 ${Icon ? 'pl-10' : ''} 
            bg-black border border-orange-500/30 rounded-lg backdrop-blur-sm
            text-white placeholder-orange-300/50 text-sm
            focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
            transition-all duration-200 shadow-sm
            hover:border-orange-500/60
            ${error ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

const TextArea = ({
  label,
  error,
  className = '',
  containerClassName = '',
  rows = 3,
  ...props
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full px-3 py-2.5 
          bg-black border border-orange-500/30 rounded-lg backdrop-blur-sm
          text-white placeholder-slate-400 text-sm
          focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
          transition-all duration-200 shadow-sm
          hover:border-slate-600/60
          resize-y
          ${error ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

const Select = ({
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-3 py-2.5 
          bg-black border border-orange-500/30 rounded-lg backdrop-blur-sm
          text-white text-sm
          focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
          transition-all duration-200 shadow-sm
          hover:border-slate-600/60
          ${error ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="" disabled className="bg-black text-orange-300">
          {placeholder}
        </option>
        {options.map((option) => (
          <option 
            key={option.value || option} 
            value={option.value || option}
            className="bg-black text-white"
          >
            {option.label || option}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};

Input.TextArea = TextArea;
Input.Select = Select;

export default Input;