import React from 'react';

export default function InputIcon({
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  icon,
  required
}) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        className={`w-full border border-gray-300 rounded shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-all ${icon ? 'pl-10' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}
