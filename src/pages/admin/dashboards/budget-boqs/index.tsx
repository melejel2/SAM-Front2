import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import SAMTable from "@/components/Table";
import { useDialog } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";

import BudgetBOQDialog from "./components/Dialog";
import useBudgetBOQs from "./use-budget-boqs";

const BudgetBOQs = () => {
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Delete" | "Preview" | "Select">("Add");
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
        setSelectedProject: setSelectedProjectInHook
    } = useBudgetBOQs();
    const { dialogRef, handleShow, handleHide } = useDialog();
    const { toaster } = useToast();

    const openCreateDialog = async (type: "Add" | "Edit" | "Delete" | "Preview" | "Select", data?: any) => {
        setDialogType(type);
        if (data) {
            setSelectedProject(data);
            setSelectedProjectInHook(data);
        } else {
            setSelectedProject(null);
            setSelectedProjectInHook(null);
        }
        
        // Navigate to edit page for Edit action
        if (type === "Edit" && data) {
            navigate(`/dashboard/budget-BOQs/edit/${data.id}`);
            return;
        }
        
        handleShow();
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleSuccess = async () => {
        await getProjectsList();
        handleHide();
        toaster.success("Operation completed successfully!");
    };

    const handleCreate = async (formData: any) => {
        const result = await createProject(formData);
        if (result.success) {
            handleSuccess();
        } else {
            toaster.error(result.message || "Failed to create project");
        }
    };

    const handleUpdate = async (formData: any) => {
        const result = await updateProject({ ...formData, id: selectedProject.id });
        if (result.success) {
            handleSuccess();
        } else {
            toaster.error(result.message || "Failed to update project");
        }
    };

    const handleDelete = async () => {
        if (selectedProject) {
            const result = await deleteProject(selectedProject.id);
            if (result.success) {
                handleSuccess();
            } else {
                toaster.error(result.message || "Failed to delete project");
            }
        }
    };

    useEffect(() => {
        // Only fetch data if we're actually on the budget-boqs page
        if (location.pathname === '/dashboard/budget-BOQs') {
            getProjectsList();
        }
    }, [location.pathname]);

    return (
        <div key={location.pathname}>
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Budget BOQs"}
                    loading={loading}
                    addBtn
                    onSuccess={handleSuccess}
                    dynamicDialog={false}
                    openStaticDialog={openCreateDialog}
                />
            </div>

            <BudgetBOQDialog
                handleHide={handleHide}
                dialogRef={dialogRef}
                dialogType={dialogType}
                selectedProject={selectedProject}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default BudgetBOQs;
