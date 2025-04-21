import React, { useMemo, useState } from "react";

import { Button, Card, CardBody, Input, Pagination, useDialog } from "@/components/daisyui";
import { cn } from "@/helpers/utils/cn";

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
    inputFields: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
    }>;
    onSuccess: () => void;

    addBtn?: boolean;
    dynamicDialog?: boolean;
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview", Data?: any) => void;
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
    // const [rowsPerPage] = useState(7);
    const { dialogRef, handleShow, handleHide } = useDialog();
    const [selectedRow, setSelectedRow] = useState<any>();
    const [activeSheetId, setActiveSheetId] = useState<number>(sheets[0]?.id ?? 0);

    const handleRowClick = (row: any) => {
        if (onRowSelect) {
            setSelectedRow(row);
            onRowSelect(row);
        }
    };

    // Filter the data by search
    const filteredData = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return tableData.length > 0
            ? tableData.filter((d) =>
                  Object.values(d).some(
                      (value) => typeof value === "string" && value.toLowerCase().includes(lowercasedQuery),
                  ),
              )
            : [];
    }, [searchQuery, tableData]);

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

    // Search behavior
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
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
        if (dynamicDialog) {
            handleShow();
        } else {
            if (openStaticDialog) {
                openStaticDialog("Preview", row);
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

    return (
        <>
            <Card className="bg-base-100 border-base-200 mt-4 border shadow">
                <CardBody className="p-0">
                    <div className="flex flex-col items-start justify-start space-y-4 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        {/* Left side with "New" button and (conditionally) the toggle */}
                        <div className="flex items-center space-x-2">
                            {addBtn ? (
                                <Button
                                    onClick={openCreateDialog}
                                    className="btn btn-ghost btn-xs border-base-content/20 h-8 border">
                                    <span className="iconify lucide--plus size-4"></span>
                                    New {title}
                                </Button>
                            ) : (
                                <span className="hidden lg:block"></span>
                            )}
                        </div>

                        {/* Right side with search */}
                        <div className="form-control rounded-box bg-base-100 dark:border-base-content/60 text-base-content/60 flex flex-row items-center border px-2">
                            <span className="iconify lucide--search size-4"></span>

                            <Input
                                size="sm"
                                placeholder="Search data"
                                borderOffset={false}
                                className="bg-base-100 w-full border-none focus:border-transparent focus:outline-0"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="hover:bg-base-200/40">
                                    {select && (
                                        <th className="border-base-content/5 border-b px-2 py-3 pl-6 text-left text-sm font-normal">
                                            Select
                                        </th>
                                    )}
                                    {Object.entries(columns).map(([columnKey, columnLabel], index) => (
                                        <th
                                            key={columnKey}
                                            className={cn(
                                                "border-base-content/5 border-b px-2 py-3 pl-6 text-left text-sm font-normal",
                                                { "pl-6": index === 0 },
                                            )}>
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
                                        </th>
                                    ))}
                                    {actions && (
                                        <th className="border-base-content/5 border-b py-3 pr-6 pl-2 text-right text-sm font-normal">
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
                                                        {row[columnKey] ?? "-"}
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
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPreviewDialog(row);
                                                                    }}>
                                                                    <span className="iconify lucide--eye text-base-content/70 size-4"></span>
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
