import { useEffect, useRef } from 'react';

export function useClickOutside(onOutside) {
  const ref = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) {
        onOutside();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onOutside]);

  return ref;
}
