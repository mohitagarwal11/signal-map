import Card from './Card.jsx';
import HelpPopover from './HelpPopover.jsx';

import PanelCard from './PanelCard';
import DistributionTable from './DistributionTable';

import { header, body, footer } from '../constants/helpData';

export default function DashboardPanel({
  sheetOpen,
  setSheetOpen,
  handleTouchStart,
  handleTouchEnd,
  mapCenter,
  infrastructureScore,
  recommendedOperatorName,
  recommendedAvailability,
  operatorDistributionTotal,
  areaKm2,
  densityPerKm2,
  operatorDistributionRowsWithShare,
  networkDistributionRows,
}) {
  return (
    <aside
      className={`relative border-l border-[#dce3ec] bg-slate-50 transition-transform duration-380 ease-[cubic-bezier(0.32,0.72,0,1)] max-lg:fixed max-lg:flex max-lg:flex-col max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-900 max-lg:h-dvh max-lg:rounded-t-2xl max-lg:border-l-0 max-lg:shadow-2xl ${
        sheetOpen ? 'max-lg:translate-y-55' : 'max-lg:translate-y-[calc(100%-145px)]'
      }`}
    >
      <div
        className="hidden cursor-pointer items-center justify-center py-2.5 pb-3.5 max-lg:flex"
        onClick={() => setSheetOpen((v) => !v)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-1.25 w-12 rounded-sm bg-slate-300" />
      </div>

      <div className="absolute inset-0 flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden p-4 max-lg:static max-lg:pb-62.5 max-lg:flex-1">
        <div className="flex justify-center">
          <span className="text-[18px] font-bold tracking-[1px] lg:text-[22px]">{header}</span>

          <HelpPopover header={header} body={body} footer={footer} />
        </div>

        <hr className="border-t-2 border-[#e2e8f0]" />

        {/* center of map lat and lon */}
        <p className="flex justify-center text-sm text-[#64748b]">
          Lat: {mapCenter.lat} | Lon: {mapCenter.lon}
        </p>

        {/* best recommended service */}
        <PanelCard>
          <div className="text-xs font-bold text-(--text-muted)">RECOMMENDED SERVICE</div>

          <div className="mt-2 text-xl font-bold">{recommendedOperatorName}</div>

          <div className="text-sm text-(--green)">{recommendedAvailability} Availability</div>
        </PanelCard>

        {/* infra score */}
        <PanelCard>
          <div className="flex items-center gap-2 text-(--blue)">
            <span className="text-xs font-bold">INFRASTRUCTURE SCORE</span>
          </div>

          <div className="mt-2 text-4xl font-bold">
            {infrastructureScore?.toFixed(2) ?? '-'}
            <span className="ml-1 text-lg text-(--text-secondary)">/100</span>
          </div>
        </PanelCard>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
          <Card header="Tower Count" value={operatorDistributionTotal.toLocaleString('en-IN')} />

          <Card
            header="Area Km²"
            value={
              areaKm2 == null
                ? '-'
                : areaKm2.toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })
            }
          />

          <Card header="Density (towers/km²)" value={densityPerKm2?.toFixed(2) ?? '-'} />
        </div>

        <DistributionTable
          title="OPERATOR DISTRIBUTION"
          columns={['OPERATOR', 'TOWER COUNT', '% SHARE']}
          rows={operatorDistributionRowsWithShare.map((b) => (
            <tr key={b.operator_name}>
              <td className="border-b border-slate-100 px-3 py-3 font-bold text---blue)">
                {b.operator_name}
              </td>
              <td className="border-b border-slate-100 px-3 py-3">
                {Number(b.tower_count).toLocaleString('en-IN')}
              </td>
              <td className="border-b border-slate-100 px-3 py-3">{b.shareText}</td>
            </tr>
          ))}
        />

        <DistributionTable
          title="NETWORK DISTRIBUTION"
          columns={['NETWORK', 'TOWER COUNT']}
          rows={networkDistributionRows.map((n) => (
            <tr key={n.radio}>
              <td className="border-b border-slate-100 px-3 py-3 font-bold text-(--blue)">
                {n.radio}
              </td>
              <td className="border-b border-slate-100 px-3 py-3">
                {Number(n.tower_count).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        />
      </div>
    </aside>
  );
}
