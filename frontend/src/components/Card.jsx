export default function Card({ header, value }) {
  return (
    <div className="dash-card min-h-22 flex flex-col justify-center gap-2 border-2 border-(--border) bg-white p-4 rounded-xl">
      <div className="text-[10px] font-bold text-[#94a3b8] tracking-wider">{header}</div>
      <div className="text-xl font-bold text-[#0f172a] leading-tight">{value}</div>
    </div>
  );
}
