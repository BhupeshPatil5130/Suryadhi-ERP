import * as React from 'react';

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const TooltipContext = React.createContext<{ delayDuration: number }>({ delayDuration: 300 });

export function TooltipProvider({ children, delayDuration = 300 }: TooltipProviderProps) {
  return (
    <TooltipContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
}

interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const { delayDuration } = React.useContext(TooltipContext);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  React.useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if ((child.type as any)?.displayName === 'TooltipTrigger') {
          return child;
        }
        if ((child.type as any)?.displayName === 'TooltipContent') {
          return open ? child : null;
        }
        return child;
      })}
    </div>
  );
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, { ref, ...props });
    }
    return <div ref={ref} {...props}>{children}</div>;
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, side = 'top', className = '', ...props }, ref) => {
    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
      left: 'right-full top-1/2 -translate-y-1/2 mr-1',
      right: 'left-full top-1/2 -translate-y-1/2 ml-1',
    };

    return (
      <div
        ref={ref}
        className={`absolute z-50 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 ${positionClasses[side]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';
