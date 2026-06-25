import { useMemo, useState } from 'react';

import Map from '../components/Map.jsx';
import SearchBar from '../components/SearchBar.jsx';
import FilterDropdown from '../components/FilterDropdown.jsx';
import MapBanner from '../components/MapBanner.jsx';

import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardPanel from '../components/DashboardPanel.jsx';

import useBottomSheet from '../utils/useBottomSheet.js';

import { OPERATOR_OPTIONS, NETWORK_OPTIONS } from '../constants/dashboard.js';

import { deriveOperatorMetrics } from '../utils/operatorUtility';
import { deriveNetworkMetrics } from '../utils/networkUtility';
import { getInfrastructureScore } from '../utils/getInfrastructureScore.js';

export default function Dashboard() {
  const [operatorDistribution, setOperatorDistribution] = useState([]);
  const [networkDistribution, setNetworkDistribution] = useState([]);
  const [mapCenter, setMapCenter] = useState({
    lat: 24.4,
    lon: 81.71,
  });

  const [selectedOperator, setSelectedOperator] = useState('all');
  const [selectedNetwork, setSelectedNetwork] = useState('all');

  const [areaKm2, setAreaKm2] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  const { sheetOpen, setSheetOpen, handleTouchStart, handleTouchEnd } = useBottomSheet();

  const {
    operatorDistributionTotal,
    operatorDistributionRowsWithShare,
    recommendedOperatorName,
    recommendedAvailability,
    densityPerKm2,
  } = useMemo(
    () =>
      deriveOperatorMetrics({
        operatorDistribution,
        areaKm2,
      }),
    [operatorDistribution, areaKm2],
  );

  const { networkDistributionRows } = useMemo(
    () =>
      deriveNetworkMetrics({
        networkDistribution,
      }),
    [networkDistribution],
  );

  const infrastructureScore = useMemo(
    () =>
      getInfrastructureScore(operatorDistributionTotal, networkDistribution, operatorDistribution),
    [operatorDistributionTotal, networkDistribution, operatorDistribution],
  );

  const resetMap = () => {
    setFlyTarget({
      lat: 24.4,
      lon: 81.71,
      zoom: 4,
    });

    setSelectedNetwork('all');
    setSelectedOperator('all');
  };

  return (
    <div
      className="flex h-screen w-full min-h-0 flex-col bg-[var(--bg)] text-[var(--text-primary)]"
      style={{
        fontFamily:
          '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
      }}
    >
      <DashboardHeader onReset={resetMap} />

      <div className="flex-1 overflow-hidden min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(340px,30vw,760px)]">
        {/* MAP AREA */}
        <div className="relative min-h-0 min-w-0">
          <MapBanner />

          <SearchBar
            onLocationSelect={(location) => {
              setFlyTarget({
                lat: location.lat,
                lon: location.lon,
                zoom: 12,
              });
            }}
          />

          <div
            className="
              absolute z-[500]
              flex items-center gap-3
              top-4 right-4

              max-[900px]:top-[74px]
              max-[900px]:left-1/2
              max-[900px]:right-auto
              max-[900px]:-translate-x-1/2
            "
          >
            <FilterDropdown
              value={selectedOperator}
              options={OPERATOR_OPTIONS}
              defaultLabel="All Operators"
              onChange={setSelectedOperator}
            />

            <FilterDropdown
              value={selectedNetwork}
              options={NETWORK_OPTIONS}
              defaultLabel="All Networks"
              onChange={setSelectedNetwork}
            />
          </div>

          <Map
            setMapCenter={setMapCenter}
            setOperatorDistribution={setOperatorDistribution}
            setNetworkDistribution={setNetworkDistribution}
            selectedNetwork={selectedNetwork}
            selectedOperator={selectedOperator}
            setAreaKm2={setAreaKm2}
            flyTarget={flyTarget}
          />
        </div>

        {/* SIDE PANEL */}
        <DashboardPanel
          sheetOpen={sheetOpen}
          setSheetOpen={setSheetOpen}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          mapCenter={mapCenter}
          infrastructureScore={infrastructureScore}
          recommendedOperatorName={recommendedOperatorName}
          recommendedAvailability={recommendedAvailability}
          operatorDistributionTotal={operatorDistributionTotal}
          areaKm2={areaKm2}
          densityPerKm2={densityPerKm2}
          operatorDistributionRowsWithShare={operatorDistributionRowsWithShare}
          networkDistributionRows={networkDistributionRows}
        />
      </div>
    </div>
  );
}
