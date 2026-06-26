export default function DistributionTable({ title, columns, rows }) {
  return (
    <>
      <div className="mt-1 flex justify-center text-xs font-bold tracking-[0.7px] text-(--text-muted)">
        {title}
      </div>

      <div className="rounded-xl border border-(--border) bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b border-(--border) bg-slate-50 px-3 py-2 text-left text-[9px] font-bold tracking-[0.7px] text-(--text-muted)"
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
