import React from 'react';
import { cn } from '@/lib/utils';

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'soft' | 'enterprise';
}

export const GradientCard: React.FC<GradientCardProps> = ({ 
  children, 
  variant = 'default', 
  className,
  ...props 
}) => {
  const variants = {
    default: 'bg-white hover:bg-slate-50 border-slate-100',
    soft: 'bg-gradient-to-br from-blue-50/50 to-indigo-100/30 border-blue-100',
    enterprise: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-none shadow-xl',
    vibrant: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white border-none shadow-xl',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-xl',
    danger: 'bg-gradient-to-br from-red-600 to-rose-700 text-white border-none shadow-xl',
  };

  return (
    <div 
      className={cn(
        "rounded-2xl border transition-all duration-300",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>
);
