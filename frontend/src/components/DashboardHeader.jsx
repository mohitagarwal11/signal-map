export default function DashboardHeader({ onReset }) {
  return (
    <header className="flex h-[46px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--topbar-bg)] px-[25px]">
      <button onClick={onReset} className="border-none bg-transparent text-[25px] font-bold">
        <span>Signal-</span>
        <span className="text-[var(--blue)]">M</span>
      </button>

      <div className="flex items-center gap-1.5">
        Contact me{' '}
        <a
          href="https://www.linkedin.com/in/agarwalmohit11/"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--blue)]"
        >
          here.
        </a>
      </div>
    </header>
  );
}
