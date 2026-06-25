import Card from './Card.jsx';
import HelpPopover from './HelpPopover.jsx';
import { LinkIcon } from '../assets/Icons';

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
      className="relative min-h-0 h-full max-h-full w-full overflow-hidden border-l border-[#dce3ec] bg-slate-50 max-[900px]:fixed max-[900px]:bottom-0 max-[900px]:left-0 max-[900px]:right-0 max-[900px]:z-[900] max-[900px]:h-[100dvh] max-[900px]:rounded-t-2xl max-[900px]:border-l-0 max-[900px]:shadow-2xl"
      style={{
        transform:
          typeof window !== 'undefined' && window.innerWidth <= 900
            ? sheetOpen
              ? 'translateY(220px)'
              : 'translateY(calc(100% - 145px))'
            : undefined,
        transition: 'transform .38s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      <div
        className="hidden cursor-pointer items-center justify-center py-[10px] pb-[14px] max-[900px]:flex"
        onClick={() => setSheetOpen((v) => !v)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-[5px] w-12 rounded-sm bg-slate-300" />
      </div>

      <div className="absolute inset-0 flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden p-4 max-[900px]:static max-[900px]:pb-[250px]">
        <div className="flex justify-center">
          <span className="text-[18px] font-bold tracking-[1px] lg:text-[22px]">{header}</span>

          <HelpPopover header={header} body={body} footer={footer} />
        </div>

        <hr className="my-4 border-t-2 border-[#e2e8f0]" />

        <p className="flex justify-center text-sm text-[#64748b]">
          Lat: {mapCenter.lat} | Lon: {mapCenter.lon}
        </p>

        <PanelCard>
          <div className="flex items-center gap-2 text-[var(--blue)]">
            <LinkIcon />
            <span className="text-xs font-bold">INFRASTRUCTURE SCORE</span>
          </div>

          <div className="mt-2 text-4xl font-bold">
            {infrastructureScore?.toFixed(2) ?? '-'}
            <span className="ml-1 text-lg text-[var(--text-secondary)]">/100</span>
          </div>
        </PanelCard>

        <PanelCard>
          <div className="text-xs font-bold text-[var(--text-muted)]">RECOMMENDED SERVICE</div>

          <div className="mt-2 text-xl font-bold">{recommendedOperatorName}</div>

          <div className="text-sm text-[var(--green)]">{recommendedAvailability} Availability</div>
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
              <td className="border-b border-slate-100 px-3 py-3 font-bold text-[var(--blue)]">
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
              <td className="border-b border-slate-100 px-3 py-3 font-bold text-[var(--blue)]">
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
