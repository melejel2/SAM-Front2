import React, { useMemo, useState } from "react";

import { Button, Card, CardBody, Pagination, useDialog, Checkbox } from "@/components/daisyui";
import { cn } from "@/helpers/utils/cn";
import SearchInput from "@/components/SearchInput";

import DialogComponent from "./Dialog";

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
    const [previewLoadingRowId, setPreviewLoadingRowId] = useState<string | null>(null);
    
    // Column filter states
    const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
    const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);

    const handleRowClick = (row: any) => {
        if (onRowSelect) {
            setSelectedRow(row);
            onRowSelect(row);
        }
    };

    // Get unique values for a specific column
    const getUniqueColumnValues = (columnKey: string) => {
        const values = tableData.map(row => row[columnKey]).filter(value => value !== null && value !== undefined);
        const uniqueValues = [...new Set(values)].sort();
        return uniqueValues.map(value => String(value));
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
                Object.values(d).some(
                    (value) => typeof value === "string" && value.toLowerCase().includes(lowercasedQuery),
                ),
            );
        }

        // Apply column filters
        Object.entries(columnFilters).forEach(([columnKey, filterValues]) => {
            if (filterValues.length > 0) {
                data = data.filter(row => {
                    const cellValue = String(row[columnKey] || '');
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
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                openStaticDialog("Add");
            }
        }
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
        setPreviewLoadingRowId(rowId);
        
        if (dynamicDialog) {
            handleShow();
            // Clear loading state after dialog opens
            setPreviewLoadingRowId(null);
        } else {
            if (openStaticDialog) {
                try {
                    await openStaticDialog("Preview", row);
                } finally {
                    // Clear loading state after preview is handled
                    setPreviewLoadingRowId(null);
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
                        setOpenFilterDropdown(isOpen ? null : columnKey);
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
                        <div className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded-md shadow-lg z-20 min-w-48 max-h-64 overflow-hidden">
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
                                
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="text-xs text-primary hover:text-primary/80"
                                        onClick={() => selectAllColumnValues(columnKey)}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-base-content/60 hover:text-base-content"
                                        onClick={() => clearColumnFilter(columnKey)}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            
                            <div className="max-h-48 overflow-y-auto">
                                {uniqueValues.length > 0 ? (
                                    uniqueValues.map((value) => (
                                        <label
                                            key={value}
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-base-200 cursor-pointer"
                                        >
                                            <Checkbox
                                                size="sm"
                                                checked={selectedValues.includes(value)}
                                                onChange={(e) => 
                                                    handleColumnFilterChange(columnKey, value, e.target.checked)
                                                }
                                            />
                                            <span className="text-sm truncate" title={value}>
                                                {value || "(Empty)"}
                                            </span>
                                        </label>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-sm text-base-content/60">
                                        No values found
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
            <Card className="bg-base-100 border-base-200 mt-4 mb-6 border shadow rounded-lg">
                <CardBody className="p-0">
                    <div className="flex flex-col items-start justify-start space-y-4 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        {/* Left side with "New" button and (conditionally) the toggle */}
                        <div className="flex items-center space-x-2">
                            {addBtn ? (
                                <Button
                                    onClick={openCreateDialog}
                                    className="btn btn-primary btn-sm rounded-xl table-new-btn px-4 text-sm transition-all duration-200 text-primary-content">
                                    <span className="iconify lucide--plus size-4"></span>
                                    <span className="text-xs">New {title}</span>
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
                    <div className="overflow-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-base-200/30">
                                <tr className="hover:bg-base-200/50">
                                    {select && (
                                        <th className="border-base-content/10 border-b-2 px-2 py-4 pl-6 text-left text-sm font-semibold text-base-content/80">
                                            Select
                                        </th>
                                    )}
                                    {Object.entries(columns).map(([columnKey, columnLabel], index) => (
                                        <th
                                            key={columnKey}
                                            className={cn(
                                                "border-base-content/10 border-b-2 px-2 py-4 pl-6 text-left text-sm font-semibold text-base-content/80",
                                                { "pl-6": index === 0 },
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
                                        <th className="border-base-content/10 border-b-2 py-4 pr-6 pl-2 text-right text-sm font-semibold text-base-content/80">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={Object.keys(columns).length + (actions ? 1 : 0) + (select ? 1 : 0)}
                                            className="p-2 text-center">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((row, index) => {
                                        const rowAction = rowActions?.(row);

                                        return (
                                            <tr
                                                key={index}
                                                className={cn("hover:bg-base-200/40 cursor-pointer", {
                                                    "bg-base-300": selectedRow?.id === row.id,
                                                })}
                                                onClick={() => handleRowClick(row)}>
                                                {select && (
                                                    <td className="border-base-content/5 border-y px-2 py-3 pl-6 text-sm font-medium">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox-xs checkbox checkbox-info ml-2"
                                                        />
                                                    </td>
                                                )}

                                                {Object.keys(columns).map((columnKey) => (
                                                    <td
                                                        key={columnKey}
                                                        className="border-base-content/5 border-y px-2 py-3 pl-6 text-sm font-medium">
                                                        {(columnKey === 'status' || columnKey === 'type') && typeof row[columnKey] === 'string' && row[columnKey].includes('<span') ? (
                                                            <div dangerouslySetInnerHTML={{ __html: row[columnKey] }} />
                                                        ) : (
                                                            row[columnKey] ?? "-"
                                                        )}
                                                    </td>
                                                ))}

                                                {actions && (
                                                    <td className="border-base-content/5 border-y px-2 py-3 pr-6 text-right text-sm font-medium">
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
                                    <tr className="hover:bg-base-200/40 cursor-pointer">
                                        <td
                                            colSpan={Object.keys(columns).length + (actions ? 1 : 0) + (select ? 1 : 0)}
                                            className="p-2 text-center">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end px-5 pt-3 pb-5">
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
                        <div className="bg-base-100 flex w-full overflow-x-auto">
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
                </CardBody>
            </Card>

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
