import { useEffect, useRef, useState } from "react";
import { HelpIcon } from "../../assets/Icons";
import "./HelpPopover.css";

export default function HelpPopover({ header, body, footer }) {
  const [open, setOpen] = useState(false);

  const popoverRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!popoverRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div className="help-popover-wrap" ref={popoverRef}>
      <button
        className="dash-icon-btn dash-panel-help-btn"
        type="button"
        aria-expanded={open}
        aria-label="About the data shown here"
        onClick={() => setOpen((v) => !v)}
      >
        <HelpIcon />
      </button>

      {open && (
        <div className="help-popover" role="note">
          <div className="help-popover-title">{header}</div>

          <p className="help-popover-body">{body}</p>

          <p className="help-popover-body help-popover-muted">{footer}</p>
        </div>
      )}
    </div>
  );
}
