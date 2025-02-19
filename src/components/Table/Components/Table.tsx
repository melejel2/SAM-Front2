import chevronLeftIcon from "@iconify/icons-lucide/chevron-left";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";
import pencilIcon from "@iconify/icons-lucide/pencil";
import previewIcon from "@iconify/icons-lucide/eye";
import plusIcon from "@iconify/icons-lucide/plus";
import searchIcon from "@iconify/icons-lucide/search";
import sortAscIcon from "@iconify/icons-lucide/chevron-up";
import sortDescIcon from "@iconify/icons-lucide/chevron-down";
import trashIcon from "@iconify/icons-lucide/trash";
import React, { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Pagination,
  useDialog,
} from "@/components/daisyui";
import Icon from "@/components/Icon";
import DialogComponent from "./Dialog";
import { cn } from "@/helpers/utils/cn";

interface TableProps {
  tableData: any[];
  columns: Record<string, string>;
  previewColumns?: Record<string, string>;
  actions: boolean;
  showAction?: boolean;
  deleteAction?: boolean;
  editAction?: boolean;
  title: string;
  inputFields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  addBtn?: boolean;
  dynamicDialog?: boolean;
  openStaticDialog?: (type: "Add" | "Edit" | "Preview", Data?: any) => void;
  onRowSelect?: (selectedRow: any) => void;

  // OPTIONAL PROPS for the "Show Available Only" toggle
  showAvailableOnly?: boolean;
  onToggleAvailableOnly?: () => void;

  // Added property for selectable mode
  select?: boolean;
  loading?: boolean; // new prop added
}

const TableComponent: React.FC<TableProps> = ({
  tableData,
  columns,
  previewColumns,
  actions,
  showAction,
  deleteAction,
  editAction,
  inputFields,
  title,
  addBtn,
  dynamicDialog = true,
  openStaticDialog,
  onRowSelect,
  showAvailableOnly,
  onToggleAvailableOnly,
  select, // new prop destructured here
  loading, // new prop destructured here
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Preview">(
    "Add"
  );
  const [currentRow, setCurrentRow] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const { dialogRef, handleShow, handleHide } = useDialog();

  const handleRowClick = (row: any) => {
    if (onRowSelect) {
      onRowSelect(row);
    }
  };

  // Filter the data by search
  const filteredData = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return tableData.filter((d) =>
      Object.values(d).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(lowercasedQuery)
      )
    );
  }, [searchQuery, tableData]);

  // Sort the data by the chosen column
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
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
    setSortOrder((prevOrder) =>
      sortColumn === column && prevOrder === "asc" ? "desc" : "asc"
    );
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
  const openDialog = async () => {
    setDialogType("Add");
    setCurrentRow(null);
    if (dynamicDialog) {
      handleShow();
    } else {
      openStaticDialog && openStaticDialog("Add");
    }
  };

  const openEditDialog = (row: any) => {
    setDialogType("Edit");
    setCurrentRow(row);
    if (dynamicDialog) {
      handleShow();
    } else {
      openStaticDialog && openStaticDialog("Edit", row);
    }
  };

  const openPreviewDialog = async (row: any) => {
    setDialogType("Preview");
    setCurrentRow(row);
    if (dynamicDialog) {
      handleShow();
    } else {
      openStaticDialog && openStaticDialog("Preview", row);
    }
  };

  const handleDelete = (id: number) => {
    console.log(`Delete row with ID: ${id}`);
  };

  const handleSuccess = (data: any) => {
    console.log(data);
    handleHide();
  };

  return (
    <>
      <Card className="bg-base-200 mt-4 shadow">
        <CardBody className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between px-5 pt-5 space-y-4 sm:space-y-0">
            {/* Left side with "New" button and (conditionally) the toggle */}
            <div className="flex items-center space-x-2">
              {addBtn ? (
                <Button
                  onClick={openDialog}
                  className="btn btn-ghost btn-xs h-8 border border-base-content/20"
                >
                  <Icon icon={plusIcon} fontSize={16} />
                  New {title}
                </Button>
              ) : (
                <span className="hidden lg:block"></span>
              )}

              {/* Render the toggle ONLY if both props are provided */}
              {typeof showAvailableOnly === "boolean" &&
                typeof onToggleAvailableOnly === "function" && (
                  <div className="form-control !-ml-1">
                    <label className="cursor-pointer label space-x-2">
                      <span className="label-text">Only Available</span>
                      <input
                        type="checkbox"
                        className="checkbox-xs checkbox checkbox-info"
                        checked={showAvailableOnly}
                        onChange={onToggleAvailableOnly}
                      />
                    </label>
                  </div>
                )}
            </div>

            {/* Right side with search */}
            <div className="form-control flex flex-row items-center rounded-box shadow bg-base-100 px-2">
              <Icon
                icon={searchIcon}
                className="text-base-content/60"
                fontSize={15}
              />
              <Input
                size="sm"
                placeholder="Search data"
                bordered={false}
                borderOffset={false}
                className="w-full focus:border-transparent focus:outline-0"
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
                    <th className="border-b border-base-content/5 px-2 pl-6 py-3 text-sm text-left font-normal">
                      Select
                    </th>
                  )}
                  {Object.entries(columns).map(
                    ([columnKey, columnLabel], index) => (
                      <th
                        key={columnKey}
                        className={cn(
                          "border-b border-base-content/5 px-2 pl-6 py-3 text-sm text-left font-normal",
                          { "pl-6": index === 0 }
                        )}
                      >
                        <div
                          className="flex justify-start items-center cursor-pointer"
                          onClick={() => handleSort(columnKey)}
                        >
                          <span>{columnLabel}</span>
                          {sortColumn === columnKey && (
                            <Icon
                              icon={
                                sortOrder === "asc" ? sortAscIcon : sortDescIcon
                              }
                              className="ml-1"
                              fontSize={14}
                            />
                          )}
                        </div>
                      </th>
                    )
                  )}
                  {actions && (
                    <th className="border-b border-base-content/5 pl-2 pr-6 py-3 text-sm text-right font-normal">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        Object.keys(columns).length +
                        (actions ? 1 : 0) +
                        (select ? 1 : 0)
                      }
                      className="p-2 text-center"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-base-200/40 cursor-pointer"
                      onClick={() => handleRowClick(row)}
                    >
                      {select && (
                        <td className="border-y border-base-content/5 px-2 pl-6 py-3 font-medium text-sm">
                          <input
                            type="checkbox"
                            className="checkbox-xs checkbox checkbox-info ml-2"
                          />
                        </td>
                      )}
                      {Object.keys(columns).map((columnKey) => (
                        <td
                          key={columnKey}
                          className="border-y border-base-content/5 px-2 pl-6 py-3 font-medium text-sm"
                        >
                          {row[columnKey] ?? "-"}
                        </td>
                      ))}
                      {actions && (
                        <td className="border-y border-base-content/5 px-2 py-3 font-medium text-sm text-right pr-6">
                          <div className="inline-flex w-fit">
                            {showAction && (
                              <Button
                                color="ghost"
                                size="sm"
                                shape="square"
                                aria-label="Preview Row"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPreviewDialog(row);
                                }}
                              >
                                <Icon
                                  icon={previewIcon}
                                  className="text-base-content/70"
                                  fontSize={15}
                                />
                              </Button>
                            )}
                            {editAction && (
                              <Button
                                color="ghost"
                                size="sm"
                                shape="square"
                                aria-label="Edit Row"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(row);
                                }}
                              >
                                <Icon
                                  icon={pencilIcon}
                                  className="text-base-content/70"
                                  fontSize={15}
                                />
                              </Button>
                            )}
                            {deleteAction && (
                              <Button
                                color="ghost"
                                className="text-error/70 hover:bg-error/20"
                                size="sm"
                                shape="square"
                                aria-label="Delete Row"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(row.id);
                                }}
                              >
                                <Icon icon={trashIcon} fontSize={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr className="cursor-pointer hover:bg-base-200/40">
                    <td
                      colSpan={
                        Object.keys(columns).length +
                        (actions ? 1 : 0) +
                        (select ? 1 : 0)
                      }
                      className="p-2 text-center"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end px-5 pb-5 pt-3">
              <Pagination>
                <Button
                  type="button"
                  size="sm"
                  aria-label="pagination-prev"
                  className="join-item"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <Icon icon={chevronLeftIcon} fontSize={16} />
                </Button>

                {/* Always show the first page */}
                <Button
                  type="button"
                  size="sm"
                  className={cn("join-item", {
                    "bg-base-100": currentPage === 1,
                  })}
                  active={currentPage === 1}
                  onClick={() => handlePageChange(1)}
                >
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
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  }
                  return null;
                })}

                {currentPage < totalPages - 2 && (
                  <span className="join-item"> </span>
                )}

                {totalPages > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    className={cn("join-item", {
                      "bg-base-100": currentPage === totalPages,
                    })}
                    active={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  aria-label="pagination-next"
                  className="join-item"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <Icon icon={chevronRightIcon} fontSize={16} />
                </Button>
              </Pagination>
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
          onSuccess={handleSuccess}
          inputFields={inputFields}
          title={title}
          previewColumns={previewColumns}
          data={[]}
        />
      )}
    </>
  );
};

export default TableComponent;
