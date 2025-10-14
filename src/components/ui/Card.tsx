import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card Component
 * Container with shadow and rounded corners
 */
export default function Card({
  children,
  className = '',
  padding = 'md',
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const finalClassName = `
    bg-white rounded-card shadow-sm border border-secondary-200 hover:shadow-md transition-shadow duration-200
    ${paddingStyles[padding]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return <div className={finalClassName}>{children}</div>;
}
