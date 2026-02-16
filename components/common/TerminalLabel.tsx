import { ReactNode } from 'react';

interface TerminalLabelProps {
  icon?: ReactNode;
  children: string;
  className?: string;
}

// Compact section label
export default function TerminalLabel({ icon, children, className = '' }: TerminalLabelProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {icon && (
        <span className="text-muted-foreground">
          {icon}
        </span>
      )}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
