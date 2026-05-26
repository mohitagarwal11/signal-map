import { useState } from "react";
import Map from "../../components/Map.jsx";
import Card from "../../components/Card/Card.jsx";
import {
  ChevronDownIcon,
  LinkIcon,
  MoonIcon,
  HelpIcon,
} from "../../assets/Icons.jsx";

import "./Dashboard.css";

/* default panel data */
const DEFAULT_PANEL = {
  cluster: "India",
  lat: "22.6350",
  lon: "77.2410",
  score: 88,
  scoreLabel: "ELITE",
  recommended: { carrier: "Airtel 5G", availability: "94.2%" },
  towerCount: "12 Active",
  availability5g: "85%",
  avgDistance: "420m",
  heatmapScore: "0.8",
  benchmarks: [
    { carrier: "Airtel", score: "92%", latency: "12ms" },
    { carrier: "Jio", score: "88%", latency: "15ms" },
    { carrier: "Vi", score: "45%", latency: "28ms" },
  ],
};

/* main Dashboard */
export default function Dashboard() {
  const [panelData] = useState(DEFAULT_PANEL);

  const [towerCount, setTowerCount] = useState(2494859);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lon: 0 });

  const [opDropdown, setOpDropdown] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState("All Operators");

  const [techDropdown, setTechDropdown] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("all");

  const operators = [
    "All Operators",
    "Aircel",
    "Airtel",
    "BSNL",
    "Dishnet Wireless",
    "Etisalat DB",
    "HFCL",
    "Indian Railways GSM-R",
    "Jio",
    "Loop Mobile",
    "MTNL",
    "MTS India",
    "S Tel",
    "Tata Docomo",
    "Uninor",
    "Vi",
    "Videocon Telecom",
  ];
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
            {/* <div className="dash-search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Location or Pincode..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div> */}
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
            <Card header="Best Network" value={panelData.bestNetwork} />
            <Card header="Avg. Speed" value={panelData.avgSpeed} />
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
                  <th>LATENCY</th>
                </tr>
              </thead>
              <tbody>
                {panelData.benchmarks.map((b) => (
                  <tr key={b.carrier}>
                    <td className="dash-td-carrier">{b.carrier}</td>
                    <td>{b.score}</td>
                    <td>{b.latency}</td>
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
