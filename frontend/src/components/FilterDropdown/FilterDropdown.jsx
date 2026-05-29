import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "../../assets/Icons";
import "./FilterDropdown.css";

export default function FilterDropdown({
  value,
  options,
  defaultLabel,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const selectedLabel = useMemo(() => {
    if (value === "all") return defaultLabel;

    const option = options.find((item) => item.value === value);

    return option?.label ?? defaultLabel;
  }, [value, options, defaultLabel]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button
        className="filter-dropdown-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        {selectedLabel}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="filter-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`filter-dropdown-item ${
                value === option.value ? "active" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
