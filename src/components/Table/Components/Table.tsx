import React, { useMemo, useState, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "@iconify/react";

import { Button, Pagination, useDialog } from "@/components/daisyui";
import { cn } from "@/helpers/utils/cn";
import SearchInput from "@/components/SearchInput";
import { formatNumber, formatQuantity } from "@/utils/formatters";

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

// Helper function to format cell values based on column type
const formatCellValue = (value: any, columnKey: string): string => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    // SAFETY: Ensure objects are never returned - convert to string or empty
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map(v => typeof v === 'object' ? '' : String(v)).filter(Boolean).join(', ') || '-';
        }
        // Skip complex objects (like Syncfusion documents with width/height/body)
        if ('body' in value || 'sections' in value || ('width' in value && 'height' in value)) {
            return '-';
        }
        // Try to get a meaningful value from the object
        if ('name' in value && typeof value.name === 'string') return value.name;
        if ('label' in value && typeof value.label === 'string') return value.label;
        if ('value' in value && typeof value.value !== 'object') return String(value.value);
        return '-';
    }

    // Numeric columns that should be formatted as currency/amounts
    const amountColumns = ['amount', 'totalAmount', 'total_amount', 'unitPrice', 'unit_price', 'pu', 'price', 'rate', 'advancePayment', 'retention', 'penalty', 'deduction'];

    // Numeric columns that should be formatted as quantities
    const quantityColumns = ['quantity', 'qty', 'qte', 'allocated', 'stockQte', 'transferedQte'];

    const lowerKey = columnKey.toLowerCase();

    // Check if it's an amount column
    if (amountColumns.some(col => lowerKey.includes(col.toLowerCase()))) {
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (!isNaN(numValue)) {
            return formatNumber(numValue);
        }
    }

    // Check if it's a quantity column
    if (quantityColumns.some(col => lowerKey.includes(col.toLowerCase()))) {
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (!isNaN(numValue)) {
            return formatQuantity(numValue);
        }
    }

    return String(value);
};

// Helper function to extract text content from HTML strings
const getTextContent = (value: any): string => {
    try {
        // Handle null, undefined, or empty values
        if (value === null || value === undefined) {
            return '';
        }

        // Handle objects - NEVER return an object, always return a string
        if (typeof value === 'object' && value !== null) {
            // Skip Syncfusion document objects
            if ('body' in value || 'sections' in value || ('width' in value && 'height' in value)) {
                return '';
            }
            // For arrays, join only primitive values
            if (Array.isArray(value)) {
                return value
                    .map(v => (typeof v === 'string' || typeof v === 'number') ? String(v) : '')
                    .filter(Boolean)
                    .join(', ');
            }
            // Try to get meaningful primitive value
            if ('name' in value && typeof value.name === 'string') return value.name;
            if ('label' in value && typeof value.label === 'string') return value.label;
            if ('value' in value && typeof value.value !== 'object') return String(value.value);
            // Default: return empty string for complex objects
            return '';
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
        // Safety: never return an object, always return a string
        if (typeof value === 'object') return '';
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
    unissueAction?: boolean;

    rowActions?: (row: any) => {
        generateAction?: boolean;
        editAction?: boolean;
        deleteAction?: boolean;
        terminateAction?: boolean;
        exportAction?: boolean;
        unissueAction?: boolean;
    };

    customActions?: Array<{
        icon: any;
        label: string;
        onClick: (row: any) => void | Promise<void>;
        className?: string;
        tooltip?: string;
    }>;

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
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Details" | "Export" | "Generate" | "Unissue", Data?: any, extraData?: any) => void | Promise<void>;
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

    // Virtualization options for large lists
    virtualized?: boolean; // Enable virtualization for large datasets
    rowHeight?: number; // Height of each row in pixels (default: 40)
    overscan?: number; // Number of rows to render outside viewport (default: 10)
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
    unissueAction,
    rowActions,
    customActions,
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
    contractIdentifier,
    contractId,
    isNested,
    // Virtualization props
    virtualized = false,
    rowHeight = 40,
    overscan = 10,
}) => {
    const showActionsColumn = actions || previewAction || deleteAction || editAction || detailsAction || exportAction || generateAction || unissueAction || rowActions || (customActions && customActions.length > 0);

    // Consolidated table state
    const [tableState, setTableState] = useState({
        sortColumn: null as string | null,
        sortOrder: "asc" as "asc" | "desc",
        searchQuery: "",
        currentPage: 1,
        selectedRow: undefined as any,
        activeSheetId: externalActiveSheetId ?? sheets[0]?.id ?? 0,
    });

    // Consolidated dialog state
    const [dialogState, setDialogState] = useState({
        dialogType: "Add" as "Add" | "Edit" | "Delete" | "Preview",
        currentRow: null as any | null,
    });

    const { dialogRef, handleShow, handleHide } = useDialog();

    // Consolidated loading state
    const [loadingState, setLoadingState] = useState({
        internalPreviewLoadingRowId: null as string | null,
        editLoadingRowId: null as string | null,
        generateLoadingRowId: null as string | null,
        deleteLoadingRowId: null as string | null,
        unissueLoadingRowId: null as string | null,
    });

    const previewLoadingRowId = externalPreviewLoadingRowId ?? loadingState.internalPreviewLoadingRowId;

    // Consolidated filter state
    const [filterState, setFilterState] = useState({
        columnFilters: {} as Record<string, string[]>,
        openFilterDropdown: null as string | null,
        filterSearchTerms: {} as Record<string, string>,
        filterDropdownPosition: null as {top: number, left: number} | null,
    });

    // Consolidated scroll state
    const [scrollState, setScrollState] = useState({
        canScrollLeft: false,
        canScrollRight: false,
        scrollPercentage: 0,
        showInitialHint: false,
        hintShownOnce: false,
        isMouseDown: false,
        startX: 0,
        scrollLeft: 0,
    });

    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // Destructure for backward compatibility
    const { sortColumn, sortOrder, searchQuery, currentPage, selectedRow, activeSheetId } = tableState;
    const { dialogType, currentRow } = dialogState;
    const { editLoadingRowId, generateLoadingRowId, deleteLoadingRowId, unissueLoadingRowId } = loadingState;
    const { columnFilters, openFilterDropdown, filterSearchTerms, filterDropdownPosition } = filterState;
    const { canScrollLeft, canScrollRight, scrollPercentage, showInitialHint, hintShownOnce, isMouseDown, startX, scrollLeft } = scrollState;

    const handleRowClick = useCallback((row: any) => {
        if (onRowSelect) {
            // Use functional update to prevent re-render loops
            setTableState(prev => {
                // Only update if actually different
                if (prev.selectedRow?.id === row.id) {
                    return prev;
                }
                return { ...prev, selectedRow: row };
            });
            onRowSelect(row);
        }
    }, [onRowSelect]);

    // Synchronize internal selectedRow state with external selectedRowId prop
    React.useEffect(() => {
        if (selectedRowId !== undefined && selectedRowId !== null) {
            const matchingRow = tableData.find(row => row.id == selectedRowId);
            if (matchingRow) {
                setTableState(prev => {
                    // Only update if actually different to prevent re-renders
                    if (prev.selectedRow?.id === matchingRow.id) {
                        return prev;
                    }
                    return { ...prev, selectedRow: matchingRow };
                });
            }
        } else if (selectedRowId === null || selectedRowId === undefined) {
            setTableState(prev => {
                // Only clear if not already null
                return prev.selectedRow ? { ...prev, selectedRow: null } : prev;
            });
        }
    }, [selectedRowId, tableData]);

    // Check scroll capabilities
    const checkScrollCapability = React.useCallback(() => {
        const container = tableContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            const maxScroll = scrollWidth - clientWidth;

            setScrollState(prev => {
                const updates: Partial<typeof prev> = {
                    canScrollLeft: scrollLeft > 0,
                    canScrollRight: scrollLeft < maxScroll,
                };

                // Calculate scroll percentage for gradient opacity
                if (maxScroll > 0) {
                    updates.scrollPercentage = scrollLeft / maxScroll;
                }

                // Show initial hint only once when table becomes scrollable
                if (!prev.hintShownOnce && maxScroll > 0) {
                    updates.hintShownOnce = true;
                    updates.showInitialHint = true;
                    // Hide hint after 3 seconds
                    setTimeout(() => setScrollState(s => ({ ...s, showInitialHint: false })), 3000);
                }

                return { ...prev, ...updates };
            });
        }
    }, []);

    // Mouse drag scrolling handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if not clicking on interactive elements or table rows
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input') || target.closest('tr')) {
            return;
        }

        setScrollState(prev => ({
            ...prev,
            isMouseDown: true,
            startX: e.pageX - (tableContainerRef.current?.offsetLeft || 0),
            scrollLeft: tableContainerRef.current?.scrollLeft || 0,
        }));

        // Prevent text selection while dragging
        e.preventDefault();
    };

    const handleMouseLeave = () => {
        setScrollState(prev => ({ ...prev, isMouseDown: false }));
    };

    const handleMouseUp = () => {
        setScrollState(prev => ({ ...prev, isMouseDown: false }));
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
        const handleGlobalMouseUp = () => setScrollState(prev => ({ ...prev, isMouseDown: false }));
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
        setFilterState(prev => {
            const currentFilters = prev.columnFilters[columnKey] || [];
            return {
                ...prev,
                columnFilters: {
                    ...prev.columnFilters,
                    [columnKey]: checked
                        ? [...currentFilters, value]
                        : currentFilters.filter(v => v !== value)
                }
            };
        });
        setTableState(prev => ({ ...prev, currentPage: 1 })); // Reset to first page when filters change
    }, []);

    // Clear all filters for a column
    const clearColumnFilter = useCallback((columnKey: string) => {
        setFilterState(prev => {
            const newFilters = { ...prev.columnFilters };
            delete newFilters[columnKey];
            return { ...prev, columnFilters: newFilters };
        });
        setTableState(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    // Select all values for a column filter
    const selectAllColumnValues = useCallback((columnKey: string) => {
        const allValues = getUniqueColumnValues(columnKey);
        setFilterState(prev => ({
            ...prev,
            columnFilters: {
                ...prev.columnFilters,
                [columnKey]: allValues
            }
        }));
        setTableState(prev => ({ ...prev, currentPage: 1 }));
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

    // Paginate the data (skip pagination when virtualized)
    const paginatedData = useMemo(() => {
        // When virtualized, don't paginate - virtualizer handles the rendering
        if (virtualized) {
            return sortedData;
        }
        if (rowsPerPage === 0) {
            // If rowsPerPage is 0, show all data without pagination
            return sortedData;
        }
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, rowsPerPage, virtualized]);

    const totalPages = virtualized ? 1 : (rowsPerPage === 0 ? 1 : Math.ceil(sortedData.length / rowsPerPage));

    // Virtual row rendering for large datasets
    const rowVirtualizer = useVirtualizer({
        count: virtualized ? sortedData.length : 0,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => rowHeight,
        overscan: overscan,
        enabled: virtualized,
    });

    const virtualRows = virtualized ? rowVirtualizer.getVirtualItems() : [];
    const totalVirtualSize = virtualized ? rowVirtualizer.getTotalSize() : 0;

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
        setTableState(prev => ({
            ...prev,
            sortOrder: prev.sortColumn === column && prev.sortOrder === "asc" ? "desc" : "asc",
            sortColumn: column,
        }));
    }, []);

    // Search behavior - reset to first page when search changes
    const handleSearchChange = useCallback((value: string) => {
        setTableState(prev => ({
            ...prev,
            searchQuery: value,
            currentPage: 1,
        }));
    }, []);

    // Pagination controls
    const handlePageChange = useCallback((page: number) => {
        setTableState(prev => ({ ...prev, currentPage: page }));
    }, []);

    // Opening the Add/Edit/Preview dialogs
    const openCreateDialog = async () => {
        setDialogState({ dialogType: "Add", currentRow: null });
        // Check if using static dialog for navigation
        if (!dynamicDialog && openStaticDialog) {
            await openStaticDialog("Add");
        } else {
            // Use dynamic dialog for Add actions (needed for file uploads)
            handleShow();
        }
    };

    const openEditDialog = async (row: any) => {
        setDialogState({ dialogType: "Edit", currentRow: row });
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                const rowId = row.id || row.contractId || row.projectId || String(row);
                setLoadingState(prev => ({ ...prev, editLoadingRowId: rowId }));
                try {
                    await openStaticDialog("Edit", row, { contractIdentifier, contractId }); // Pass contract context
                } finally {
                    setLoadingState(prev => ({ ...prev, editLoadingRowId: null }));
                }
            }
        }
    };

    const openGenerateDialog = async (row: any) => {
        if (openStaticDialog) {
            const rowId = row.id || row.contractId || row.projectId || String(row);
            setLoadingState(prev => ({ ...prev, generateLoadingRowId: rowId }));
            try {
                await openStaticDialog("Generate", row, { contractIdentifier, contractId });
            } finally {
                setLoadingState(prev => ({ ...prev, generateLoadingRowId: null }));
            }
        }
    };

    const openPreviewDialog = async (row: any) => {
        // This action is now hardcoded to use the static dialog for navigation purposes.
        if (openStaticDialog) {
            const rowId = row.id || row.contractId || row.projectId || String(row);
            setLoadingState(prev => ({ ...prev, internalPreviewLoadingRowId: rowId }));
            try {
                await openStaticDialog("Preview", row);
            } finally {
                setLoadingState(prev => ({ ...prev, internalPreviewLoadingRowId: null }));
            }
        }
    };

    const openDeleteDialog = async (row: any) => {
        setDialogState({ dialogType: "Delete", currentRow: row });
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                const rowId = row.id || row.contractId || row.projectId || String(row);
                setLoadingState(prev => ({ ...prev, deleteLoadingRowId: rowId }));
                try {
                    await openStaticDialog("Delete", row);
                } finally {
                    setLoadingState(prev => ({ ...prev, deleteLoadingRowId: null }));
                }
            }
        }
    };

    const openUnissueDialog = async (row: any) => {
        if (openStaticDialog) {
            const rowId = row.id || row.contractId || row.projectId || String(row);
            setLoadingState(prev => ({ ...prev, unissueLoadingRowId: rowId }));
            try {
                await openStaticDialog("Unissue", row, { contractIdentifier, contractId });
            } finally {
                setLoadingState(prev => ({ ...prev, unissueLoadingRowId: null }));
            }
        }
    };

    // Handlers for ColumnFilterDropdown component
    const handleFilterSearchChange = useCallback((columnKey: string, value: string) => {
        setFilterState(prev => ({
            ...prev,
            filterSearchTerms: {
                ...prev.filterSearchTerms,
                [columnKey]: value
            }
        }));
    }, []);

    const handleFilterDropdownChange = useCallback((columnKey: string, value: string, checked: boolean) => {
        handleColumnFilterChange(columnKey, value, checked);
        const currentFilters = columnFilters[columnKey] || [];
        if (!checked && currentFilters.length === 1) {
            setFilterState(prev => ({ ...prev, openFilterDropdown: null }));
        }
    }, [columnFilters, handleColumnFilterChange]);

    const handleFilterSelectAll = useCallback((columnKey: string, filteredValues: string[], allSelected: boolean) => {
        if (filteredValues.length === 0) return;

        setFilterState(prev => {
            const currentFilters = prev.columnFilters[columnKey] || [];
            return {
                ...prev,
                columnFilters: {
                    ...prev.columnFilters,
                    [columnKey]: allSelected
                        ? currentFilters.filter(value => !filteredValues.includes(value))
                        : [...new Set([...currentFilters, ...filteredValues])]
                },
                openFilterDropdown: null
            };
        });

        setTableState(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const handleFilterDropdownToggle = useCallback((columnKey: string, event?: React.MouseEvent<HTMLButtonElement>) => {
        // Capture rect BEFORE setState - React SyntheticEvents get nullified after handler returns
        const rect = event?.currentTarget?.getBoundingClientRect();

        setFilterState(prev => {
            const isCurrentlyOpen = prev.openFilterDropdown === columnKey;

            if (isCurrentlyOpen) {
                return {
                    ...prev,
                    filterSearchTerms: {
                        ...prev.filterSearchTerms,
                        [columnKey]: ''
                    },
                    openFilterDropdown: null,
                    filterDropdownPosition: null
                };
            } else {
                return {
                    ...prev,
                    filterDropdownPosition: rect ? {
                        top: rect.bottom + 4,
                        left: rect.left
                    } : null,
                    openFilterDropdown: columnKey
                };
            }
        });
    }, []);

    const handleFilterDropdownClose = useCallback(() => {
        setFilterState(prev => ({
            ...prev,
            openFilterDropdown: null,
            filterDropdownPosition: null
        }));
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
                    
                    <table className="w-full bg-base-100"
                        style={{
                            userSelect: isMouseDown ? 'none' : 'auto',
                            tableLayout: 'fixed'
                        }}>
                        <thead className="bg-base-200 sticky top-0 z-30 shadow-sm">
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
                                            <div className="flex items-center justify-center gap-1">
                                                <div
                                                    className="flex cursor-pointer items-center justify-center"
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
                                                <div>
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
                                ) : virtualized ? (
                                    /* Virtualized rendering for large datasets */
                                    <>
                                        {sortedData.length === 0 ? (
                                            <tr className="hover:bg-base-200">
                                                <td
                                                    colSpan={(columns ? Object.keys(columns).length : 0) + (showActionsColumn ? 1 : 0) + (select ? 1 : 0)}
                                                    className="px-2 sm:px-3 lg:px-4 py-2 text-center text-base-content/60 italic text-xs sm:text-sm">
                                                    No data available
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {/* Top spacer for virtual scroll */}
                                                {virtualRows.length > 0 && virtualRows[0].start > 0 && (
                                                    <tr style={{ height: virtualRows[0].start }}>
                                                        <td colSpan={(columns ? Object.keys(columns).length : 0) + (showActionsColumn ? 1 : 0) + (select ? 1 : 0)}></td>
                                                    </tr>
                                                )}

                                                {/* Virtual rows */}
                                                {virtualRows.map((virtualRow) => {
                                                    const row = sortedData[virtualRow.index];
                                                    const rowAction = rowActions?.(row);
                                                    const isTotal = row.isTotal === true;
                                                    const isSelected = !isTotal && selectedRow?.id === row.id;

                                                    const isTitleRow = !isTotal && (
                                                        row.isTitleRow === true ||
                                                        (
                                                            (!row.unit && !row.unite && !row.Unite) &&
                                                            (!row.unitPrice && !row.unit_price && !row.pu && !row.Pu ||
                                                             row.unitPrice === 0 || row.unit_price === 0 || row.pu === 0 || row.Pu === 0 ||
                                                             row.unitPrice === '0' || row.unit_price === '0' || row.pu === '0' ||
                                                             row.unitPrice === '-' || row.unit_price === '-' || row.pu === '-') &&
                                                            (!row.quantity && !row.qty && !row.qte && !row.Qte ||
                                                             row.quantity === 0 || row.qty === 0 || row.qte === 0 || row.Qte === 0 ||
                                                             row.quantity === '0' || row.qty === '0' || row.qte === '0' ||
                                                             row.quantity === '-' || row.qty === '-' || row.qte === '-')
                                                        )
                                                    );

                                                    return (
                                                        <tr
                                                            key={virtualRow.key}
                                                            data-index={virtualRow.index}
                                                            data-selected={isSelected || undefined}
                                                            data-title-row={isTitleRow || undefined}
                                                            className={cn(
                                                                isTotal
                                                                    ? "bg-base-200 border-t-2 border-base-300 font-bold text-base-content"
                                                                    : "bg-base-100 hover:bg-base-200 cursor-pointer",
                                                                isSelected && !isTotal && "!bg-blue-50 !border-2 !border-blue-300 dark:!bg-blue-900/30 dark:!border-blue-700/50",
                                                                isTitleRow && "font-bold bg-base-100"
                                                            )}
                                                            style={{ height: rowHeight }}
                                                            onClick={() => {
                                                                if (!isTotal) {
                                                                    handleRowClick(row);
                                                                }
                                                            }}
                                                        >
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
                                                                if (isTotal) {
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
                                                                        return (
                                                                            <td
                                                                                key={columnKey}
                                                                                className="px-2 sm:px-3 lg:px-4 py-1 text-xs sm:text-sm font-bold border-t-2 border-base-300 text-center">
                                                                                {formatCellValue(row[columnKey], columnKey)}
                                                                            </td>
                                                                        );
                                                                    } else {
                                                                        return null;
                                                                    }
                                                                }

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
                                                                                {formatCellValue(row[columnKey], columnKey)}
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
                                                                                    className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                                    className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                                    className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                                    className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                                    className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                            {(rowAction?.unissueAction ?? unissueAction) && (
                                                                                <Button
                                                                                    color="ghost"
                                                                                    size="sm"
                                                                                    className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                                    aria-label="Un-issue"
                                                                                    data-tip="Un-issue"
                                                                                    disabled={unissueLoadingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openUnissueDialog(row);
                                                                                    }}>
                                                                                    <span className={`iconify ${unissueLoadingRowId === (row.id || row.contractId || row.projectId || String(row)) ? 'lucide--loader-2 animate-spin' : 'lucide--undo-2'} text-amber-600 size-4`}></span>
                                                                                </Button>
                                                                            )}
                                                                            {(rowAction?.deleteAction ?? deleteAction) && (
                                                                                <Button
                                                                                    color="ghost"
                                                                                    className="text-error/70 hover:bg-error/20 tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                                    className="text-error/70 hover:bg-error/20 tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                            {customActions && customActions.map((action, index) => (
                                                                                <Button
                                                                                    key={index}
                                                                                    color="ghost"
                                                                                    className={`tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0 ${action.className || ''}`}
                                                                                    size="sm"
                                                                                    aria-label={action.label}
                                                                                    data-tip={action.tooltip || action.label}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        action.onClick(row);
                                                                                    }}>
                                                                                    {typeof action.icon === 'string' ? (
                                                                                        <span className={`iconify ${action.icon} size-4`} />
                                                                                    ) : action.icon && typeof action.icon === 'object' && 'body' in action.icon ? (
                                                                                        <Icon icon={action.icon} className="size-4" />
                                                                                    ) : (
                                                                                        action.icon
                                                                                    )}
                                                                                </Button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}

                                                {/* Bottom spacer for virtual scroll */}
                                                {virtualRows.length > 0 && (
                                                    <tr style={{ height: totalVirtualSize - (virtualRows[virtualRows.length - 1]?.end || 0) }}>
                                                        <td colSpan={(columns ? Object.keys(columns).length : 0) + (showActionsColumn ? 1 : 0) + (select ? 1 : 0)}></td>
                                                    </tr>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    /* Standard paginated rendering */
                                    <>
                                        {paginatedData.map((row, index) => {
                                        const rowAction = rowActions?.(row);
                                        const isTotal = row.isTotal === true;
                                        const isSelected = !isTotal && selectedRow?.id === row.id;

                                        // Title row detection: rows with no unit, no unit price, and no quantity
                                        // These are section headers/titles in BOQ data
                                        const isTitleRow = !isTotal && (
                                            row.isTitleRow === true || // Explicit flag
                                            (
                                                // Auto-detect: check for empty unit and zero/empty price and quantity
                                                // Support various field naming conventions
                                                (!row.unit && !row.unite && !row.Unite) &&
                                                (!row.unitPrice && !row.unit_price && !row.pu && !row.Pu ||
                                                 row.unitPrice === 0 || row.unit_price === 0 || row.pu === 0 || row.Pu === 0 ||
                                                 row.unitPrice === '0' || row.unit_price === '0' || row.pu === '0' ||
                                                 row.unitPrice === '-' || row.unit_price === '-' || row.pu === '-') &&
                                                (!row.quantity && !row.qty && !row.qte && !row.Qte ||
                                                 row.quantity === 0 || row.qty === 0 || row.qte === 0 || row.Qte === 0 ||
                                                 row.quantity === '0' || row.qty === '0' || row.qte === '0' ||
                                                 row.quantity === '-' || row.qty === '-' || row.qte === '-')
                                            )
                                        );


                                        return (
                                            <tr
                                                key={index}
                                                data-selected={isSelected || undefined}
                                                data-title-row={isTitleRow || undefined}
                                                className={cn(
                                                    isTotal
                                                        ? "bg-base-200 border-t-2 border-base-300 font-bold text-base-content"
                                                        : "bg-base-100 hover:bg-base-200 cursor-pointer",
                                                    isSelected && !isTotal && "!bg-blue-50 !border-2 !border-blue-300 dark:!bg-blue-900/30 dark:!border-blue-700/50",
                                                    isTitleRow && "font-bold bg-base-100"
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
                                                                    {formatCellValue(row[columnKey], columnKey)}
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
                                                                    {formatCellValue(row[columnKey], columnKey)}
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
                                                                        className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                        className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                        className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                        className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                        className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                {(rowAction?.unissueAction ?? unissueAction) && (
                                                                    <Button
                                                                        color="ghost"
                                                                        size="sm"
                                                                        className="tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
                                                                        aria-label="Un-issue"
                                                                        data-tip="Un-issue"
                                                                        disabled={unissueLoadingRowId === (row.id || row.contractId || row.projectId || String(row))}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openUnissueDialog(row);
                                                                        }}>
                                                                        <span className={`iconify ${unissueLoadingRowId === (row.id || row.contractId || row.projectId || String(row)) ? 'lucide--loader-2 animate-spin' : 'lucide--undo-2'} text-amber-600 size-4`}></span>
                                                                    </Button>
                                                                )}
                                                                {(rowAction?.deleteAction ?? deleteAction) && (
                                                                    <Button
                                                                        color="ghost"
                                                                        className="text-error/70 hover:bg-error/20 tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                        className="text-error/70 hover:bg-error/20 tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0"
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
                                                                {customActions && customActions.map((action, index) => (
                                                                    <Button
                                                                        key={index}
                                                                        color="ghost"
                                                                        className={`tooltip tooltip-bottom z-20 !rounded-sm min-h-0 h-7 w-7 p-0 ${action.className || ''}`}
                                                                        size="sm"
                                                                        aria-label={action.label}
                                                                        data-tip={action.tooltip || action.label}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            action.onClick(row);
                                                                        }}>
                                                                        {typeof action.icon === 'string' ? (
                                                                            <span className={`iconify ${action.icon} size-4`} />
                                                                        ) : action.icon && typeof action.icon === 'object' && 'body' in action.icon ? (
                                                                            <Icon icon={action.icon} className="size-4" />
                                                                        ) : (
                                                                            action.icon
                                                                        )}
                                                                    </Button>
                                                                ))}
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
                {/* Footer with row count for virtualized mode */}
                {virtualized && sortedData.length > 0 && (
                    <div className="flex items-center justify-between px-2 sm:px-3 lg:px-4 py-2 flex-shrink-0 border-t border-base-300 bg-base-100">
                        <div className="text-xs text-base-content/60">
                            {sortedData.length} {sortedData.length === 1 ? 'item' : 'items'}
                            {searchQuery && ` (filtered from ${tableData.length})`}
                        </div>
                    </div>
                )}
                {/* Footer with row count and pagination */}
                {!virtualized && totalPages > 1 && (
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
                                    setTableState(prev => ({ ...prev, activeSheetId: sheet.id }));
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
