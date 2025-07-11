import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'purple' | 'gray';
  className?: string;
}

export default function Spinner({ size = 'md', color = 'purple', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    purple: 'border-purple-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent'
  };

  return (
    <div 
      className={`animate-spin border-2 rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}