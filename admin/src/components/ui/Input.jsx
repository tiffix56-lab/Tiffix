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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 ${Icon ? 'pl-10' : ''} 
            bg-gray-800/50 border border-gray-700/50 rounded-xl
            text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            transition-all duration-200
            hover:border-gray-600
            ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

const TextArea = ({
  label,
  error,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full px-4 py-3 
          bg-gray-800/50 border border-gray-700/50 rounded-xl
          text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
          transition-all duration-200
          hover:border-gray-600
          resize-y
          ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3 
          bg-gray-800/50 border border-gray-700/50 rounded-xl
          text-white
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
          transition-all duration-200
          hover:border-gray-600
          ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="" disabled className="bg-gray-800 text-gray-400">
          {placeholder}
        </option>
        {options.map((option) => (
          <option 
            key={option.value || option} 
            value={option.value || option}
            className="bg-gray-800 text-white"
          >
            {option.label || option}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

Input.TextArea = TextArea;
Input.Select = Select;

export default Input;