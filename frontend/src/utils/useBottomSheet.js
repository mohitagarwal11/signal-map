import { useRef, useState } from 'react';

export default function useBottomSheet() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (deltaY < -50) setSheetOpen(true);
    if (deltaY > 50) setSheetOpen(false);
  };

  return {
    sheetOpen,
    setSheetOpen,
    handleTouchStart,
    handleTouchEnd,
  };
}
