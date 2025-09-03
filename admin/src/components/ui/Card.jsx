import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6', 
  hover = false,
  glass = false,
  gradient = false 
}) => {
  const baseClasses = `
    rounded-xl border transition-all duration-200 overflow-hidden
    ${glass 
      ? 'bg-gray-800/30 backdrop-blur-xl border-gray-700/50' 
      : 'bg-gray-800/80 border-gray-700/30'
    }
    ${hover ? 'hover:shadow-lg hover:shadow-gray-900/20 hover:border-gray-600/50 hover:-translate-y-1' : ''}
    ${gradient ? 'bg-gradient-to-br from-gray-800/90 via-gray-800/70 to-gray-900/90' : ''}
  `;
  
  return (
    <div className={`${baseClasses} ${padding} ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 pb-4 border-b border-gray-700/50 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', size = 'lg' }) => {
  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-lg font-semibold',
    xl: 'text-xl font-bold'
  };
  
  return (
    <h3 className={`text-white ${sizeClasses[size]} ${className}`}>
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-gray-700/50 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;