import { memo, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import plusIcon from "@iconify/icons-lucide/plus";
import pencilIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash-2";
import uploadIcon from "@iconify/icons-lucide/upload";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { Loader } from "@/components/Loader";
import { Button, Modal, ModalBody, ModalHeader } from "@/components/daisyui";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";

import useProjects, { Project, ProjectFormData } from "./use-projects";

const initialFormData: ProjectFormData = {
    projectName: "",
    projectCode: "",
    client: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "Active",
};

const Projects = memo(() => {
    const {
        tableData,
        loading,
        saving,
        uploadLoading,
        statusOptions,
        getProjects,
        createProject,
        updateProject,
        deleteProject,
        uploadBoq,
    } = useProjects();

    const { setLeftContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Form state
    const [formData, setFormData] = useState<ProjectFormData>(initialFormData);

    // File input ref for BOQ upload
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBackToAdminTools = useCallback(() => {
        tryNavigate('/admin-tools');
    }, [tryNavigate]);

    const leftTopbarContent = useMemo(() => (
        <button
            onClick={handleBackToAdminTools}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
            title="Back to Admin Tools"
        >
            <Icon icon={arrowLeftIcon} className="w-5 h-5" />
        </button>
    ), [handleBackToAdminTools]);

    useEffect(() => {
        setLeftContent(leftTopbarContent);
    }, [leftTopbarContent, setLeftContent]);

    useEffect(() => {
        return () => {
            clearContent();
        };
    }, [clearContent]);

    // Handlers
    const handleAdd = useCallback(() => {
        setFormData(initialFormData);
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((project: Project) => {
        setSelectedProject(project);
        setFormData({
            projectName: project.projectName || "",
            projectCode: project.projectCode || "",
            client: project.client || "",
            location: project.location || "",
            startDate: project.startDate ? project.startDate.split('T')[0] : "",
            endDate: project.endDate ? project.endDate.split('T')[0] : "",
            status: project.status || "Active",
        });
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((project: Project) => {
        setSelectedProject(project);
        setShowDeleteModal(true);
    }, []);

    const handleUploadClick = useCallback((project: Project) => {
        setSelectedProject(project);
        setShowUploadModal(true);
    }, []);

    const handleAddSubmit = useCallback(async () => {
        const result = await createProject(formData);
        if (result.success) {
            setShowAddModal(false);
            setFormData(initialFormData);
        }
    }, [createProject, formData]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedProject) return;
        const result = await updateProject({
            id: selectedProject.id,
            name: formData.projectName || "",
            projectName: formData.projectName,
            projectCode: formData.projectCode,
            client: formData.client,
            location: formData.location,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
        });
        if (result.success) {
            setShowEditModal(false);
            setSelectedProject(null);
            setFormData(initialFormData);
        }
    }, [updateProject, selectedProject, formData]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedProject) return;
        const result = await deleteProject(selectedProject.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedProject(null);
        }
    }, [deleteProject, selectedProject]);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && selectedProject) {
            uploadBoq(String(selectedProject.id), file);
            handleCloseUploadModal();
        }
    }, [selectedProject, uploadBoq]);

    const handleCloseUploadModal = useCallback(() => {
        setShowUploadModal(false);
        setSelectedProject(null);
        // Reset file input to allow re-selecting the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Format date for display
    const formatDate = useCallback((dateString: string | null) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return dateString;
        }
    }, []);

    // Spreadsheet columns
    const columns = useMemo((): SpreadsheetColumn<Project>[] => [
        {
            key: "projectName",
            label: "Project Name",
            width: 200,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "projectCode",
            label: "Project Code",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "client",
            label: "Client",
            width: 180,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "location",
            label: "Location",
            width: 180,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "startDate",
            label: "Start Date",
            width: 120,
            align: "center",
            editable: false,
            sortable: true,
            filterable: false,
            render: (value) => formatDate(value),
        },
        {
            key: "endDate",
            label: "End Date",
            width: 120,
            align: "center",
            editable: false,
            sortable: true,
            filterable: false,
            render: (value) => formatDate(value),
        },
        {
            key: "status",
            label: "Status",
            width: 120,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
            render: (value) => {
                const statusColors: Record<string, string> = {
                    Active: "badge-success",
                    Completed: "badge-info",
                    "On Hold": "badge-warning",
                    Cancelled: "badge-error",
                };
                return (
                    <span className={`badge badge-sm ${statusColors[value] || "badge-ghost"}`}>
                        {value || "-"}
                    </span>
                );
            },
        },
    ], [formatDate]);

    // Row actions
    const renderActions = useCallback((row: Project) => {
        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleUploadClick(row);
                    }}
                    title="Upload BOQ"
                >
                    <Icon icon={uploadIcon} className="w-4 h-4" />
                </button>
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                    }}
                    title="Edit"
                >
                    <Icon icon={pencilIcon} className="w-4 h-4" />
                </button>
                <button
                    className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row);
                    }}
                    title="Delete"
                >
                    <Icon icon={trashIcon} className="w-4 h-4" />
                </button>
            </div>
        );
    }, [handleEdit, handleDelete, handleUploadClick]);

    // Toolbar
    const toolbar = useMemo(() => {
        return (
            <div className="flex items-center justify-end w-full px-4 py-2">
                <button
                    onClick={handleAdd}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New Project</span>
                </button>
            </div>
        );
    }, [handleAdd]);

    if (loading) {
        return (
            <Loader
                icon="folder-kanban"
                subtitle="Loading: Projects"
                description="Preparing project data..."
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
                <Spreadsheet<Project>
                    data={tableData}
                    columns={columns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No projects found"
                    persistKey="admin-projects-spreadsheet"
                    rowHeight={40}
                    actionsRender={renderActions}
                    actionsColumnWidth={120}
                    onRowDoubleClick={handleEdit}
                    getRowId={(row) => row.id}
                    toolbar={toolbar}
                    allowKeyboardNavigation
                    allowColumnResize
                    allowSorting
                    allowFilters
                />
            </div>

            {/* Hidden file input for BOQ upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Upload BOQ Modal */}
            <Modal open={showUploadModal} backdrop>
                <ModalHeader>Upload BOQ</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col items-center gap-4">
                        <p>Upload BOQ file for project: <strong>{selectedProject?.projectName}</strong></p>
                        <Button
                            color="primary"
                            onClick={triggerFileInput}
                            disabled={uploadLoading}
                            loading={uploadLoading}
                        >
                            {uploadLoading ? "Uploading..." : "Select Excel File"}
                        </Button>
                        <Button
                            color="ghost"
                            onClick={handleCloseUploadModal}
                        >
                            Cancel
                        </Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Add New Project</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.projectName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                                    placeholder="Enter project name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project Code *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.projectCode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, projectCode: e.target.value }))}
                                    placeholder="Enter project code"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Client *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.client}
                                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                                    placeholder="Enter client name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Location *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Enter location"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Start Date *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">End Date *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                            <div className="form-control md:col-span-2">
                                <label className="label">
                                    <span className="label-text">Status *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowAddModal(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddSubmit}
                                disabled={saving || !formData.projectName || !formData.projectCode}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Project</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedProject && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Edit Project</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.projectName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                                    placeholder="Enter project name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project Code *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.projectCode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, projectCode: e.target.value }))}
                                    placeholder="Enter project code"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Client *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.client}
                                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                                    placeholder="Enter client name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Location *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Enter location"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Start Date *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">End Date *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                            <div className="form-control md:col-span-2">
                                <label className="label">
                                    <span className="label-text">Status *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedProject(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSubmit}
                                disabled={saving || !formData.projectName || !formData.projectCode}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedProject && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error mb-4">Delete Project</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the project <strong>{selectedProject.projectName}</strong>?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedProject(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error text-white"
                                onClick={handleDeleteConfirm}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete Project</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

Projects.displayName = 'Projects';

export default Projects;
