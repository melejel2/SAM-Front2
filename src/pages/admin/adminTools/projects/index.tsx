import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { Button, Modal, ModalBody, ModalHeader } from "@/components/daisyui";

import useProjects from "./use-projects";

const Projects = () => {
    const { columns, tableData, inputFields, loading, uploadLoading, getProjects, uploadBoq, openProject } = useProjects();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDialogElement>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        getProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && selectedProjectId) {
            uploadBoq(selectedProjectId, file);
            setShowUploadModal(false);
            setSelectedProjectId("");
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleUploadClick = (row: any) => {
        setSelectedProjectId(row.id);
        setShowUploadModal(true);
    };

    const handleOpenProject = async (row: any) => {
        const projectData = await openProject(row.id);
        if (projectData) {
            // Handle the project data - you might want to open it in a new page or modal
            console.log("Project data:", projectData);
        }
    };

    const rowActions = (row: any) => ({
        editAction: true,
        deleteAction: true,
        generateAction: false,
    });

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

    return (
        <div>
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToAdminTools}
                        className="btn btn-sm btn-back border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <SAMTable
                            columns={columns}
                            tableData={tableData}
                            inputFields={inputFields}
                            actions
                            editAction
                            deleteAction
                            title={"Project"}
                            loading={false}
                            addBtn
                            editEndPoint="Project/UpdateProject"
                            createEndPoint="Project/CreateProject"
                            deleteEndPoint="Project/DeleteProject"
                            onSuccess={getProjects}
                            rowActions={rowActions}
                            openStaticDialog={(type, data) => {
                                if (type === "Select" && data) {
                                    handleUploadClick(data);
                                }
                            }}
                        />
                        <div className="mt-4 flex gap-2">
                            {tableData.map((project) => (
                                <div key={project.id} className="flex gap-2">
                                    <Button
                                        size="sm"
                                        color="primary"
                                        onClick={() => handleUploadClick(project)}
                                    >
                                        Upload BOQ - {project.projectName}
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="secondary"
                                        onClick={() => handleOpenProject(project)}
                                    >
                                        Open {project.projectName}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Modal open={showUploadModal} backdrop>
                <ModalHeader>Upload BOQ</ModalHeader>
                <ModalBody>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-4">
                        <p>Upload BOQ file for the selected project</p>
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
                            onClick={() => setShowUploadModal(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};

export default Projects; 