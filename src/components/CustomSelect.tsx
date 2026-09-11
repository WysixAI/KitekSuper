import { useState, useRef, useEffect, ReactNode, isValidElement, ComponentType } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  image?: string | null;
  prefix?: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'online' | 'invite';
  actionButton?: {
    label: string;
    onClick: () => void;
    title?: string;
  };
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: ReactNode | ComponentType<{ className?: string }>;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  footerAction?: {
    label: string;
    icon?: ReactNode | ComponentType<{ className?: string }>;
    onClick: () => void;
  };
}

const renderIconOrElement = (
  iconItem: ReactNode | ComponentType<{ className?: string }> | undefined,
  defaultClassName: string
) => {
  if (!iconItem) return null;
  if (typeof iconItem === 'string' || typeof iconItem === 'number') {
    return <span className="shrink-0 leading-none">{iconItem}</span>;
  }
  if (isValidElement(iconItem)) {
    return <span className="shrink-0 leading-none">{iconItem}</span>;
  }
  // Check if it's a React component (e.g. forwardRef Lucide icon or function component)
  if (
    typeof iconItem === 'function' ||
    (typeof iconItem === 'object' && iconItem !== null && ('render' in iconItem || '$$typeof' in iconItem))
  ) {
    const Component = iconItem as ComponentType<{ className?: string }>;
    return <Component className={defaultClassName} />;
  }
  return null;
};

export const CustomSelect = ({
  value,
  onChange,
  options,
  icon,
  ariaLabel,
  placeholder = 'Wybierz...',
  className = '',
  triggerClassName = '',
  menuClassName = '',
  size = 'md',
  disabled = false,
  footerAction,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-xs',
    lg: 'px-3.5 py-2.5 text-sm',
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl bg-[#141619] border transition-all text-left font-sans cursor-pointer ${
          sizeClasses[size]
        } ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-[#191d22] text-white shadow-lg shadow-black/40'
            : 'border-[#292e36] hover:border-[#3d4552] hover:bg-[#181b1f] text-zinc-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {renderIconOrElement(icon, 'w-4 h-4 text-emerald-400 shrink-0')}
          {selectedOption?.image ? (
            <img
              src={selectedOption.image}
              alt=""
              className="w-4 h-4 rounded object-cover shrink-0"
            />
          ) : (
            renderIconOrElement(selectedOption?.icon, 'w-4 h-4 text-emerald-400 shrink-0')
          )}
          {selectedOption?.prefix && (
            <span className="shrink-0 text-emerald-400 font-mono font-bold">
              {selectedOption.prefix}
            </span>
          )}
          <span className="truncate font-medium text-white">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-zinc-200'
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#16191d] border border-[#2b313a] rounded-xl shadow-2xl shadow-black/80 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-500 text-center font-sans">
                Brak opcji do wyboru
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold border-l-2 border-emerald-400 pl-2.5'
                        : 'text-zinc-300 hover:bg-[#1f2329] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                      {opt.image ? (
                        <img
                          src={opt.image}
                          alt=""
                          className="w-4 h-4 rounded object-cover shrink-0"
                        />
                      ) : (
                        renderIconOrElement(opt.icon, 'w-4 h-4 text-emerald-400 shrink-0')
                      )}
                      {opt.prefix && (
                        <span className="text-emerald-400 font-mono font-bold text-xs shrink-0">
                          {opt.prefix}
                        </span>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="truncate font-medium">{opt.label}</span>
                        {opt.description && (
                          <span className="text-[10px] text-zinc-400 font-normal truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.actionButton && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            opt.actionButton?.onClick();
                            setIsOpen(false);
                          }}
                          className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-300 shadow-sm transition-all hover:scale-105"
                          title={opt.actionButton.title}
                        >
                          {opt.actionButton.label}
                        </span>
                      )}

                      {opt.badge && !opt.actionButton && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                          opt.badgeVariant === 'invite'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}>
                          {opt.badge}
                        </span>
                      )}

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Action (np. Zawsze na dole: Invite Bot) */}
          {footerAction && (
            <div className="p-1.5 border-t border-[#292e37] bg-[#121417]/90 mt-1">
              <button
                type="button"
                onClick={() => {
                  footerAction.onClick();
                  setIsOpen(false);
                }}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group"
              >
                {renderIconOrElement(
                  footerAction.icon,
                  'w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0'
                )}
                <span>{footerAction.label}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

