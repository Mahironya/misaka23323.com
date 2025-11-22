import React, { useMemo } from 'react';
import { DotItem } from '../types';
import { COLOR_STYLES } from '../constants';

interface DotProps {
  dot: DotItem;
  row: number;
  col: number;
  isSelected: boolean;
  isSquare: boolean;
  onDown: (r: number, c: number) => void;
  onEnter: (r: number, c: number) => void;
}

export const Dot: React.FC<DotProps> = ({ 
  dot, 
  row, 
  col, 
  isSelected, 
  isSquare, 
  onDown, 
  onEnter 
}) => {
  
  // Calculate a random delay for the spawn animation once on mount
  // This gives the grid refill a more organic, cascading feel
  const animationDelay = useMemo(() => `${Math.random() * 0.3}s`, []);

  const baseClasses = "w-full h-full rounded-full transition-transform duration-300 ease-elastic cursor-pointer relative z-10 shadow-sm";
  const colorClasses = COLOR_STYLES[dot.color];
  
  // Enhanced scaling for selection with elasticity
  // Using scale-75 as base size, then scaling up/down from there
  const transformClasses = isSelected 
    ? "scale-90" // Selected: slightly larger than base, smaller than hover
    : "scale-75 hover:scale-90 active:scale-95"; // Base state

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onDown(row, col);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    e.preventDefault();
    onEnter(row, col);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const isTouch = e.pointerType === 'touch';
    const isDragging = e.buttons > 0 || isTouch;
    if (!isDragging) return;
    e.preventDefault();
    onEnter(row, col);
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center select-none touch-none p-1"
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
    >
      {/* Wrapper handles the enter animation without affecting hit targets or conflicting with inner transforms */}
      <div className="w-full h-full flex items-center justify-center animate-pop-in" style={{ animationDelay }}>
        <div 
            className={`${baseClasses} ${colorClasses} ${transformClasses}`}
        >
        </div>
      </div>
    </div>
  );
};