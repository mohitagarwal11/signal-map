import { useState, useCallback } from 'react';
import { HelpIcon } from '../assets/Icons';
import { useClickOutside } from '../utils/useClickOutside';

export default function HelpPopover({ header, body, footer }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const popoverRef = useClickOutside(close);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        className="flex items-center justify-center rounded-[6px] p-1.5 text-[#64748b] transition-all duration-200 hover:bg-slate-100 hover:text-[#0f172a]"
        type="button"
        aria-expanded={open}
        aria-label="About the data shown here"
        onClick={() => setOpen((v) => !v)}
      >
        <HelpIcon />
      </button>

      {open && (
        <div
          role="note"
          className="absolute right-0 z-20 min-w-[260px] max-w-[320px] rounded-[14px] border border-[var(--border)] bg-white px-4 py-[14px] shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
        >
          {/* Arrow */}
          <div className="absolute -top-[6px] right-[14px] h-3 w-3 rotate-45 border-l border-t border-[var(--border)] bg-white" />

          <div className="mb-2 text-sm font-extrabold uppercase tracking-[0.6px]">{header}</div>

          <p className="mb-2 text-sm leading-[1.5] text-[var(--text-secondary)]">{body}</p>

          <p className="text-sm leading-[1.5] text-[var(--text-muted)]">{footer}</p>
        </div>
      )}
    </div>
  );
}
