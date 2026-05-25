import { useState } from "react";
import Map from "../../components/Map.jsx";
import Card from "../../components/Card/Card.jsx";

import "./Dashboard.css";

// svg icons
function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/* default panel data */
const DEFAULT_PANEL = {
  cluster: "South Delhi Cluster",
  lat: "28.5355",
  lon: "77.2410",
  score: 88,
  scoreLabel: "ELITE",
  recommended: { carrier: "Airtel 5G", availability: "94.2%" },
  towerCount: "12 Active",
  availability5g: "85%",
  avgDistance: "420m",
  heatmapScore: "0.8",
  benchmarks: [
    { carrier: "Airtel", score: "92%", lat: "12ms" },
    { carrier: "Jio", score: "88%", lat: "15ms" },
    { carrier: "Vi", score: "45%", lat: "28ms" },
  ],
};

/* main Dashboard */
export default function Dashboard() {
  const [panelData] = useState(DEFAULT_PANEL);

  const [towerCount, setTowerCount] = useState(2494859);
  const [mapCenter, setMapCenter] = useState({ lat: 23.0, lon: 85.0 });

  const [searchVal, setSearchVal] = useState("");

  const [opDropdown, setOpDropdown] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("All Operators");

  const [techDropdown, setTechDropdown] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("all");

  const operators = ["All Operators", "Airtel", "Jio", "Vi"];
  const networkOptions = [
    { value: "all", label: "All Networks" },
    { value: "2G", label: "2G - GSM, CDMA" },
    { value: "3G", label: "3G - UMTS, CDMA" },
    { value: "4G", label: "4G - LTE" },
    { value: "5G", label: "5G - NR" },
  ];

  const selectedNetworkLabel =
    networkOptions.find((network) => network.value === selectedNetwork)
      ?.label ?? "All Networks";

  return (
    <div className="dashboard">
      {/* top navigation bar */}
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <span className="dash-topbar-left-signal">Signal-</span>
          <span className="dash-topbar-left-M">M</span>
        </div>
        <div className="dash-topbar-right">
          <button className="dash-icon-btn">
            <MoonIcon />
          </button>
          <button className="dash-icon-btn">
            <HelpIcon />
          </button>
        </div>
      </header>

      {/* main body */}
      <div className="dash-body">
        <div className="dash-map-area">
          {/* search + filters overlay */}
          <div className="dash-map-overlay">
            {/* search box */}
            <div className="dash-search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Location or Pincode..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
            <div className="dash-dropdown-wrap">
              {/* operator dropdown */}
              <button
                className="dash-dropdown-btn"
                onClick={() => setOpDropdown((v) => !v)}
              >
                {selectedOperator}
                <ChevronDownIcon />
              </button>
              {opDropdown && (
                <div className="dash-dropdown-menu">
                  {operators.map((operator) => (
                    <div
                      key={operator}
                      className={`dash-dropdown-item ${
                        selectedOperator === operator ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedOperator(operator);
                        setOpDropdown(false);
                      }}
                    >
                      {operator}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="dash-dropdown-wrap">
              {/* network dropdown */}
              <button
                className="dash-dropdown-btn"
                onClick={() => setTechDropdown((v) => !v)}
              >
                {selectedNetworkLabel}
                <ChevronDownIcon />
              </button>
              {techDropdown && (
                <div className="dash-dropdown-menu">
                  {networkOptions.map((network) => (
                    <div
                      key={network.value}
                      className={`dash-dropdown-item ${
                        selectedNetwork === network.value ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedNetwork(network.value);
                        setTechDropdown(false);
                      }}
                    >
                      {network.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* map */}
          <Map
            setMapCenter={setMapCenter}
            setTowerCount={setTowerCount}
            selectedNetwork={selectedNetwork}
          />

          {/* status bar */}
          <div className="dash-statusbar">
            <div className="dash-status-left">
              &copy; 2026 SignalM. Made by{" "}
              <a
                href="https://www.linkedin.com/in/agarwalmohit11/"
                target="_blank"
                className="dash-status-link"
              >
                Mohit Agarwal
              </a>
            </div>
          </div>
        </div>

        {/* right insight panel */}
        <aside className="dash-panel">
          {/* header */}
          <div className="dash-panel-header">
            <span className="dash-badge">Live Insights</span>
          </div>

          {/* header data */}
          <h2 className="dash-panel-title">{panelData.cluster}</h2>
          <p className="dash-panel-subtitle">
            Lat: {mapCenter.lat} | Lon: {mapCenter.lon}
          </p>

          {/* connectivity score */}
          <div className="dash-card dash-score-card">
            <div className="dash-score-header">
              <LinkIcon />
              <span className="dash-score-label">CONNECTIVITY SCORE</span>
            </div>
            <div className="dash-score-body">
              <div className="dash-score-value">
                {panelData.score}
                <span className="dash-score-denom">/100</span>
              </div>
              <span
                className={`dash-score-badge ${panelData.scoreLabel.toLowerCase()}`}
              >
                {panelData.scoreLabel}
              </span>
            </div>
          </div>

          {/* recommended service */}
          <div className="dash-card">
            <div className="dash-rec-label">RECOMMENDED SERVICE</div>
            <div className="dash-rec-body">
              <div className="dash-rec-info">
                <div className="dash-rec-name">
                  {panelData.recommended.carrier}
                </div>
                <div className="dash-rec-availability">
                  {panelData.recommended.availability} Availability
                </div>
              </div>
            </div>
          </div>

          {/* stats grid */}
          <div className="dash-stats-grid">
            <Card header="Tower Count" value={towerCount} />
            <Card header="5G Avaibility" value={panelData.availability5g} />
            <Card header="Avg. Speed" value={panelData.avgDistance} />
            <Card header="Heatmap Score" value={panelData.heatmapScore} />
          </div>

          {/* network benchmark */}
          <div className="dash-section-label">NETWORK BENCHMARK</div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>CARRIER</th>
                  <th>LTE/5G</th>
                  <th>LAT.</th>
                </tr>
              </thead>
              <tbody>
                {panelData.benchmarks.map((b) => (
                  <tr key={b.carrier}>
                    <td className="dash-td-carrier">{b.carrier}</td>
                    <td>{b.score}</td>
                    <td>{b.lat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  );
}
