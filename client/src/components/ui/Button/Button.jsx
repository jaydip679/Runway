import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const widthClass = fullWidth ? 'btn-full' : '';
  
  const finalClass = [baseClass, variantClass, sizeClass, widthClass, className].filter(Boolean).join(' ');

  return (
    <button className={finalClass} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <span className="btn-spinner" />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
