import React, { useState, useEffect } from 'react';

interface ReadingGuideOverlayProps {
  active: boolean;
}

export const ReadingGuideOverlay: React.FC<ReadingGuideOverlayProps> = ({ active }) => {
  const [mouseY, setMouseY] = useState(240);

  useEffect(() => {
    if (!active) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ('clientY' in e) {
        setMouseY(e.clientY);
      } else if (e.touches && e.touches[0]) {
        setMouseY(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="reading-guide-line"
      style={{ top: `${Math.max(60, mouseY - 22)}px` }}
      aria-hidden="true"
    />
  );
};
