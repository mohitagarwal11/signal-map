import { useRef, useState } from "react";
import Map from "../../components/Map.jsx";
import Card from "../../components/Card/Card.jsx";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import FilterDropdown from "../../components/FilterDropdown/FilterDropdown.jsx";
import HelpPopover from "../../components/HelpPopover/HelpPopover";
import { LinkIcon } from "../../assets/Icons.jsx";
import MapBanner from "../../components/MapBanner/MapBanner.jsx";
import "./Dashboard.css";
import { deriveOperatorMetrics } from "../../utils/operatorUtility";
import { deriveNetworkMetrics } from "../../utils/networkUtility";
import { getInfrastructureScore } from "../../utils/getInfrastructureScore.js";

import { header, body, footer } from "../../constants/helpData.js";

/* main Dashboard */
export default function Dashboard() {
  const [operatorDistribution, setOperatorDistribution] = useState([]);
  const [networkDistribution, setNetworkDistribution] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lon: 0 });

  const [selectedOperator, setSelectedOperator] = useState("all");
  const [selectedNetwork, setSelectedNetwork] = useState("all");

  const [areaKm2, setAreaKm2] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);

  const [flyTarget, setFlyTarget] = useState(null);

  const operatorOptions = [
    { value: "all", label: "All Operators" },
    { value: "Aircel", label: "Aircel" },
    { value: "Airtel", label: "Airtel" },
    { value: "BSNL", label: "BSNL" },
    { value: "Dishnet Wireless", label: "Dishnet Wireless" },
    { value: "Etisalat DB", label: "Etisalat DB" },
    { value: "HFCL", label: "HFCL" },
    {
      value: "Indian Railways GSM-R",
      label: "Indian Railways GSM-R",
    },
    { value: "Jio", label: "Jio" },
    { value: "Loop Mobile", label: "Loop Mobile" },
    { value: "MTNL", label: "MTNL" },
    { value: "MTS India", label: "MTS India" },
    { value: "S Tel", label: "S Tel" },
    { value: "Tata Docomo", label: "Tata Docomo" },
    { value: "Uninor", label: "Uninor" },
    { value: "Vi", label: "Vi" },
    { value: "Videocon Telecom", label: "Videocon Telecom" },
  ];
  const networkOptions = [
    { value: "all", label: "All Networks" },
    { value: "2G", label: "2G" },
    { value: "3G", label: "3G" },
    { value: "4G", label: "4G" },
    { value: "5G", label: "5G" },
  ];

  const touchStartY = useRef(0);

  const {
    operatorDistributionTotal,
    operatorDistributionRowsWithShare,
    recommendedOperatorName,
    recommendedAvailability,
    densityPerKm2,
  } = deriveOperatorMetrics({ operatorDistribution, areaKm2 });

  const { networkDistributionRows } = deriveNetworkMetrics({
    networkDistribution,
  });

  // console.log("Operator Distribution: ", operatorDistribution);
  // console.log("Network Distribution: ", networkDistribution);

  const infrastructureScore = getInfrastructureScore(
    operatorDistributionTotal,
    networkDistribution,
    operatorDistribution,
  );

  const handleSheetTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const resetMap = () => {
    setFlyTarget({ lat: 22.635, lon: 85.0, zoom: 4 });
    setSelectedNetwork("all");
    setSelectedOperator("all");
  };
  const handleSheetTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - touchStartY.current;

    if (deltaY < -50) {
      setSheetOpen(true);
    }

    if (deltaY > 50) {
      setSheetOpen(false);
    }
  };

  return (
    <div className="dashboard">
      {/* top navigation bar */}
      <header className="dash-topbar">
        <button className="dash-topbar-left" onClick={resetMap}>
          <span className="dash-topbar-left-signal">Signal-</span>
          <span className="dash-topbar-left-M">M</span>
        </button>
        <div className="dash-topbar-right">
          {/* <button className="dash-icon-btn">
            <MoonIcon />
          </button> */}
          <div>
            Contact me{" "}
            <a
              href="https://www.linkedin.com/in/agarwalmohit11/"
              target="_blank"
            >
              here.
            </a>
          </div>
        </div>
      </header>

      {/* main body */}
      <div className="dash-body">
        <div className="dash-map-area">
          {/* the first initial msg to users */}
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
          <div className="dash-map-controls">
            <FilterDropdown
              value={selectedOperator}
              options={operatorOptions}
              defaultLabel="All Operators"
              onChange={setSelectedOperator}
            />

            <FilterDropdown
              value={selectedNetwork}
              options={networkOptions}
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

        {/* right insight panel */}
        <aside className={`dash-panel${sheetOpen ? " sheet-open" : ""}`}>
          <div
            className="dash-sheet-handle"
            onClick={() => setSheetOpen((v) => !v)}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
          >
            <div className="dash-sheet-bar" />
          </div>
          <div className="dash-panel-scroll">
            {/* header */}
            <div
              className="dash-panel-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="dash-badge">Viewport Insights</span>
                <HelpPopover header={header} body={body} footer={footer} />
              </div>
            </div>

            {/* header data */}
            <div style={{}}>
              {/* <div className="dash-display-name">{displayName}</div> */}
              <p className="dash-display-location">
                Lat: {mapCenter.lat} | Lon: {mapCenter.lon}
              </p>
            </div>

            {/* recommended service */}
            <div className="dash-card">
              <div className="dash-rec-label">RECOMMENDED SERVICE</div>
              <div className="dash-rec-body">
                <div className="dash-rec-info">
                  <div className="dash-rec-name">{recommendedOperatorName}</div>
                  <div className="dash-rec-availability">
                    {recommendedAvailability} Availability
                  </div>
                </div>
              </div>
            </div>

            {/* infrastructure score */}
            <div className="dash-card dash-score-card">
              <div className="dash-score-header">
                <LinkIcon />
                <span className="dash-score-label">INFRASTRUCTURE SCORE</span>
              </div>
              <div className="dash-score-body">
                <div className="dash-score-value">
                  <span className="dash-score-num">
                    {infrastructureScore !== null
                      ? infrastructureScore.toFixed(2)
                      : "-"}
                  </span>
                  <span className="dash-score-denom">/100</span>
                </div>
              </div>
            </div>

            {/* stats grid */}
            <div className="dash-stats-grid">
              <Card
                header="Tower Count"
                value={operatorDistributionTotal.toLocaleString("en-IN")}
              />
              <Card
                header="Area Km²"
                value={
                  areaKm2 == null
                    ? "-"
                    : `${areaKm2.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 0,
                      })}`
                }
              />
              <Card
                header="Density (towers/km²)"
                value={densityPerKm2 == null ? "-" : densityPerKm2.toFixed(2)}
              />
            </div>

            {/* operator distribution */}
            <div className="dash-section-label">OPERATOR DISTRIBUTION</div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>OPERATOR</th>
                    <th>TOWER COUNT</th>
                    <th>%.SHARE</th>
                  </tr>
                </thead>
                <tbody>
                  {operatorDistributionRowsWithShare.map((b) => (
                    <tr key={b.operator_name}>
                      <td className="dash-td-carrier">{b.operator_name}</td>
                      <td>{Number(b.tower_count).toLocaleString("en-IN")}</td>
                      <td>{b.shareText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* network distribution */}
            <div className="dash-section-label">NETWORK DISTRIBUTION</div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>NETWORK</th>
                    <th>TOWER COUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {networkDistributionRows.map((network) => (
                    <tr key={network.radio}>
                      <td className="dash-td-carrier">{network.radio}</td>
                      <td>
                        {Number(network.tower_count).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
