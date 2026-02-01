import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import archiveIcon from "@iconify/icons-lucide/archive";
import editIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash";
import eyeIcon from "@iconify/icons-lucide/eye";
import plusIcon from "@iconify/icons-lucide/plus";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { useDialog } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";
import { useArchive } from "@/contexts/archive";
import { useTopbarContent } from "@/contexts/topbar-content";

import BudgetBOQDialog from "./components/Dialog";
import useBudgetBOQs from "./use-budget-boqs";

interface Project {
    id: number;
    code: string;
    name: string;
    acronym: string;
    city: string;
    currencyId?: number;
    [key: string]: any;
}

const BudgetBOQs = () => {
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select" | "Archive">("Add");
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { setAllContent, clearContent } = useTopbarContent();

    const { isArchiveMode, setArchiveMode } = useArchive();

    const {
        tableData,
        loading,
        getProjectsList,
        createProject,
        updateProject,
        deleteProject,
        archiveProject,
        setSelectedProject: setSelectedProjectInHook,
    } = useBudgetBOQs();
    const { dialogRef, handleShow, handleHide } = useDialog();
    const { toaster } = useToast();

    const handleBackToDashboard = useCallback(() => {
        navigate("/dashboard");
    }, [navigate]);

    useEffect(() => {
        setAllContent(
            <button
                onClick={handleBackToDashboard}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to Dashboard"
            >
                <Icon icon={arrowLeftIcon} className="size-5" />
            </button>,
            null,
            null
        );

        return () => clearContent();
    }, [setAllContent, clearContent, handleBackToDashboard]);

    const openCreateDialog = useCallback(async (
        type: "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select" | "Details" | "Export" | "Generate" | "Unissue" | "Archive",
        data?: any,
    ) => {
        // Navigate to edit page for Edit action using project code instead of ID
        if ((type === "Edit" || type === "Preview" || type === "Details") && data) {
            const projectCode = data.code || data.id; // fallback to ID if no code
            navigate(`/dashboard/budget-BOQs/edit/${projectCode}`, {
                state: { projectId: data.id }, // Keep actual ID for API calls
            });
            return;
        }

        // Set state first
        setDialogType(type as "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select" | "Archive");
        if (data) {
            setSelectedProject(data);
            setSelectedProjectInHook(data);
        } else {
            setSelectedProject(null);
            setSelectedProjectInHook(null);
        }

        // Use setTimeout to ensure state updates complete before showing dialog
        setTimeout(() => {
            handleShow();
        }, 0);
    }, [navigate, handleShow, setSelectedProjectInHook]);

    const handleSuccess = useCallback(async () => {
        await getProjectsList(true); // Force refresh after changes
        handleHide();
        toaster.success("Operation completed successfully!");
    }, [getProjectsList, handleHide, toaster]);

    const handleCreate = useCallback(async (formData: any) => {
        const result = await createProject(formData);
        if (result.success) {
            handleSuccess();
        } else {
            toaster.error(result.message || "Failed to create project");
        }
    }, [createProject, handleSuccess, toaster]);

    const handleUpdate = useCallback(async (formData: any) => {
        const result = await updateProject({ ...formData, id: selectedProject.id });
        if (result.success) {
            handleSuccess();
        } else {
            toaster.error(result.message || "Failed to update project");
        }
    }, [updateProject, selectedProject, handleSuccess, toaster]);

    const handleDelete = useCallback(async () => {
        if (selectedProject) {
            const result = await deleteProject(selectedProject.id);
            if (result.success) {
                handleSuccess();
            } else {
                toaster.error(result.message || "Failed to delete project");
            }
        }
    }, [deleteProject, selectedProject, handleSuccess, toaster]);

    const handleArchive = useCallback(async (project: any) => {
        openCreateDialog("Archive", project);
    }, [openCreateDialog]);

    const handleArchiveConfirm = useCallback(async () => {
        if (selectedProject) {
            const result = await archiveProject(selectedProject.id);
            if (result.success) {
                await getProjectsList(true); // Force refresh
                handleHide(); // Close dialog
                toaster.success(result.message || "Project archived successfully!");
            } else {
                toaster.error(result.message || "Failed to archive project");
            }
        }
    }, [archiveProject, selectedProject, getProjectsList, handleHide, toaster]);

    useEffect(() => {
        // Only fetch data if we're actually on the budget-boqs page
        if (location.pathname === "/dashboard/budget-BOQs") {
            // Force refresh when archive mode changes to bypass cache
            getProjectsList(true);
        }
    }, [location.pathname, isArchiveMode, getProjectsList]);

    // Convert columns to SpreadsheetColumn format
    const spreadsheetColumns = useMemo((): SpreadsheetColumn<Project>[] => [
        {
            key: "code",
            label: "Code",
            width: 120,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "name",
            label: "Name",
            width: 300,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "acronym",
            label: "Acronym",
            width: 120,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "city",
            label: "City",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Render action buttons for each row
    const renderActions = useCallback((row: Project) => {
        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        openCreateDialog("Preview", row);
                    }}
                    title="Preview"
                >
                    <Icon icon={eyeIcon} className="w-4 h-4" />
                </button>
                {/* Only show Edit button when NOT in archive mode (read-only when archived) */}
                {!isArchiveMode && (
                    <button
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            openCreateDialog("Edit", row);
                        }}
                        title="Edit"
                    >
                        <Icon icon={editIcon} className="w-4 h-4" />
                    </button>
                )}
                {/* Only show Archive button when NOT in archive mode */}
                {!isArchiveMode && (
                    <button
                        className="btn btn-ghost btn-xs text-warning hover:bg-warning/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(row);
                        }}
                        title="Archive"
                    >
                        <Icon icon={archiveIcon} className="w-4 h-4" />
                    </button>
                )}
                <button
                    className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        openCreateDialog("Delete", row);
                    }}
                    title="Delete"
                >
                    <Icon icon={trashIcon} className="w-4 h-4" />
                </button>
            </div>
        );
    }, [openCreateDialog, handleArchive, isArchiveMode]);

    // Handle row double click to navigate to edit (disabled in archive mode)
    const handleRowDoubleClick = useCallback((row: Project) => {
        // Don't allow editing in archive mode (read-only)
        if (!isArchiveMode) {
            openCreateDialog("Edit", row);
        } else {
            // In archive mode, double-click opens preview instead
            openCreateDialog("Preview", row);
        }
    }, [openCreateDialog, isArchiveMode]);

    // Toolbar with Add button and Archive checkbox (no title)
    const toolbar = useMemo(() => (
        <div className="flex items-center justify-end gap-3 w-full px-4 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={isArchiveMode}
                    onChange={(e) => setArchiveMode(e.target.checked)}
                />
                <span className="text-sm">Show Archived Projects</span>
            </label>
            {/* Show read-only badge when in archive mode */}
            {isArchiveMode && (
                <span className="badge badge-warning badge-sm gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Read-only Mode
                </span>
            )}
            {/* Hide Add button when in archive mode (read-only) */}
            {!isArchiveMode && (
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openCreateDialog("Add")}
                >
                    <Icon icon={plusIcon} className="w-4 h-4 mr-1" />
                    Add Project
                </button>
            )}
        </div>
    ), [openCreateDialog, isArchiveMode, setArchiveMode]);

    return (
        <>
            <div key={location.pathname} className="flex flex-col h-full" style={{ height: 'calc(100vh - 80px)' }}>
                <Spreadsheet<Project>
                    data={tableData}
                    columns={spreadsheetColumns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No projects found"
                    persistKey="budget-boqs-spreadsheet"
                    rowHeight={40}
                    actionsRender={renderActions}
                    actionsColumnWidth={180}
                    onRowDoubleClick={handleRowDoubleClick}
                    getRowId={(row) => row.id}
                    toolbar={toolbar}
                    allowKeyboardNavigation
                    allowColumnResize
                    allowSorting
                    allowFilters
                />
            </div>

            <BudgetBOQDialog
                handleHide={handleHide}
                dialogRef={dialogRef}
                dialogType={dialogType}
                selectedProject={selectedProject}
                onSuccess={handleSuccess}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onArchive={handleArchiveConfirm}
            />
        </>
    );
};

export default BudgetBOQs;
