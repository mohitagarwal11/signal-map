import { useState } from "react";
import { RefreshIcon, XIcon } from "../../assets/Icons.jsx";
import "./MapBanner.css";

export default function MapBanner() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem("map_banner_dismissed")
  );

  const dismiss = () => {
    localStorage.setItem("map_banner_dismissed", "1");
    setVisible(false);
  };

  const refresh = () => {
    dismiss();
    window.location.reload();
  };

  if (!visible) return null;

  return (
    <div className="dash-map-banner">
      <span>
        Map/Heatmap not loading? Try refreshing and zooming in and out.
      </span>
      <button onClick={refresh} className="dash-map-banner-refresh">
        <RefreshIcon /> Refresh
      </button>
      <button onClick={dismiss} aria-label="Dismiss">
        <XIcon />
      </button>
    </div>
  );
}
