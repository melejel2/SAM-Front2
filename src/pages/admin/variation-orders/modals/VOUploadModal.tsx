import { useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";

import useToast from "@/hooks/use-toast";
import useProjects from "@/pages/admin/adminTools/projects/use-projects";
import useBuildings from "@/hooks/use-buildings";
import useSheets from "@/hooks/use-sheets";
import useVariationOrders from "../use-variation-orders";
import { ImportVoRequest } from "@/types/variation-order";

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType);

interface VOUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const VOUploadModal = ({ isOpen, onClose, onSuccess }: VOUploadModalProps) => {
    const { toaster } = useToast();
    const { tableData: projects, getProjects } = useProjects();
    const { buildings, getBuildingsByProject } = useBuildings();
    const { sheets, getSheetsByProject } = useSheets();
    const { uploadVo, uploadLoading } = useVariationOrders();

    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<number | null>(null);
    const [voLevel, setVoLevel] = useState<number>(1);
    const [isFromBudgetBoq, setIsFromBudgetBoq] = useState<boolean>(false);
    const [files, setFiles] = useState<any[]>([]);

    const handleProjectChange = async (projectId: number) => {
        setSelectedProject(projectId);
        setSelectedBuilding(null);
        setSelectedSheet(null);
        
        if (projectId) {
            await getBuildingsByProject(projectId);
            await getSheetsByProject(projectId);
        }
    };

    const handleUpload = async () => {
        if (!selectedProject || !selectedBuilding || !selectedSheet || files.length === 0) {
            toaster.error("Please fill in all required fields and select a file");
            return;
        }

        const request: ImportVoRequest = {
            projectId: selectedProject,
            buildingId: selectedBuilding,
            sheetId: selectedSheet,
            voLevel,
            isFromBudgetBoq,
            excelFile: files[0].file
        };

        try {
            const result = await uploadVo(request);
            if (result.success) {
                toaster.success("VO uploaded successfully");
                onSuccess();
                handleClose();
            } else {
                toaster.error(result.message || "Upload failed");
            }
        } catch (error) {
            toaster.error("Upload failed");
        }
    };

    const handleClose = () => {
        setSelectedProject(null);
        setSelectedBuilding(null);
        setSelectedSheet(null);
        setVoLevel(1);
        setIsFromBudgetBoq(false);
        setFiles([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--upload text-blue-600 dark:text-blue-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Upload Variation Order</h3>
                            <p className="text-sm text-base-content/70">Upload Excel file to create a new VO</p>
                        </div>
                    </div>
                    <button 
                        className="btn btn-sm btn-circle btn-ghost" 
                        onClick={handleClose}
                        disabled={uploadLoading}
                    >
                        <span className="iconify lucide--x size-4"></span>
                    </button>
                </div>
                
                <div className="space-y-4">
                    {/* Project Selection */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Project *</span>
                        </label>
                        <select 
                            className="select select-bordered w-full"
                            value={selectedProject || ""}
                            onChange={(e) => handleProjectChange(Number(e.target.value))}
                            disabled={uploadLoading}
                        >
                            <option value="">Select a project</option>
                            {projects.map((project: any) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Building Selection */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Building *</span>
                        </label>
                        <select 
                            className="select select-bordered w-full"
                            value={selectedBuilding || ""}
                            onChange={(e) => setSelectedBuilding(Number(e.target.value))}
                            disabled={!selectedProject || uploadLoading}
                        >
                            <option value="">Select a building</option>
                            {buildings.map((building) => (
                                <option key={building.id} value={building.id}>
                                    {building.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sheet Selection */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Sheet/Trade *</span>
                        </label>
                        <select 
                            className="select select-bordered w-full"
                            value={selectedSheet || ""}
                            onChange={(e) => setSelectedSheet(Number(e.target.value))}
                            disabled={!selectedProject || uploadLoading}
                        >
                            <option value="">Select a sheet</option>
                            {sheets.map((sheet) => (
                                <option key={sheet.id} value={sheet.id}>
                                    {sheet.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* VO Level */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">VO Level</span>
                        </label>
                        <input 
                            type="number" 
                            className="input input-bordered w-full"
                            value={voLevel}
                            onChange={(e) => setVoLevel(Number(e.target.value))}
                            min={1}
                            disabled={uploadLoading}
                        />
                    </div>

                    {/* From Budget BOQ Checkbox */}
                    <div className="form-control">
                        <label className="cursor-pointer label justify-start gap-3">
                            <input 
                                type="checkbox" 
                                className="checkbox checkbox-primary"
                                checked={isFromBudgetBoq}
                                onChange={(e) => setIsFromBudgetBoq(e.target.checked)}
                                disabled={uploadLoading}
                            />
                            <div>
                                <span className="label-text font-medium">From Budget BOQ</span>
                                <p className="text-sm text-base-content/70">Check if this VO is derived from budget BOQ</p>
                            </div>
                        </label>
                    </div>

                    {/* File Upload */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Excel File *</span>
                        </label>
                        <div className="border-2 border-dashed border-base-300 rounded-lg p-4">
                            <FilePond
                                files={files}
                                onupdatefiles={setFiles}
                                allowMultiple={false}
                                maxFiles={1}
                                acceptedFileTypes={[
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                    'application/vnd.ms-excel'
                                ]}
                                labelIdle='Drag & Drop your Excel file or <span class="filepond--label-action">Browse</span>'
                                className="filepond-custom"
                                disabled={uploadLoading}
                            />
                        </div>
                    </div>
                </div>

                <div className="modal-action">
                    <button 
                        className="btn btn-ghost" 
                        onClick={handleClose}
                        disabled={uploadLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={uploadLoading || !selectedProject || !selectedBuilding || !selectedSheet || files.length === 0}
                    >
                        {uploadLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--upload size-4"></span>
                                <span>Upload VO</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VOUploadModal;
