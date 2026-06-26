export default function PanelCard({ children, className = '' }) {
  return (
    <div
      className={`
        rounded-xl border-2 border-(--border)
        bg-white p-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}
