import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";

import SAMTable from "@/components/Table";
import { useDialog } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import BudgetBOQDialog from "./components/Dialog";
import useBudgetBOQs from "./use-budget-boqs";

const BudgetBOQs = () => {
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select">("Add");
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const {
        columns,
        tableData,
        inputFields,
        loading,
        getProjectsList,
        createProject,
        updateProject,
        deleteProject,
        setSelectedProject: setSelectedProjectInHook,
    } = useBudgetBOQs();
    const { dialogRef, handleShow, handleHide } = useDialog();
    const { toaster } = useToast();

    const openCreateDialog = useCallback(async (
        type: "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select" | "Details" | "Export" | "Generate",
        data?: any,
    ) => {
        setDialogType(type as "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Select");
        if (data) {
            setSelectedProject(data);
            setSelectedProjectInHook(data);
        } else {
            setSelectedProject(null);
            setSelectedProjectInHook(null);
        }

        // Navigate to edit page for Edit action using project code instead of ID
        if ((type === "Edit" || type === "Preview" || type === "Details") && data) {
            const projectCode = data.code || data.id; // fallback to ID if no code
            navigate(`/dashboard/budget-BOQs/edit/${projectCode}`, {
                state: { projectId: data.id }, // Keep actual ID for API calls
            });
            return;
        }

        handleShow();
    }, [navigate, handleShow, setSelectedProjectInHook]);

    const handleBackToDashboard = useCallback(() => {
        navigate("/dashboard");
    }, [navigate]);

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

    useEffect(() => {
        // Only fetch data if we're actually on the budget-boqs page
        if (location.pathname === "/dashboard/budget-BOQs") {
            getProjectsList();
        }
    }, [location.pathname]);

    return (
        <div key={location.pathname} style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="p-6 pb-3">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToDashboard}
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                            <Icon icon={arrowLeftIcon} className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="px-6">
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    previewAction
                    title={"Budget BOQs"}
                    loading={loading}
                    addBtn
                    onSuccess={handleSuccess}
                    createEndPoint="Project/CreateProject"
                    editEndPoint="Project/UpdateProject"
                    deleteEndPoint="Project/DeleteProject/{id}"
                    openStaticDialog={openCreateDialog}
                    rowsPerPage={10000}
                />
            </div>

            <BudgetBOQDialog
                handleHide={handleHide}
                dialogRef={dialogRef}
                dialogType={dialogType}
                selectedProject={selectedProject}
                onSuccess={handleSuccess}
                onCreate={handleCreate}
            />
        </div>
    );
};

export default BudgetBOQs;
