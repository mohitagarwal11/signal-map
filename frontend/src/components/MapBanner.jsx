import { useState } from "react";
import { RefreshIcon, XIcon } from "../assets/Icons.jsx";

export default function MapBanner() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem("map_banner_dismissed"),
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
    <div className="absolute left-1/2 top-1/5 -translate-x-1/2 z-[1000] min-w-65 max-w-80 overflow-wrap-break-word word-break-normal flex items-center gap-2.5 px-3.5 py-2.25 bg-white/95 border border-[#cbd5e1] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur-sm text-sm text-[#374151]">
      <span>
        First load may take upto 30 seconds, free tier servers are waking up.
      </span>
      <button onClick={refresh} className="flex items-center gap-1.25 bg-none border border-[#cbd5e1] rounded-[6px] px-2 py-0.75 text-xs font-semibold text-[#374151] cursor-pointer hover:bg-[#f1f5f9]">
        <RefreshIcon /> Refresh
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="bg-none border-none cursor-pointer text-[#9ca3af] p-0 flex items-center ml-1 hover:text-[#374151]">
        <XIcon />
      </button>
    </div>
  );
}
