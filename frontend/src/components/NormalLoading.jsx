import React from 'react';

export default function NormalLoading({ size = 20, text = '' }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div 
        className="border-4 border-transparent border-t-current rounded-full animate-spin"
        style={{ 
          width: `${size}px`, 
          height: `${size}px` 
        }}
      />
      {text && <span>{text}</span>}
    </div>
  );
}
