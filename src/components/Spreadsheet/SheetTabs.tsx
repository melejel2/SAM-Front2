import React from "react";
import { Icon } from "@iconify/react";
import chevronLeftIcon from "@iconify/icons-lucide/chevron-left";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";

export interface SheetTab {
  key: string;
  label: string;
  icon?: string;
  count?: number | string;
}

interface SheetTabsProps {
  tabs: SheetTab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  flushWithGrid?: boolean;
}

/**
 * Slim Excel-like tab bar used below spreadsheet containers.
 */
const SheetTabs: React.FC<SheetTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  className = "",
  flushWithGrid = false
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);

  // Scroll active tab into view when activeKey or tabs change
  React.useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        activeTabRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      });
    }
  }, [activeKey, tabs.length]);

  const scrollByAmount = (delta: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div
      className={`sheet-tabs ${flushWithGrid ? "sheet-tabs-flush" : ""} ${className}`}
      style={{
        backgroundColor: "var(--header-bg)",
        borderTop: "1px solid var(--border-color, #d1d5db)"
      }}
    >
      <button
        type="button"
        className="sheet-tabs-nav-btn"
        onClick={() => scrollByAmount(-180)}
        aria-label="Scroll tabs left"
      >
        <Icon icon={chevronLeftIcon} width={16} height={16} />
      </button>

      <div className="sheet-tabs-scroll" style={{ height: "32px" }} ref={scrollRef}>
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              ref={isActive ? activeTabRef : undefined}
              onClick={() => onChange(tab.key)}
              className={`sheet-tab ${isActive ? "sheet-tab-active" : ""}`}
              style={{
                borderRight: "1px solid var(--border-color, #d1d5db)",
                ...(isActive
                  ? {
                      borderTop: "2px solid oklch(var(--p))",
                      marginTop: "-1px",
                      paddingTop: "calc(0.5rem - 2px)"
                    }
                  : {})
              }}
            >
              {tab.icon && <Icon icon={tab.icon} fontSize={12} />}
              <span className="truncate max-w-[140px]">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`badge badge-xs ${isActive ? "badge-primary" : "badge-ghost"} ml-1`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="sheet-tabs-nav-btn"
        onClick={() => scrollByAmount(180)}
        aria-label="Scroll tabs right"
      >
        <Icon icon={chevronRightIcon} width={16} height={16} />
      </button>
    </div>
  );
};

export default SheetTabs;
