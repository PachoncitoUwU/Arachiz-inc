import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  type = 'button',
  icon,
  onClick,
  disabled
}) {
  const baseClasses = "flex items-center justify-center gap-2 font-medium rounded shadow transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-google-blue text-white hover:bg-blue-600 px-4 py-2",
    secondary: "bg-white text-google-darkgray border border-gray-300 hover:bg-gray-50 px-4 py-2",
    danger: "bg-google-red text-white hover:bg-red-600 px-4 py-2",
    success: "bg-google-green text-white hover:bg-green-600 px-4 py-2"
  };

  const widthClass = fullWidth ? "w-full" : "";
  const className = `${baseClasses} ${variants[variant] || variants.primary} ${widthClass}`;
  
  return (
    <button 
      type={type} 
      className={className} 
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
