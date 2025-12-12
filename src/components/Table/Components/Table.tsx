import React, { useMemo, useState, useCallback, useRef } from "react";

import { Button, Pagination, useDialog } from "@/components/daisyui";
import { cn } from "@/helpers/utils/cn";
import SearchInput from "@/components/SearchInput";

import DialogComponent from "./Dialog";
import ColumnFilterDropdown from "./ColumnFilterDropdown";

// Badge component for status and type rendering
const StatusBadge = ({ value, type }: { value: string; type: 'status' | 'type' }) => {
    const getBadgeClasses = (val: string, badgeType: 'status' | 'type') => {
        const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
        
        if (badgeType === 'status') {
            switch (val.toLowerCase()) {
                case 'editable':
                    return `${baseClasses} bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50`;
                case 'issued':
                    return `${baseClasses} bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50`;
                case 'pending':
                    return `${baseClasses} bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50`;
                case 'active':
                    return `${baseClasses} bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50`;
                case 'terminated':
                    return `${baseClasses} bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50`;
                case 'completed':
                    return `${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50`;
                case 'suspended':
                    return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50`;
                default:
                    return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50`;
            }
        } else {
            switch (val.toLowerCase()) {
                case 'provisoire':
                    return `${baseClasses} bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50`;
                case 'final':
                    return `${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50`;
                case 'rg':
                    return `${baseClasses} bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50`;
                case 'avance':
                    return `${baseClasses} bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/50`;
                default:
                    return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50`;
            }
        }
    };

    return (
        <span className={getBadgeClasses(value, type)}>
            {value}
        </span>
    );
};

// Helper function to extract text content from HTML strings
const getTextContent = (value: any): string => {
    try {
        // Handle null, undefined, or empty values
        if (value === null || value === undefined) {
            return '';
        }
        
        // Handle objects by converting to JSON string (for display purposes)
        if (typeof value === 'object' && value !== null) {
            // For arrays, join them
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            // For objects, try to get a meaningful string representation
            if (value.toString && value.toString !== Object.prototype.toString) {
                return value.toString();
            }
            return JSON.stringify(value);
        }
        
        // Handle HTML strings
        if (typeof value === 'string' && value.includes('<')) {
            const div = document.createElement('div');
            div.innerHTML = value;
            return div.textContent || div.innerText || '';
        }
        
        // Handle all other types
        return String(value);
    } catch (error) {
        console.error('Error in getTextContent:', error, 'Value:', value);
        return String(value || '');
    }
};

interface TableProps {
    tableData: any[];
    columns: Record<string, any>;
    previewColumns?: Record<string, string>;
    actions?: boolean;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    detailsAction?: boolean;
    exportAction?: boolean;
    generateAction?: boolean;

    rowActions?: (row: any) => {
        generateAction?: boolean;
        editAction?: boolean;
        deleteAction?: boolean;
        terminateAction?: boolean;
        exportAction?: boolean;
    };

    title: string;
    inputFields?: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
    }>;
    onSuccess: () => void;

    addBtn?: boolean;
    addBtnText?: string;
    dynamicDialog?: boolean;
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Details" | "Export" | "Generate", Data?: any, extraData?: any) => void | Promise<void>;
    onRowSelect?: (selectedRow: any) => void;

    select?: boolean;
    loading?: boolean;

    editEndPoint?: string;
    createEndPoint?: string;
    deleteEndPoint?: string;
    hasSheets?: boolean;
    sheets?: any[];
    activeSheetId?: number;
    onSheetSelect?: (sheetId: number) => void;
    customHeaderContent?: React.ReactNode;
    rowsPerPage?: number;
    previewLoadingRowId?: string | null;
    exportingRowId?: string | null;
    selectedRowId?: number | string | null;
    onItemCreate?: (item: any) => void | Promise<void>;
    onItemUpdate?: (item: any) => void | Promise<void>;
    onItemDelete?: (item: any) => void | Promise<void>;
    inlineEditable?: boolean;
    onInlineEdit?: (rowId: any, field: string, value: any) => void;

    contractIdentifier?: string; // Added for VO editing navigation
    contractId?: string; // Added for VO editing navigation
    isNested?: boolean;
}

const TableComponent: React.FC<TableProps> = ({
    tableData,
    columns,
    previewColumns,
    actions = false,
    previewAction,
    deleteAction,
    editAction,
    detailsAction,
    generateAction,
    exportAction,
    rowActions,
    inputFields,
    title,
    addBtn,
    addBtnText,
    dynamicDialog = true,
    openStaticDialog,
    onRowSelect,
    select,
    loading,

    editEndPoint,
    createEndPoint,
    deleteEndPoint,

    onSuccess,
    hasSheets = false,
    sheets = [],
    activeSheetId: externalActiveSheetId,
    onSheetSelect,
    customHeaderContent,
    rowsPerPage = 20,
    previewLoadingRowId: externalPreviewLoadingRowId,
    exportingRowId,
    selectedRowId,
    onItemUpdate,
    onItemCreate,
    onItemDelete,
    inlineEditable,
    onInlineEdit,
    contractIdentifier, // Destructure here
    contractId, // Destructure here
    isNested, // Destructure new prop
}) => {
    const showActionsColumn = actions || previewAction || deleteAction || editAction || detailsAction || exportAction || generateAction || rowActions;
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview">("Add");
    const [currentRow, setCurrentRow] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { dialogRef, handleShow, handleHide } = useDialog();
    const [selectedRow, setSelectedRow] = useState<any>();
    const [activeSheetId, setActiveSheetId] = useState<number>(externalActiveSheetId ?? sheets[0]?.id ?? 0);
    const [internalPreviewLoadingRowId, setInternalPreviewLoadingRowId] = useState<string | null>(null);
    const previewLoadingRowId = externalPreviewLoadingRowId ?? internalPreviewLoadingRowId;
    const [editLoadingRowId, setEditLoadingRowId] = useState<string | null>(null);
    const [generateLoadingRowId, setGenerateLoadingRowId] = useState<string | null>(null);
    const [deleteLoadingRowId, setDeleteLoadingRowId] = useState<string | null>(null);
    
    // Column filter states
    const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
    const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
    const [filterSearchTerms, setFilterSearchTerms] = useState<Record<string, string>>({});
    const [filterDropdownPosition, setFilterDropdownPosition] = useState<{top: number, left: number} | null>(null);
    
    // Scroll indicator states
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [showInitialHint, setShowInitialHint] = useState(false);
    const [hintShownOnce, setHintShownOnce] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const handleRowClick = useCallback((row: any) => {
        if (onRowSelect) {
            // Use functional update to prevent re-render loops
            setSelectedRow((prevSelected: any) => {
                // Only update if actually different
                if (prevSelected?.id === row.id) {
                    return prevSelected;
                }
                return row;
            });
            onRowSelect(row);
        }
    }, [onRowSelect]);

    // Synchronize internal selectedRow state with external selectedRowId prop
    React.useEffect(() => {
        if (selectedRowId !== undefined && selectedRowId !== null) {
            const matchingRow = tableData.find(row => row.id == selectedRowId);
            if (matchingRow) {
                setSelectedRow((prevSelected: any) => {
                    // Only update if actually different to prevent re-renders
                    if (prevSelected?.id === matchingRow.id) {
                        return prevSelected;
                    }
                    return matchingRow;
                });
            }
        } else if (selectedRowId === null || selectedRowId === undefined) {
            setSelectedRow((prevSelected: any) => {
                // Only clear if not already null
                return prevSelected ? null : prevSelected;
            });
        }
    }, [selectedRowId, tableData]);

    // Check scroll capabilities
    const checkScrollCapability = React.useCallback(() => {
        const container = tableContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            const maxScroll = scrollWidth - clientWidth;
            
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < maxScroll);
            
            // Calculate scroll percentage for gradient opacity
            if (maxScroll > 0) {
                setScrollPercentage(scrollLeft / maxScroll);
            }
            
            // Show initial hint only once when table becomes scrollable
            if (!hintShownOnce && maxScroll > 0) {
                setHintShownOnce(true);
                setShowInitialHint(true);
                // Hide hint after 3 seconds
                setTimeout(() => setShowInitialHint(false), 3000);
            }
        }
    }, [hintShownOnce]);

    // Mouse drag scrolling handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if not clicking on interactive elements or table rows
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input') || target.closest('tr')) {
            return;
        }
        
        setIsMouseDown(true);
        setStartX(e.pageX - (tableContainerRef.current?.offsetLeft || 0));
        setScrollLeft(tableContainerRef.current?.scrollLeft || 0);
        
        // Prevent text selection while dragging
        e.preventDefault();
    };

    const handleMouseLeave = () => {
        setIsMouseDown(false);
    };

    const handleMouseUp = () => {
        setIsMouseDown(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMouseDown || !tableContainerRef.current) return;
        
        e.preventDefault();
        const x = e.pageX - (tableContainerRef.current.offsetLeft || 0);
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        tableContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    // Cleanup mouse events
    React.useEffect(() => {
        const handleGlobalMouseUp = () => setIsMouseDown(false);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    // Get unique values for a specific column - memoized to prevent recalculation
    const getUniqueColumnValues = useMemo(() => {
        // Create a cache of unique values per column
        const cache: Record<string, string[]> = {};

        return (columnKey: string): string[] => {
            // Return cached value if available
            if (cache[columnKey]) {
                return cache[columnKey];
            }

            try {
                if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
                    return [];
                }

                const values = tableData.map(row => {
                    if (!row || typeof row !== 'object') {
                        return '';
                    }
                    const value = row[columnKey];
                    return getTextContent(value);
                }).filter(value => value !== null && value !== undefined && value !== '');

                const uniqueValues = [...new Set(values)].sort();

                // Cache the result
                cache[columnKey] = uniqueValues;
                return uniqueValues;
            } catch (error) {
                console.error(`Error getting unique values for column ${columnKey}:`, error);
                return [];
            }
        };
    }, [tableData]);

    // Handle column filter changes
    const handleColumnFilterChange = useCallback((columnKey: string, value: string, checked: boolean) => {
        setColumnFilters(prev => {
            const currentFilters = prev[columnKey] || [];
            if (checked) {
                return {
                    ...prev,
                    [columnKey]: [...currentFilters, value]
                };
            } else {
                return {
                    ...prev,
                    [columnKey]: currentFilters.filter(v => v !== value)
                };
            }
        });
        setCurrentPage(1); // Reset to first page when filters change
    }, []);

    // Clear all filters for a column
    const clearColumnFilter = useCallback((columnKey: string) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[columnKey];
            return newFilters;
        });
        setCurrentPage(1);
    }, []);

    // Select all values for a column filter
    const selectAllColumnValues = useCallback((columnKey: string) => {
        const allValues = getUniqueColumnValues(columnKey);
        setColumnFilters(prev => ({
            ...prev,
            [columnKey]: allValues
        }));
        setCurrentPage(1);
    }, [getUniqueColumnValues]);

    // Filter the data by search and column filters - optimized with proper dependencies
    const filteredData = useMemo(() => {
        if (!tableData || tableData.length === 0) {
            return [];
        }

        let data = tableData;

        // Apply search filter
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            data = data.filter((d) =>
                Object.values(d).some((value) => {
                    const textContent = getTextContent(value);
                    return textContent.toLowerCase().includes(lowercasedQuery);
                }),
            );
        }

        // Apply column filters
        const activeFilters = Object.entries(columnFilters).filter(([_, values]) => values.length > 0);
        if (activeFilters.length > 0) {
            data = data.filter(row => {
                return activeFilters.every(([columnKey, filterValues]) => {
                    const cellValue = getTextContent(row[columnKey]);
                    return filterValues.includes(cellValue);
                });
            });
        }

        return data;
    }, [searchQuery, tableData, columnFilters]);

    // Sort the data by the chosen column, with selected row always first
    const sortedData = useMemo(() => {
        let data = [...filteredData];
        
        // Apply column sorting if specified
        if (sortColumn) {
            data = data.sort((a, b) => {
                const aValue = a[sortColumn];
                const bValue = b[sortColumn];

                if (aValue === undefined || bValue === undefined) return 0;

                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
                }

                return 0;
            });
        }
        
        // Always put selected row first, regardless of other sorting
        if (selectedRow) {
            const selectedIndex = data.findIndex(row => row.id === selectedRow.id);
            if (selectedIndex > 0) {
                const [selectedItem] = data.splice(selectedIndex, 1);
                data.unshift(selectedItem);
            }
        }
        
        return data;
    }, [filteredData, sortColumn, sortOrder, selectedRow]);

    // Paginate the data
    const paginatedData = useMemo(() => {
        if (rowsPerPage === 0) {
            // If rowsPerPage is 0, show all data without pagination
            return sortedData;
        }
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, rowsPerPage]);

    const totalPages = rowsPerPage === 0 ? 1 : Math.ceil(sortedData.length / rowsPerPage);

    // Effects for scroll detection - optimized to prevent memory leaks
    React.useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        // Initial check
        checkScrollCapability();

        // Throttled scroll handler to reduce performance impact
        let scrollTimeout: NodeJS.Timeout;
        const handleScroll = () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                checkScrollCapability();
            }, 50); // Throttle to 50ms
        };

        // Throttled resize handler
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                checkScrollCapability();
            }, 100); // Throttle to 100ms
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            if (resizeTimeout) clearTimeout(resizeTimeout);
            container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [checkScrollCapability]); // Only re-attach when checkScrollCapability changes

    // Sorting behavior
    const handleSort = useCallback((column: string) => {
        setSortOrder((prevOrder) => (sortColumn === column && prevOrder === "asc" ? "desc" : "asc"));
        setSortColumn(column);
    }, [sortColumn]);

    // Search behavior - reset to first page when search changes
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    }, []);

    // Pagination controls
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    // Opening the Add/Edit/Preview dialogs
    const openCreateDialog = async () => {
        setDialogType("Add");
        setCurrentRow(null);
        // Check if using static dialog for navigation
        if (!dynamicDialog && openStaticDialog) {
            await openStaticDialog("Add");
        } else {
            // Use dynamic dialog for Add actions (needed for file uploads)
            handleShow();
        }
    };

    const openEditDialog = async (row: any) => {
        setDialogType("Edit");
        setCurrentRow(row);
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                const rowId = row.id || row.contractId || row.projectId || String(row);
                setEditLoadingRowId(rowId);
                try {
                    await openStaticDialog("Edit", row, { contractIdentifier, contractId }); // Pass contract context
                } finally {
                    setEditLoadingRowId(null);
                }
            }
        }
    };

    const openGenerateDialog = async (row: any) => {
        if (openStaticDialog) {
            const rowId = row.id || row.contractId || row.projectId || String(row);
            setGenerateLoadingRowId(rowId);
            try {
                await openStaticDialog("Generate", row, { contractIdentifier, contractId });
            } finally {
                setGenerateLoadingRowId(null);
            }
        }
    };

    const openPreviewDialog = async (row: any) => {
        // This action is now hardcoded to use the static dialog for navigation purposes.
        if (openStaticDialog) {
            const rowId = row.id || row.contractId || row.projectId || String(row);
            setInternalPreviewLoadingRowId(rowId);
            try {
                await openStaticDialog("Preview", row);
            } finally {
                setInternalPreviewLoadingRowId(null);
            }
        }
    };

    const openDeleteDialog = async (row: any) => {
        setDialogType("Delete");
        setCurrentRow(row);
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                const rowId = row.id || row.contractId || row.projectId || String(row);
                setDeleteLoadingRowId(rowId);
                try {
                    await openStaticDialog("Delete", row);
                } finally {
                    setDeleteLoadingRowId(null);
                }
            }
        }
    };

    // Handlers for ColumnFilterDropdown component
    const handleFilterSearchChange = useCallback((columnKey: string, value: string) => {
        setFilterSearchTerms(prev => ({
            ...prev,
            [columnKey]: value
        }));
    }, []);

    const handleFilterDropdownChange = useCallback((columnKey: string, value: string, checked: boolean) => {
        handleColumnFilterChange(columnKey, value, checked);
        const currentFilters = columnFilters[columnKey] || [];
        if (!checked && currentFilters.length === 1) {
            setOpenFilterDropdown(null);
        }
    }, [columnFilters, handleColumnFilterChange]);

    const handleFilterSelectAll = useCallback((columnKey: string, filteredValues: string[], allSelected: boolean) => {
        if (filteredValues.length === 0) return;

        setColumnFilters(prev => {
            const currentFilters = prev[columnKey] || [];
            if (allSelected) {
                return {
                    ...prev,
                    [columnKey]: currentFilters.filter(value => !filteredValues.includes(value))
                };
            } else {
                return {
                    ...prev,
                    [columnKey]: [...new Set([...currentFilters, ...filteredValues])]
                };
            }
        });

        setCurrentPage(1);
        setOpenFilterDropdown(null);
    }, []);

    const handleFilterDropdownToggle = useCallback((columnKey: string, event?: React.MouseEvent<HTMLButtonElement>) => {
        const isCurrentlyOpen = openFilterDropdown === columnKey;

        if (isCurrentlyOpen) {
            setFilterSearchTerms(prev => ({
                ...prev,
                [columnKey]: ''
            }));
            setOpenFilterDropdown(null);
            setFilterDropdownPosition(null);
        } else {
            if (event) {
                const buttonRect = event.currentTarget.getBoundingClientRect();
                setFilterDropdownPosition({
                    top: buttonRect.bottom + 4,
                    left: buttonRect.left
                });
            }
            setOpenFilterDropdown(columnKey);
        }
    }, [openFilterDropdown]);

    const handleFilterDropdownClose = useCallback(() => {
        setOpenFilterDropdown(null);
        setFilterDropdownPosition(null);
    }, []);

    return (
        <>
            <div
                className="bg-base-100 rounded-t-sm border-t border-l border-r border-base-300"
                style={{ height: '100%', width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
                <div className="px-2 sm:px-3 lg:px-4 py-2 border-b border-base-300 flex-shrink-0">
                    <div className="flex items-center gap-4 w-full">
                        {/* Add button (if enabled) */}
                        {addBtn && (
                            <Button
                                onClick={openCreateDialog}
                                className="btn btn-primary btn-sm rounded table-new-btn px-4 text-sm transition-all duration-200 text-primary-content">
                                <span className={`iconify ${addBtnText?.toLowerCase().includes('upload') ? 'lucide--upload' : 'lucide--plus'} size-4`}></span>
                                <span className="text-xs">{addBtnText || `New ${title}`}</span>
                            </Button>
                        )}

                        {/* Custom header content - spans available space */}
                        {customHeaderContent}

                        {/* Right side with search */}
                        <div className="flex items-center gap-4 ml-auto">
                            <SearchInput
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search data"
                                showResultsCount={true}
                                resultsCount={filteredData.length}
                                size="md"
                            />
                        </div>
                    </div>
                </div>
                <div
                    ref={tableContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={cn(
                        "scrollbar-thin scroll-smooth",
                        isMouseDown ? "cursor-grabbing select-none" : "cursor-auto"
                    )}
                    style={{
                        flex: 1,
                        width: '100%',
                        minHeight: 0,
                        maxHeight: '100%',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        position: 'relative',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                    }}
                >
                    
                    {/* Minimal one-time scroll hint */}
                    {showInitialHint && canScrollRight && (
                        <div className={cn(
                            "absolute top-1/2 right-4 -translate-y-1/2 z-20",
                            "bg-base-content/10 backdrop-blur-sm rounded-sm p-2",
                            "transition-all duration-500",
                            showInitialHint ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                        )}>
                            <svg className="w-5 h-5 text-base-content/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    )}
                    
                    <table className="w-full table-auto bg-base-100"
                        style={{
                            userSelect: isMouseDown ? 'none' : 'auto'
                        }}>
                        <thead className="bg-base-200 sticky top-0 z-10">
                            <tr>
                                    {select && (
                                        <th className="px-2 sm:px-3 lg:px-4 py-1 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                            Select
                                        </th>
                                    )}
                                    {columns && Object.entries(columns).map(([columnKey, columnLabel], index) => {
                                        const columnDisplayLabel = typeof columnLabel === 'string' ? columnLabel : columnLabel.label;
                                        
                                        return (
                                        <th
                                            key={columnKey}
                                            className={cn(
                                                "px-2 sm:px-3 lg:px-4 py-1 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider",
                                                { "pl-4": index === 0 },
                                                // Add responsive width classes
                                                columnKey === 'status' || columnKey === 'type' ? 'w-20 sm:w-24' : '',
                                                columnKey === 'contractNumber' || columnKey === 'number' ? 'w-28 sm:w-32' : '',
                                                columnKey === 'amount' || columnKey === 'totalAmount' ? 'w-24 sm:w-28' : ''
                                            )}>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex-1"></div>
                                                <div
                                                    className="flex cursor-pointer items-center justify-center flex-1"
                                                    onClick={() => handleSort(columnKey)}>
                                                    <span>{columnDisplayLabel}</span>
                                                    {sortColumn === columnKey && (
                                                        <span
                                                            className={cn("iconify text-base-content/70 ml-1 size-4", {
                                                                "lucide--chevron-up": sortOrder === "asc",
                                                                "lucide--chevron-down": sortOrder !== "asc",
                                                            })}></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex justify-end">
                                                    <ColumnFilterDropdown
                                                        columnKey={columnKey}
                                                        columnLabel={columnDisplayLabel}
                                                        uniqueValues={getUniqueColumnValues(columnKey)}
                                                        selectedValues={columnFilters[columnKey] || []}
                                                        isOpen={openFilterDropdown === columnKey}
                                                        searchTerm={filterSearchTerms[columnKey] || ''}
                                                        filterDropdownPosition={filterDropdownPosition}
                                                        onSearchChange={(value) => handleFilterSearchChange(columnKey, value)}
                                                        onFilterChange={(value, checked) => handleFilterDropdownChange(columnKey, value, checked)}
                                                        onSelectAll={() => {
                                                            const filteredValues = getUniqueColumnValues(columnKey).filter(v =>
                                                                v.toLowerCase().includes((filterSearchTerms[columnKey] || '').toLowerCase())
                                                            );
                                                            const allSelected = filteredValues.length > 0 &&
                                                                filteredValues.every(v => (columnFilters[columnKey] || []).includes(v));
                                                            handleFilterSelectAll(columnKey, filteredValues, allSelected);
                                                        }}
                                                        onClear={() => clearColumnFilter(columnKey)}
                                                        onToggle={(e) => handleFilterDropdownToggle(columnKey, e)}
                                                        onClose={handleFilterDropdownClose}
                                                    />
                                                </div>
                                            </div>
                                        </th>
                                    )})}
                                    {showActionsColumn && (
                                        <th className="px-2 sm:px-3 lg:px-4 py-1 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider w-24 sm:w-28">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                        <tbody className="divide-y divide-base-300">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={(columns ? Object.keys(columns).length : 0) + (showActionsColumn ? 1 : 0) + (select ? 1 : 0)}
                                            className="px-2 sm:px-3 lg:px-4 py-2 text-center text-base-content/60 text-xs sm:text-sm">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {paginatedData.map((row, index) => {
                                        const rowAction = rowActions?.(row);
                                        const isTotal = row.isTotal === true;
                                        const isSelected = !isTotal && selectedRow?.id === row.id;
                                        

                                        return (
                                            <tr
                                                key={index}
                                                data-selected={isSelected || undefined}
                                                className={cn(
                                                    isTotal 
                                                        ? "bg-base-200 border-t-2 border-base-300 font-bold text-base-content" 
                                                        : "bg-base-100 hover:bg-base-200 cursor-pointer",
                                                    isSelected && !isTotal && "!bg-blue-50 !border-2 !border-blue-300 dark:!bg-blue-900/30 dark:!border-blue-700/50"
                                                )}
                                                onClick={(e) => {
                                                    if (!isTotal) {
                                                        handleRowClick(row);
                                                    }
                                                }}>
                                                {select && (
                                                    <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content w-16 text-center">
                                                        {!isTotal && (
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox-xs checkbox checkbox-info ml-2"
                                                            />
                                                        )}
                                                    </td>
                                                )}

                                                {columns && Object.keys(columns).map((columnKey, colIndex) => {
                                                    // For total row, handle special cases
                                                    if (isTotal) {
                                                        // Show "Total" in the first column and merge all except the last column
                                                        if (colIndex === 0) {
                                                            return (
                                                                <td
                                                                    key={columnKey}
                                                                    className="px-2 sm:px-3 lg:px-4 py-1 text-xs sm:text-sm font-bold border-t-2 border-base-300 text-center"
                                                                    colSpan={Object.keys(columns).length - 1}>
                                                                    Total
                                                                </td>
                                                            );
                                                        } else if (colIndex === Object.keys(columns).length - 1) {
                                                            // Show the total amount in the last column
                                                            return (
                                                                <td
                                                                    key={columnKey}
                                                                    className="px-2 sm:px-3 lg:px-4 py-1 text-xs sm:text-sm font-bold border-t-2 border-base-300 text-center">
                                                                    {row[columnKey] ?? "-"}
                                                                </td>
                                                            );
                                                        } else {
                                                            // Skip other columns as they are merged
                                                            return null;
                                                        }
                                                    }
                                                    
                                                    // Regular row handling
                                                    return (
                                                        <td
                                                            key={columnKey}
                                                            className={cn(
                                                                "px-2 sm:px-3 lg:px-4 py-1 text-xs sm:text-sm text-base-content break-words min-w-0 text-center font-medium",
                                                                columnKey === 'status' || columnKey === 'type' ? 'w-20 sm:w-24' : '',
                                                                columnKey === 'contractNumber' || columnKey === 'number' ? 'w-28 sm:w-32' : '',
                                                                columnKey === 'amount' || columnKey === 'totalAmount' ? 'w-24 sm:w-28' : ''
                                                            )}>
                                                            {(columnKey === 'status' || columnKey === 'type') && row[columnKey] ? (
                                                                <StatusBadge
                                                                    value={getTextContent(row[columnKey])}
                                                                    type={columnKey as 'status' | 'type'}
                                                                />
                                                            ) : (
                                                                <div className="break-words overflow-wrap-anywhere">
                                                                    {row[columnKey] ?? "-"}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {showActionsColumn && (
                                                    <td className="px-2 sm:px-3 lg:px-4 py-1 text-xs sm:text-sm font-medium text-base-content w-24 sm:w-28 text-center">
                                                        {!isTotal && (
                                                            <div className="inline-flex w-fit">
                                                                {previewAction && (
                                                                    <Button
                                                                        color="ghost"
                                                                        size="sm"
                                                                        className="tooltip tooltip-bottom z-50 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        aria-label="Preview Row"
                                                                        data-tip="Preview"
                                                                        disabled={previewLoadingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openPreviewDialog(row);
                                                                        }}>
                                                                        <span className={`iconify ${previewLoadingRowId === (row.id || row.contractId || row.projectId || String(row)) ? 'lucide--loader-2 animate-spin' : 'lucide--eye'} text-base-content/70 size-4`}></span>
                                                                    </Button>
                                                                )}
                                                                {detailsAction && (
                                                                    <Button
                                                                        color="ghost"
                                                                        size="sm"
                                                                        className="tooltip tooltip-bottom z-50 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        aria-label="View Details"
                                                                        data-tip="Details"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openStaticDialog?.("Details", row);
                                                                        }}>
                                                                        <span className="iconify lucide--info text-base-content/70 size-4"></span>
                                                                    </Button>
                                                                )}
                                                                {(rowAction?.editAction ?? editAction) && (
                                                                    <Button
                                                                        color="ghost"
                                                                        size="sm"
                                                                        className="tooltip tooltip-bottom z-50 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        aria-label="Edit Row"
                                                                        data-tip="Edit"
                                                                        disabled={editLoadingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openEditDialog(row);
                                                                        }}>
                                                                        <span className={`iconify ${editLoadingRowId === (row.id || row.contractId || row.projectId || String(row)) ? 'lucide--loader-2 animate-spin' : 'lucide--pencil'} text-base-content/70 size-4`}></span>
                                                                    </Button>
                                                                )}
                                                                {(rowAction?.exportAction ?? exportAction) && (
                                                                    <Button
                                                                        color="ghost"
                                                                        size="sm"
                                                                        className="tooltip tooltip-bottom z-50 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        aria-label="Export"
                                                                        data-tip="Export"
                                                                        disabled={exportingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openStaticDialog?.("Export", row, { contractIdentifier, contractId });
                                                                        }}>
                                                                        <span className={`iconify ${exportingRowId === (row.id || row.contractId || row.projectId || String(row)) ? 'lucide--loader-2 animate-spin' : 'lucide--arrow-up-from-line'} text-base-content/70 text-info size-4`}></span>
                                                                    </Button>
                                                                )}
                                                                {(rowAction?.generateAction ?? generateAction) && (
                                                                    <Button
                                                                        color="ghost"
                                                                        size="sm"
                                                                        className="tooltip tooltip-bottom z-50 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        aria-label="Generate"
                                                                        data-tip="Generate"
                                                                        disabled={generateLoadingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openGenerateDialog(row);
                                                                        }}>
                                                                        <span className={`iconify ${generateLoadingRowId === (row.id || row.contractId || row.projectId || String(row)) ? 'lucide--loader-2 animate-spin' : 'lucide--circle-check-big'} text-base-content/70 text-success size-4`}></span>
                                                                    </Button>
                                                                )}
                                                                {(rowAction?.deleteAction ?? deleteAction) && (
                                                                    <Button
                                                                        color="ghost"
                                                                        className="text-error/70 hover:bg-error/20 tooltip tooltip-bottom z-50 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        size="sm"
                                                                        aria-label="Delete Row"
                                                                        data-tip="Delete"
                                                                        disabled={deleteLoadingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteDialog(row);
                                                                        }}>
                                                                        <span className={`iconify ${deleteLoadingRowId === (row.id || row.contractId || row.projectId || String(row)) ? 'lucide--loader-2 animate-spin' : 'lucide--trash'} size-4`}></span>
                                                                    </Button>
                                                                )}
                                                                {rowAction?.terminateAction && (
                                                                    <Button
                                                                        color="ghost"
                                                                        className="text-error/70 hover:bg-error/20 tooltip tooltip-bottom z-50 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        size="sm"
                                                                        aria-label="Terminate Contract"
                                                                        data-tip="Terminate"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openStaticDialog?.("Terminate", row);
                                                                        }}>
                                                                        <span className="iconify lucide--x-circle size-4"></span>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                        })}

                                        {/* Always add two empty rows at the bottom */}
                                        {paginatedData.length > 0 && (
                                            <>
                                                <tr className="border-t border-base-300">
                                                    <td
                                                        colSpan={(columns ? Object.keys(columns).length : 0) + (showActionsColumn ? 1 : 0) + (select ? 1 : 0)}
                                                        className="px-2 sm:px-3 lg:px-4 py-3">
                                                        &nbsp;
                                                    </td>
                                                </tr>
                                                <tr className="border-t border-base-300">
                                                    <td
                                                        colSpan={(columns ? Object.keys(columns).length : 0) + (showActionsColumn ? 1 : 0) + (select ? 1 : 0)}
                                                        className="px-2 sm:px-3 lg:px-4 py-3">
                                                        &nbsp;
                                                    </td>
                                                </tr>
                                            </>
                                        )}

                                        {/* Show "No data available" message only if there are no rows at all */}
                                        {paginatedData.length === 0 && (
                                            <tr className="hover:bg-base-200">
                                                <td
                                                    colSpan={(columns ? Object.keys(columns).length : 0) + (showActionsColumn ? 1 : 0) + (select ? 1 : 0)}
                                                    className="px-2 sm:px-3 lg:px-4 py-2 text-center text-base-content/60 italic text-xs sm:text-sm">
                                                    No data available
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                    </table>
                </div>
                {/* Footer with row count and pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-end px-2 sm:px-3 lg:px-4 py-2 flex-shrink-0 border-t border-base-300 bg-base-100">
                        {/* Pagination */}
                        <div className="flex items-center">
                                <Pagination className="[&_.join-item]:!rounded-sm">
                                <Button
                                    type="button"
                                    size="sm"
                                    aria-label="pagination-prev"
                                    className="join-item"
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}>
                                    <span className="iconify lucide--chevron-left text-base-content/70 size-4"></span>
                                </Button>

                                {/* Always show the first page */}
                                <Button
                                    type="button"
                                    size="sm"
                                    className={cn("join-item", {
                                        "bg-base-100": currentPage === 1,
                                    })}
                                    active={currentPage === 1}
                                    onClick={() => handlePageChange(1)}>
                                    1
                                </Button>

                                {currentPage > 3 && <span className="join-item"> </span>}

                                {Array.from({ length: 3 }, (_, index) => {
                                    const page = currentPage - 1 + index;
                                    if (page > 1 && page < totalPages) {
                                        return (
                                            <Button
                                                type="button"
                                                key={page}
                                                size="sm"
                                                className={cn("join-item", {
                                                    "bg-base-100": currentPage === page,
                                                })}
                                                active={currentPage === page}
                                                onClick={() => handlePageChange(page)}>
                                                {page}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })}

                                {currentPage < totalPages - 2 && <span className="join-item"> </span>}

                                {totalPages > 1 && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className={cn("join-item", {
                                            "bg-base-100": currentPage === totalPages,
                                        })}
                                        active={currentPage === totalPages}
                                        onClick={() => handlePageChange(totalPages)}>
                                        {totalPages}
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    size="sm"
                                    aria-label="pagination-next"
                                    data-tip="pagination-next"
                                    className="join-item"
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}>
                                    <span className="iconify lucide--chevron-right text-base-content/70 size-4"></span>
                                </Button>
                            </Pagination>
                        </div>
                    </div>
                )}
                {/* Sheets */}
                {hasSheets && (
                    <div className="bg-base-100 flex w-full overflow-x-auto border-t border-base-300 flex-shrink-0">
                        {sheets.map((sheet) => (
                            <span
                                key={sheet.id}
                                className={cn(
                                    "min-w-max cursor-pointer px-3 py-1.5 text-center text-sm transition-all duration-200 relative border-b-2",
                                    sheet.id === activeSheetId
                                        ? sheet.hasData
                                            ? "text-primary border-primary bg-primary/5"
                                            : "text-base-content border-base-content/20 bg-base-200"
                                        : sheet.hasData
                                            ? "text-base-content hover:text-primary border-transparent hover:border-primary/30"
                                            : "text-base-content/50 border-transparent hover:text-base-content/70",
                                )}
                                onClick={() => {
                                    setActiveSheetId(sheet.id);
                                    onSheetSelect?.(sheet.id);
                                }}>
                                {sheet.name}
                                {sheet.itemCount > 0 && (
                                    <span className="ml-1 text-xs opacity-60">
                                        ({sheet.itemCount})
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {(addBtn || showActionsColumn) && (
                <DialogComponent
                    handleHide={handleHide}
                    dialogRef={dialogRef}
                    dialogType={dialogType}
                    current={currentRow}
                    onSuccess={onSuccess}
                    inputFields={inputFields}
                    title={title}
                    previewColumns={previewColumns}
                    data={[]}
                    editEndPoint={editEndPoint}
                    createEndPoint={createEndPoint}
                    deleteEndPoint={deleteEndPoint}
                    onItemCreate={onItemCreate}
                    onItemUpdate={onItemUpdate}
                    onItemDelete={onItemDelete}
                    isNested={isNested}
                />
            )}
        </>
    );
};

export default TableComponent;
