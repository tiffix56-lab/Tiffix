import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'p-4', 
  hover = false,
  glass = false,
  gradient = false 
}) => {
  const baseClasses = `
    rounded-xl border transition-all duration-200 overflow-hidden
    ${glass 
      ? 'bg-[#1E2938]/80 backdrop-blur-lg border-orange-500/30 shadow-lg' 
      : 'bg-[#1E2938] border-orange-500/20 shadow-md'
    }
    ${hover ? 'hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-500/30 hover:-translate-y-0.5' : ''}
    ${gradient ? 'bg-[#1E2938]' : ''}
  `;
  
  return (
    <div className={`${baseClasses} ${padding} ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 pb-3 border-b border-orange-500/20 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', size = 'lg' }) => {
  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-lg font-bold',
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
  <div className={`mt-4 pt-3 border-t border-orange-500/20 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;