import { useState, useMemo, useCallback } from 'react';
import { ChevronDownIcon } from '../assets/Icons';
import { useClickOutside } from '../utils/useClickOutside';

export default function FilterDropdown({ value, options, defaultLabel, onChange }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const dropdownRef = useClickOutside(close);

  const selectedLabel = useMemo(() => {
    if (value === 'all') return defaultLabel;

    const option = options.find((item) => item.value === value);

    return option?.label ?? defaultLabel;
  }, [value, options, defaultLabel]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center justify-between gap-2 h-[46px] min-w-[180px] px-4 bg-white/95 border border-[#cbd5e1] rounded-[10px] text-xs font-bold tracking-wider text-[#374151] cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[border-color] duration-150 ease-in-out hover:border-[#2563eb]"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        {selectedLabel}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 bg-white border border-[#e2e8f0] rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] min-w-[180px] p-1.5 z-50">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-2 rounded-[6px] text-sm text-[#64748b] cursor-pointer transition-[background,color] duration-150 ease-in-out hover:bg-[#f8fafc] hover:text-[#0f172a] ${
                value === option.value ? 'bg-[#dbeafe] text-[#2563eb] font-semibold' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
