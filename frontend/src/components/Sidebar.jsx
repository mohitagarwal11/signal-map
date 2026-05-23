import { useState } from "react";
import { Menu, Layers3, BarChart3, Settings } from "lucide-react";

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    { icon: Layers3, label: "Layers" },
    { icon: BarChart3, label: "Analytics" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div
      className={`h-screen bg-zinc-100 border-r transition-all duration-300
      ${expanded ? "w-56" : "w-16"}`}
    >
      <div className="flex flex-col h-full p-2 gap-2">
        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="h-12 rounded-lg flex items-center px-3 hover:bg-zinc-200"
        >
          <Menu size={20} />

          {expanded && <span className="ml-3 text-sm font-medium">Menu</span>}
        </button>

        {/* Nav Items */}
        <div className="flex flex-col gap-2 mt-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={index}
                className="
                  h-12 rounded-lg flex items-center px-3
                  hover:bg-zinc-200 transition-colors
                "
              >
                <Icon size={20} />

                {expanded && <span className="ml-3 text-sm">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
