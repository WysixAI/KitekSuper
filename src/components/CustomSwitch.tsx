interface CustomSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
}

export const CustomSwitch = ({
  checked,
  onChange,
  label,
  description,
  id,
}: CustomSwitchProps) => {
  return (
    <div
      id={id}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between p-3.5 rounded-xl bg-[#20242a] border border-[#2d323b] hover:border-emerald-500/40 cursor-pointer transition-all select-none group"
    >
      <div className="pr-3">
        {label && (
          <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
            {label}
          </span>
        )}
        {description && (
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-emerald-500 shadow-sm shadow-emerald-950/60' : 'bg-[#15171a] border-[#2e333b]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
