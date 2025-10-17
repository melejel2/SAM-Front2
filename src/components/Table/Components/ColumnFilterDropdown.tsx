import React, { useRef, useMemo, useCallback, useState } from "react";
import { Checkbox } from "@/components/daisyui";
import { cn } from "@/helpers/utils/cn";

interface ColumnFilterDropdownProps {
    columnKey: string;
    columnLabel: string;
    uniqueValues: string[];
    selectedValues: string[];
    isOpen: boolean;
    searchTerm: string;
    filterDropdownPosition: { top: number; left: number } | null;
    onSearchChange: (value: string) => void;
    onFilterChange: (value: string, checked: boolean) => void;
    onSelectAll: () => void;
    onClear: () => void;
    onToggle: (event?: React.MouseEvent<HTMLButtonElement>) => void;
    onClose: () => void;
}

// Memoized ColumnFilterDropdown component to prevent unnecessary re-renders
const ColumnFilterDropdown = React.memo<ColumnFilterDropdownProps>(({
    columnKey,
    columnLabel,
    uniqueValues,
    selectedValues,
    isOpen,
    searchTerm,
    filterDropdownPosition,
    onSearchChange,
    onFilterChange,
    onSelectAll,
    onClear,
    onToggle,
    onClose
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter unique values based on search term
    const filteredValues = useMemo(() =>
        uniqueValues.filter(value =>
            value.toLowerCase().includes(searchTerm.toLowerCase())
        ), [uniqueValues, searchTerm]
    );

    const selectedValuesSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    const allFilteredSelected = useMemo(() => {
        return filteredValues.length > 0 && filteredValues.every(value => selectedValuesSet.has(value));
    }, [filteredValues, selectedValuesSet]);

    // Auto-focus when dropdown opens
    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle escape key and click outside to close dropdown
    React.useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const dropdownElement = document.querySelector(`[data-filter-dropdown="${columnKey}"]`);
            const buttonElement = document.querySelector(`[data-filter-button="${columnKey}"]`);

            if (dropdownElement && buttonElement) {
                if (!dropdownElement.contains(target) && !buttonElement.contains(target)) {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, columnKey, onClose]);

    try {
        return (
            <div className="relative">
                <button
                    type="button"
                    className={cn(
                        "ml-2 p-1 rounded hover:bg-base-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                        selectedValues.length > 0 ? "text-primary" : "text-base-content/50"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(e);
                    }}
                    data-filter-button={columnKey}
                >
                    <span className="iconify lucide--filter size-3"></span>
                </button>

                {isOpen && (
                    <>
                        {/* Backdrop - Invisible overlay to catch clicks outside */}
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={onClose}
                        />

                        {/* Dropdown */}
                        <div className="fixed bg-base-100 border border-base-300 rounded-md shadow-lg z-50 min-w-48 max-h-80 overflow-hidden"
                            style={{
                                top: filterDropdownPosition?.top ? `${filterDropdownPosition.top}px` : '0px',
                                left: filterDropdownPosition?.left ? `${filterDropdownPosition.left}px` : '0px'
                            }}
                            data-filter-dropdown={columnKey}>
                            <div className="p-3 border-b border-base-300">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Filter {columnLabel}</span>
                                    <button
                                        type="button"
                                        className="text-xs text-base-content/60 hover:text-base-content focus:outline-none focus:ring-1 focus:ring-base-content/30 rounded p-1"
                                        onClick={onClose}
                                        aria-label="Close filter"
                                    >
                                        <span className="iconify lucide--x size-4"></span>
                                    </button>
                                </div>

                                {/* Search input */}
                                <div className="mb-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Search options..."
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="input input-xs w-full bg-base-200 border-base-300 focus:border-primary focus:outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        autoComplete="off"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={cn(
                                            "text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1",
                                            filteredValues.length > 0
                                                ? "text-primary hover:text-primary/80"
                                                : "text-base-content/30 cursor-not-allowed"
                                        )}
                                        onClick={onSelectAll}
                                        disabled={filteredValues.length === 0}
                                        title={
                                            filteredValues.length === 0
                                                ? 'No items to select'
                                                : allFilteredSelected
                                                    ? `Deselect all ${filteredValues.length} visible items`
                                                    : `Select all ${filteredValues.length} visible items`
                                        }
                                    >
                                        {allFilteredSelected ? 'Deselect All' : 'Select All'} {filteredValues.length > 0 && `(${filteredValues.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-base-content/60 hover:text-base-content focus:outline-none focus:ring-1 focus:ring-base-content/30 rounded px-1"
                                        onClick={onClear}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {filteredValues.length > 0 ? (
                                    filteredValues.map((value) => (
                                        <label
                                            key={value}
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 cursor-pointer focus-within:bg-base-200 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                size="sm"
                                                checked={selectedValues.includes(value)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onFilterChange(value, e.target.checked);
                                                }}
                                                className="focus:ring-2 focus:ring-primary/20"
                                            />
                                            <span className="text-sm truncate flex-1" title={value}>
                                                {value || "(Empty)"}
                                            </span>
                                        </label>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-sm text-base-content/60">
                                        {searchTerm ? 'No matching options' : 'No values found'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    } catch (error) {
        console.error(`Error in ColumnFilterDropdown for column ${columnKey}:`, error);
        return (
            <div className="relative">
                <button
                    type="button"
                    className="ml-2 p-1 rounded hover:bg-base-300 transition-colors text-base-content/50"
                    disabled
                    title="Filter temporarily unavailable"
                >
                    <span className="iconify lucide--filter-x size-3"></span>
                </button>
            </div>
        );
    }
});

ColumnFilterDropdown.displayName = 'ColumnFilterDropdown';

export default ColumnFilterDropdown;
