import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomTooltipProps {
  content: string;
  children: React.ReactElement;
}

/**
 * Custom tooltip component that renders via React Portal
 * to escape sidebar overflow constraints.
 *
 * Used exclusively in collapsed sidebar state to show navigation item names.
 */
export const CustomTooltip: React.FC<CustomTooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,  // Vertical center
        left: rect.right + 8,              // 8px gap from icon
      });
    }
  }, [isVisible]);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  const tooltip = isVisible
    ? createPortal(
        <div
          className="fixed z-[99999] pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateY(-50%)', // Center vertically
          }}
        >
          <div className="bg-base-content text-base-100 px-3 py-1.5 rounded-md text-sm whitespace-nowrap shadow-lg">
            {content}
          </div>
        </div>,
        document.body // Portal to body to escape sidebar overflow
      )
    : null;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {children}
      {tooltip}
    </div>
  );
};
