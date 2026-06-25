export default function DistributionTable({ title, columns, rows }) {
  return (
    <>
      <div className="mt-1 flex justify-center text-xs font-bold tracking-[0.7px] text-[var(--text-muted)]">
        {title}
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b border-[var(--border)] bg-slate-50 px-3 py-2 text-left text-[9px] font-bold tracking-[0.7px] text-[var(--text-muted)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>{rows}</tbody>
        </table>
      </div>
    </>
  );
}
