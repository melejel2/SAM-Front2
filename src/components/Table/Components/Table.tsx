import React, { useMemo, useState } from "react";

import { Button, Pagination, useDialog, Checkbox } from "@/components/daisyui";
import { cn } from "@/helpers/utils/cn";
import SearchInput from "@/components/SearchInput";
import { PageScrollTracker } from "@/utils/pageScrollTracker";

import DialogComponent from "./Dialog";

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
    if (typeof value === 'string' && value.includes('<')) {
        // Extract text content from HTML
        const div = document.createElement('div');
        div.innerHTML = value;
        return div.textContent || div.innerText || '';
    }
    return String(value || '');
};

interface TableProps {
    tableData: any[];
    columns: Record<string, string>;
    previewColumns?: Record<string, string>;
    actions?: boolean;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    exportAction?: boolean;
    generateAction?: boolean;

    rowActions?: (row: any) => {
        generateAction?: boolean;
        editAction?: boolean;
        deleteAction?: boolean;
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
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview", Data?: any) => void | Promise<void>;
    onRowSelect?: (selectedRow: any) => void;

    select?: boolean;
    loading?: boolean;

    editEndPoint?: string;
    createEndPoint?: string;
    deleteEndPoint?: string;
    hasSheets?: boolean;
    sheets?: any[];
    rowsPerPage?: number;
    previewLoadingRowId?: string | null;
}

const TableComponent: React.FC<TableProps> = ({
    tableData,
    columns,
    previewColumns,
    actions = false,
    previewAction,
    deleteAction,
    editAction,
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
    rowsPerPage = 10,
    previewLoadingRowId: externalPreviewLoadingRowId,
}) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview">("Add");
    const [currentRow, setCurrentRow] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { dialogRef, handleShow, handleHide } = useDialog();
    const [selectedRow, setSelectedRow] = useState<any>();
    const [activeSheetId, setActiveSheetId] = useState<number>(sheets[0]?.id ?? 0);
    const [internalPreviewLoadingRowId, setInternalPreviewLoadingRowId] = useState<string | null>(null);
    const previewLoadingRowId = externalPreviewLoadingRowId ?? internalPreviewLoadingRowId;
    
    // Column filter states
    const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
    const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
    const [filterSearchTerms, setFilterSearchTerms] = useState<Record<string, string>>({});
    const [filterDropdownPosition, setFilterDropdownPosition] = useState<{top: number, left: number} | null>(null);
    
    // Scroll indicator states
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const handleRowClick = (row: any) => {
        if (onRowSelect) {
            setSelectedRow(row);
            onRowSelect(row);
        }
    };

    // Check scroll capabilities
    const checkScrollCapability = React.useCallback(() => {
        const container = tableContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
            
            // Show scroll hint if can scroll right and not shown yet for this page
            const pageKey = PageScrollTracker.generatePageKey();
            if (scrollLeft === 0 && scrollWidth > clientWidth && 
                !showScrollHint && !PageScrollTracker.hasShownScrollHint(pageKey)) {
                setShowScrollHint(true);
                PageScrollTracker.markScrollHintShown(pageKey);
                
                // Smoother scroll movement with better timing
                setTimeout(() => {
                    if (container && container.scrollLeft === 0) {
                        container.scrollTo({ left: 25, behavior: 'smooth' });
                        setTimeout(() => {
                            if (container) {
                                container.scrollTo({ left: 0, behavior: 'smooth' });
                            }
                        }, 600);
                    }
                }, 300);
                // Hide hint after animation
                setTimeout(() => setShowScrollHint(false), 2200);
            }
        }
    }, [showScrollHint]);

    // Mouse drag scrolling handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if not clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) {
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

    // Get unique values for a specific column
    const getUniqueColumnValues = (columnKey: string) => {
        const values = tableData.map(row => {
            const value = row[columnKey];
            return getTextContent(value);
        }).filter(value => value !== null && value !== undefined && value !== '');
        const uniqueValues = [...new Set(values)].sort();
        return uniqueValues;
    };

    // Handle column filter changes
    const handleColumnFilterChange = (columnKey: string, value: string, checked: boolean) => {
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
    };

    // Clear all filters for a column
    const clearColumnFilter = (columnKey: string) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[columnKey];
            return newFilters;
        });
        setCurrentPage(1);
    };

    // Select all values for a column filter
    const selectAllColumnValues = (columnKey: string) => {
        const allValues = getUniqueColumnValues(columnKey);
        setColumnFilters(prev => ({
            ...prev,
            [columnKey]: allValues
        }));
        setCurrentPage(1);
    };

    // Filter the data by search and column filters
    const filteredData = useMemo(() => {
        let data = tableData.length > 0 ? tableData : [];

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
        Object.entries(columnFilters).forEach(([columnKey, filterValues]) => {
            if (filterValues.length > 0) {
                data = data.filter(row => {
                    const cellValue = getTextContent(row[columnKey]);
                    return filterValues.includes(cellValue);
                });
            }
        });

        return data;
    }, [searchQuery, tableData, columnFilters]);

    // Sort the data by the chosen column
    const sortedData = useMemo(() => {
        if (!sortColumn) return filteredData;
        return [...filteredData].sort((a, b) => {
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
    }, [filteredData, sortColumn, sortOrder]);

    // Paginate the data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);

    // Effects for scroll detection
    React.useEffect(() => {
        const container = tableContainerRef.current;
        if (container) {
            checkScrollCapability();
            
            const handleScroll = () => {
                checkScrollCapability();
            };
            
            const handleResize = () => {
                checkScrollCapability();
            };
            
            container.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', handleResize);
            
            return () => {
                container.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [paginatedData, showScrollHint, checkScrollCapability]);

    // Sorting behavior
    const handleSort = (column: string) => {
        setSortOrder((prevOrder) => (sortColumn === column && prevOrder === "asc" ? "desc" : "asc"));
        setSortColumn(column);
    };

    // Search behavior - reset to first page when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    // Pagination controls
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Opening the Add/Edit/Preview dialogs
    const openCreateDialog = async () => {
        setDialogType("Add");
        setCurrentRow(null);
        // Always use dynamic dialog for Add actions (needed for file uploads)
        handleShow();
    };

    const openEditDialog = (row: any) => {
        setDialogType("Edit");
        setCurrentRow(row);
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                openStaticDialog("Edit", row);
            }
        }
    };

    const openPreviewDialog = async (row: any) => {
        setDialogType("Preview");
        setCurrentRow(row);
        
        // Set loading state for this specific row
        const rowId = row.id || row.contractId || row.projectId || String(row);
        setInternalPreviewLoadingRowId(rowId);
        
        if (dynamicDialog) {
            handleShow();
            // Clear loading state after dialog opens
            setInternalPreviewLoadingRowId(null);
        } else {
            if (openStaticDialog) {
                try {
                    await openStaticDialog("Preview", row);
                } finally {
                    // Clear loading state after preview is handled
                    setInternalPreviewLoadingRowId(null);
                }
            }
        }
    };

    const openDeleteDialog = (row: any) => {
        setDialogType("Delete");
        setCurrentRow(row);
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                openStaticDialog("Delete", row);
            }
        }
    };

    // Column Filter Dropdown Component
    const ColumnFilterDropdown = ({ columnKey, columnLabel }: { columnKey: string; columnLabel: string }) => {
        const uniqueValues = getUniqueColumnValues(columnKey);
        const selectedValues = columnFilters[columnKey] || [];
        const isOpen = openFilterDropdown === columnKey;
        const searchTerm = filterSearchTerms[columnKey] || '';

        // Filter unique values based on search term
        const filteredValues = uniqueValues.filter(value => 
            value.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const handleSearchChange = (value: string) => {
            setFilterSearchTerms(prev => ({
                ...prev,
                [columnKey]: value
            }));
        };

        const handleFilterChange = (value: string, checked: boolean) => {
            handleColumnFilterChange(columnKey, value, checked);
            // Close dropdown if unchecking the last item or if this is the first item being checked
            if (!checked && selectedValues.length === 1) {
                setOpenFilterDropdown(null);
            }
        };

        const handleSelectAll = () => {
            selectAllColumnValues(columnKey);
            setOpenFilterDropdown(null);
        };

        const handleClear = () => {
            clearColumnFilter(columnKey);
            setOpenFilterDropdown(null);
        };

        const handleDropdownToggle = (event?: React.MouseEvent<HTMLButtonElement>) => {
            if (isOpen) {
                // Clear search when closing
                setFilterSearchTerms(prev => ({
                    ...prev,
                    [columnKey]: ''
                }));
                setOpenFilterDropdown(null);
                setFilterDropdownPosition(null);
            } else {
                // Calculate position for dropdown
                if (event) {
                    const buttonRect = event.currentTarget.getBoundingClientRect();
                    setFilterDropdownPosition({
                        top: buttonRect.bottom + 4,
                        left: buttonRect.left
                    });
                }
                setOpenFilterDropdown(columnKey);
            }
        };

        return (
            <div className="relative">
                <button
                    type="button"
                    className={cn(
                        "ml-2 p-1 rounded hover:bg-base-300 transition-colors",
                        selectedValues.length > 0 ? "text-primary" : "text-base-content/50"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDropdownToggle(e);
                    }}
                >
                    <span className="iconify lucide--filter size-3"></span>
                </button>
                
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenFilterDropdown(null)}
                        />
                        
                        {/* Dropdown */}
                        <div className="fixed bg-base-100 border border-base-300 rounded-md shadow-lg z-50 min-w-48 max-h-80 overflow-hidden"
                             style={{
                                 top: filterDropdownPosition?.top ? `${filterDropdownPosition.top}px` : '0px',
                                 left: filterDropdownPosition?.left ? `${filterDropdownPosition.left}px` : '0px'
                             }}>
                            <div className="p-3 border-b border-base-300">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Filter {columnLabel}</span>
                                    <button
                                        type="button"
                                        className="text-xs text-base-content/60 hover:text-base-content"
                                        onClick={() => setOpenFilterDropdown(null)}
                                    >
                                        <span className="iconify lucide--x size-4"></span>
                                    </button>
                                </div>
                                
                                {/* Search input */}
                                <div className="mb-2">
                                    <input
                                        type="text"
                                        placeholder="Search options..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="input input-xs w-full bg-base-200 border-base-300 focus:border-primary focus:outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="text-xs text-primary hover:text-primary/80"
                                        onClick={handleSelectAll}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-base-content/60 hover:text-base-content"
                                        onClick={handleClear}
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
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                size="sm"
                                                checked={selectedValues.includes(value)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleFilterChange(value, e.target.checked);
                                                }}
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
    };

    return (
        <>
            <div className="bg-base-100 rounded-xl border border-base-300 flex flex-col max-h-[85vh]">
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-base-300 flex-shrink-0">
                    <div className="flex flex-col items-start justify-start space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        {/* Left side with "New" button and (conditionally) the toggle */}
                        <div className="flex items-center space-x-2">
                            {addBtn ? (
                                <Button
                                    onClick={openCreateDialog}
                                    className="btn btn-primary btn-sm rounded-xl table-new-btn px-4 text-sm transition-all duration-200 text-primary-content">
                                    <span className={`iconify ${addBtnText?.toLowerCase().includes('upload') ? 'lucide--upload' : 'lucide--plus'} size-4`}></span>
                                    <span className="text-xs">{addBtnText || `New ${title}`}</span>
                                </Button>
                            ) : (
                                <span className="hidden lg:block"></span>
                            )}
                        </div>

                        {/* Right side with search */}
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
                <div 
                    ref={tableContainerRef}
                    className={cn(
                        "overflow-x-auto overflow-y-auto flex-1 min-h-0 relative",
                        "scroll-smooth",
                        isMouseDown ? "cursor-grabbing select-none" : "cursor-auto"
                    )}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                    }}
                >
                    {/* Left scroll indicator - no background shadow */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-0 z-10 w-4 pointer-events-none flex items-center justify-center">
                            <div className="w-0.5 h-8 bg-base-content/40 rounded-full animate-fade-in"></div>
                        </div>
                    )}
                    
                    {/* Right scroll indicator - no background shadow */}
                    {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-0 z-10 w-4 pointer-events-none flex items-center justify-center">
                            <div className={cn(
                                "w-0.5 h-8 rounded-full transition-all duration-200",
                                showScrollHint ? "bg-blue-400 animate-smooth-pulse" : "bg-base-content/40 animate-fade-in"
                            )}></div>
                        </div>
                    )}
                    
                    {/* Scroll hint overlay - shows "Scroll →" text */}
                    {showScrollHint && canScrollRight && (
                        <div className="absolute top-2 right-8 z-20 bg-blue-500/90 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none animate-fade-in">
                            Scroll →
                        </div>
                    )}
                    
                    <table className="w-full table-auto"
                        style={{
                            userSelect: isMouseDown ? 'none' : 'auto'
                        }}>
                        <thead className="bg-base-200">
                            <tr>
                                    {select && (
                                        <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                            Select
                                        </th>
                                    )}
                                    {Object.entries(columns).map(([columnKey, columnLabel], index) => (
                                        <th
                                            key={columnKey}
                                            className={cn(
                                                "px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider",
                                                { "pl-6": index === 0 },
                                                // Add responsive width classes
                                                columnKey === 'status' || columnKey === 'type' ? 'w-20 sm:w-24' : '',
                                                columnKey === 'contractNumber' || columnKey === 'number' ? 'w-28 sm:w-32' : '',
                                                columnKey === 'amount' || columnKey === 'totalAmount' ? 'w-24 sm:w-28' : ''
                                            )}>
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className="flex cursor-pointer items-center justify-start"
                                                    onClick={() => handleSort(columnKey)}>
                                                    <span>{columnLabel}</span>
                                                    {sortColumn === columnKey && (
                                                        <span
                                                            className={cn("iconify text-base-content/70 ml-1 size-4", {
                                                                "lucide--chevron-up": sortOrder === "asc",
                                                                "lucide--chevron-down": sortOrder !== "asc",
                                                            })}></span>
                                                    )}
                                                </div>
                                                <ColumnFilterDropdown columnKey={columnKey} columnLabel={columnLabel} />
                                            </div>
                                        </th>
                                    ))}
                                    {actions && (
                                        <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider w-24 sm:w-28">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                        <tbody className="divide-y divide-base-300">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={Object.keys(columns).length + (actions ? 1 : 0) + (select ? 1 : 0)}
                                            className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-center text-base-content/60 text-xs sm:text-sm">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((row, index) => {
                                        const rowAction = rowActions?.(row);

                                        return (
                                            <tr
                                                key={index}
                                                className={cn("hover:bg-base-200 cursor-pointer", {
                                                    "bg-base-300": selectedRow?.id === row.id,
                                                })}
                                                onClick={() => handleRowClick(row)}>
                                                {select && (
                                                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs sm:text-sm font-medium text-base-content w-16">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox-xs checkbox checkbox-info ml-2"
                                                        />
                                                    </td>
                                                )}

                                                {Object.keys(columns).map((columnKey) => (
                                                    <td
                                                        key={columnKey}
                                                        className={cn(
                                                            "px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs sm:text-sm font-medium text-base-content break-words min-w-0",
                                                            columnKey === 'status' || columnKey === 'type' ? 'w-20 sm:w-24' : '',
                                                            columnKey === 'contractNumber' || columnKey === 'number' ? 'w-28 sm:w-32' : '',
                                                            columnKey === 'amount' || columnKey === 'totalAmount' ? 'w-24 sm:w-28' : ''
                                                        )}>
                                                        {typeof row[columnKey] === 'string' && row[columnKey]?.includes('<span class="badge') ? (
                                                            <div dangerouslySetInnerHTML={{ __html: row[columnKey] }} />
                                                        ) : (columnKey === 'status' || columnKey === 'type') && row[columnKey] ? (
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
                                                ))}

                                                {actions && (
                                                    <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-xs sm:text-sm font-medium text-base-content w-24 sm:w-28">
                                                        <div className="inline-flex w-fit">
                                                            {previewAction && (
                                                                <Button
                                                                    color="ghost"
                                                                    size="sm"
                                                                    shape="square"
                                                                    className="tooltip"
                                                                    aria-label="Preview Row"
                                                                    data-tip="Preview"
                                                                    disabled={previewLoadingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPreviewDialog(row);
                                                                    }}>
                                                                    {previewLoadingRowId === (row.id || row.contractId || row.projectId || String(row)) ? (
                                                                        <span className="loading loading-spinner loading-xs"></span>
                                                                    ) : (
                                                                        <span className="iconify lucide--eye text-base-content/70 size-4"></span>
                                                                    )}
                                                                </Button>
                                                            )}
                                                            {(rowAction?.editAction || editAction) && (
                                                                <Button
                                                                    color="ghost"
                                                                    size="sm"
                                                                    shape="square"
                                                                    className="tooltip"
                                                                    aria-label="Edit Row"
                                                                    data-tip="Edit"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditDialog(row);
                                                                    }}>
                                                                    <span className="iconify lucide--pencil text-base-content/70 size-4"></span>
                                                                </Button>
                                                            )}
                                                            {exportAction && (
                                                                <Button
                                                                    color="ghost"
                                                                    size="sm"
                                                                    shape="square"
                                                                    className="tooltip"
                                                                    aria-label="Export"
                                                                    data-tip="Export"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditDialog(row);
                                                                    }}>
                                                                    <span className="iconify lucide--arrow-up-from-line text-base-content/70 text-info size-4"></span>
                                                                </Button>
                                                            )}
                                                            {(rowAction?.generateAction || generateAction) && (
                                                                <Button
                                                                    color="ghost"
                                                                    size="sm"
                                                                    shape="square"
                                                                    className="tooltip"
                                                                    aria-label="Generate"
                                                                    data-tip="Generate"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditDialog(row);
                                                                    }}>
                                                                    <span className="iconify lucide--circle-check-big text-base-content/70 text-success size-4"></span>
                                                                </Button>
                                                            )}
                                                            {(rowAction?.deleteAction || deleteAction) && (
                                                                <Button
                                                                    color="ghost"
                                                                    className="text-error/70 hover:bg-error/20 tooltip"
                                                                    size="sm"
                                                                    shape="square"
                                                                    aria-label="Delete Row"
                                                                    data-tip="Delete"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openDeleteDialog(row);
                                                                    }}>
                                                                    <span className="iconify lucide--trash size-4"></span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr className="hover:bg-base-200 cursor-pointer">
                                        <td
                                            colSpan={Object.keys(columns).length + (actions ? 1 : 0) + (select ? 1 : 0)}
                                            className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-center text-base-content/60 italic text-xs sm:text-sm">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-end px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 flex-shrink-0 border-t border-base-300">
                            <Pagination>
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
                )}
                {/* Sheets */}
                {hasSheets && (
                    <div className="bg-base-100 flex w-full overflow-x-auto border-t border-base-300 flex-shrink-0">
                        {sheets.map((sheet) => (
                            <span
                                key={sheet.id}
                                className={cn(
                                    "min-w-max cursor-pointer px-3 py-1 text-center text-sm transition-colors duration-150",
                                    sheet.id === activeSheetId
                                        ? "bg-base-300 border-base-300 text-base-content"
                                        : "bg-base-200 text-base-content/50 border-base-content/20 hover:bg-base-300",
                                )}
                                onClick={() => setActiveSheetId(sheet.id)}>
                                {sheet.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {(addBtn || actions) && (
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
                />
            )}
        </>
    );
};

export default TableComponent;
