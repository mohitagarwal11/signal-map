export default function DashboardHeader({ onReset }) {
  return (
    <header className="flex h-11.5 shrink-0 items-center justify-between border-b border-(--border) bg-(--topbar-bg) px-6">
      <button onClick={onReset} className="border-none bg-transparent text-[25px] font-bold">
        <span>Signal-</span>
        <span className="text-(--blue)">M</span>
      </button>

      <div className="flex items-center gap-1.5">
        Contact me{' '}
        <a
          href="https://www.linkedin.com/in/agarwalmohit11/"
          target="_blank"
          rel="noreferrer"
          className="text-(--blue)"
        >
          here.
        </a>
      </div>
    </header>
  );
}
