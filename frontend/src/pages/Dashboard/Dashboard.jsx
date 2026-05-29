import { useEffect, useRef, useState } from "react";
import Map from "../../components/Map.jsx";
import Card from "../../components/Card/Card.jsx";
import {
  ChevronDownIcon,
  LinkIcon,
  MoonIcon,
  HelpIcon,
  SearchIcon,
} from "../../assets/Icons.jsx";
import MapBanner from "../../components/MapBanner/MapBanner.jsx";
import "./Dashboard.css";
import { deriveOperatorMetrics } from "../../utils/operatorUtility";
import { deriveNetworkMetrics } from "../../utils/networkUtility";
import { getInfrastructureScore } from "../../utils/getInfrastructureScore.js";

/* main Dashboard */
export default function Dashboard() {
  const [operatorDistribution, setOperatorDistribution] = useState([]);
  const [networkDistribution, setNetworkDistribution] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lon: 0 });

  const [opDropdown, setOpDropdown] = useState(false);
  const [techDropdown, setTechDropdown] = useState(false);

  const [selectedOperator, setSelectedOperator] = useState("all");
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [searchVal, setSearchVal] = useState("");

  const [areaKm2, setAreaKm2] = useState(null);
  const [panelHelpOpen, setpanelHelpOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  const panelHelpRef = useRef(null);
  const operatorWrapRef = useRef(null);
  const networkWrapRef = useRef(null);

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

  const selectedNetworkLabel =
    selectedNetwork === "all" ? "All Networks" : selectedNetwork;

  const selectedOperatorLabel =
    selectedOperator === "all" ? "All Operators" : selectedOperator;
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

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target;

      if (
        panelHelpRef.current?.contains(target) ||
        operatorWrapRef.current?.contains(target) ||
        networkWrapRef.current?.contains(target)
      ) {
        return;
      }

      setpanelHelpOpen(false);
      setOpDropdown(false);
      setTechDropdown(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const infrastructureScore = getInfrastructureScore(
    operatorDistributionTotal,
    networkDistribution,
    operatorDistribution,
  );

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
        </div>
      </header>

      {/* main body */}
      <div className="dash-body">
        <div className="dash-map-area">
          <MapBanner />
          {/* search + filters overlay */}
          <div className="dash-map-overlay-left">
            <div className="dash-search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Location or Pincode..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
          </div>

          <div className="dash-map-overlay-right">
            <div className="dash-dropdown-wrap" ref={operatorWrapRef}>
              <button
                className="dash-dropdown-btn"
                type="button"
                onClick={() => setOpDropdown((v) => !v)}
              >
                {selectedOperatorLabel}
                <ChevronDownIcon />
              </button>
              {opDropdown && (
                <div className="dash-dropdown-menu">
                  {operatorOptions.map((operator) => (
                    <div
                      key={operator.value}
                      className={`dash-dropdown-item ${selectedOperator === operator.value ? "active" : ""}`}
                      onClick={() => {
                        setSelectedOperator(operator.value);
                        setOpDropdown(false);
                      }}
                    >
                      {operator.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="dash-dropdown-wrap" ref={networkWrapRef}>
              <button
                className="dash-dropdown-btn"
                type="button"
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
                      className={`dash-dropdown-item ${selectedNetwork === network.value ? "active" : ""}`}
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
            setOperatorDistribution={setOperatorDistribution}
            setNetworkDistribution={setNetworkDistribution}
            selectedNetwork={selectedNetwork}
            selectedOperator={selectedOperator}
            setAreaKm2={setAreaKm2}
          />

          {/* status bar */}
          {/* <div className="dash-statusbar">
            <div className="dash-status-left">
              &copy; 2026 SignalM. Made by{" "}
              <a
                href="https://www.linkedin.com/in/agarwalmohit11/"
                target="_blank"
                className="dash-status-link"
              >
                Mohit Agarwal
              </a>{" "}
              using{" "}
              <a
                href="https://www.linkedin.com/in/agarwalmohit11/"
                target="_blank"
                className="dash-status-link"
              >
                mapmyindia
              </a>
            </div>
          </div> */}
        </div>

        {/* right insight panel */}
        <aside className={`dash-panel${sheetOpen ? " sheet-open" : ""}`}>
          <div
            className="dash-sheet-handle"
            onClick={() => setSheetOpen((v) => !v)}
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
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                <span className="dash-badge">Viewport Insights</span>
                <button
                  className="dash-icon-btn dash-panel-help-btn"
                  type="button"
                  aria-expanded={panelHelpOpen}
                  aria-label="About the data shown here"
                  onClick={() => setpanelHelpOpen((value) => !value)}
                  ref={panelHelpRef}
                >
                  <HelpIcon />
                </button>
                {panelHelpOpen && (
                  <div className="dash-help-popover" role="note">
                    <div className="dash-help-title">Data note</div>
                    <p className="dash-help-body">
                      The data shown here is raw, unfiltered tower data sourced
                      from data.gov.in. It includes records from 2023 or earlier
                      and has not been cleaned, verified, or updated.
                      Discrepancies, inaccuracies or oddities in the data are to
                      be expected. Treat this as a reference snapshot of the
                      telecom infrastructure as it stood in or before 2023.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* header data */}
            {/* <div className="dash-section-label">{displayName}</div> */}
            <p className="dash-panel-header">
              Lat: {mapCenter.lat} | Lon: {mapCenter.lon}
            </p>

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
                {/* <span
                className={`dash-score-badge ${panelData.scoreLabel.toLowerCase()}`}
              >
                {panelData.scoreLabel}
              </span> */}
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
