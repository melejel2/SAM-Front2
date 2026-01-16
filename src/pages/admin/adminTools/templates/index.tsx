import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import DocumentEditorModal from "@/components/WordDocumentEditor/DocumentEditorModal";
import useToast from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";

import useTemplates from "./use-templates";

// Error Boundary Component interfaces
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Templates Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-8">
                    <div className="text-error text-xl mb-4">Templates Error</div>
                    <div className="text-sm text-gray-600 mb-4">
                        {this.state.error?.message || 'Unknown error occurred'}
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            // Safe page reload with confirmation
                            if (window.confirm("Are you sure you want to reload the page? Any unsaved changes will be lost.")) {
                                window.location.reload();
                            }
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Export Dropdown Component
const ExportDropdown = ({ 
    exportingPdf, 
    exportingWord,
    onExportPdf, 
    onExportWord
}: {
    exportingPdf: boolean;
    exportingWord: boolean;
    onExportPdf: () => void;
    onExportWord: () => void;
}) => {
    const isExporting = exportingPdf || exportingWord;
    
    return (
        <div className="dropdown dropdown-end">
            <div 
                tabIndex={0} 
                role="button" 
                className={`btn btn-sm border border-base-300 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200 ${isExporting ? 'btn-disabled' : ''}`}
            >
                {isExporting ? (
                    <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <span className="iconify lucide--download size-4"></span>
                        <span>Export</span>
                        <span className="iconify lucide--chevron-down size-3.5"></span>
                    </>
                )}
            </div>
            {!isExporting && (
                <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52 mt-1">
                    <li>
                        <button
                            onClick={onExportPdf}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--file-text size-4"></span>
                            <span className="font-medium">Export as PDF</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={onExportWord}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--file-edit size-4"></span>
                            <span className="font-medium">Export as Word</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

const Templates = () => {
    const {
        contractColumns,
        voColumns,
        otherColumns,
        contractData,
        voData,
        otherTemplatesData,
        contractInputFields,
        voInputFields,
        otherInputFields,
        loading,
        getTemplates,
        getTemplateSfdt,
        saveTemplateFromSfdt,
    } = useTemplates();

    const { getToken } = useAuth();
    const { toaster } = useToast();
    const navigate = useNavigate();
    const { canManageTemplates, canDeleteTemplates, isAdmin } = usePermissions();
    const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
    const [previewData, setPreviewData] = useState<{ blob: Blob; id: string; fileName: string; rowData: any } | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [previewLoadingRowId, setPreviewLoadingRowId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{data: any, type: 'contract' | 'vo' | 'other'} | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Template Editor State (Admin only)
    const [showEditor, setShowEditor] = useState(false);
    const [templateSfdt, setTemplateSfdt] = useState<string | undefined>(undefined);
    const [loadingSfdt, setLoadingSfdt] = useState(false);
    const [sfdtError, setSfdtError] = useState<string | undefined>(undefined);
    const [currentEditTemplate, setCurrentEditTemplate] = useState<{
        id: number;
        isVo: boolean;
        name: string;
        type: 'contract' | 'vo' | 'other';
    } | null>(null);

    const token = getToken();


    useEffect(() => {
        getTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePreview = async (row: any, templateType: 'contract' | 'vo' | 'other') => {
        // Set loading state for this specific row
        const rowId = row.id || row.contractId || row.projectId || String(row);
        setPreviewLoadingRowId(rowId);

        try {
            let endpoint = '';
            let fileName = '';

            // Use template name instead of database ID in filenames
            const templateRef = row.templateName || row.name || row.id;

            if (templateType === 'contract') {
                endpoint = `Templates/PreviewTemplatePdf?id=${row.id}&isVo=false`;
                fileName = `template-${templateRef}.pdf`;
            } else if (templateType === 'vo') {
                endpoint = `Templates/PreviewTemplatePdf?id=${row.id}&isVo=true`;
                fileName = `vo-template-${templateRef}.pdf`;
            } else {
                endpoint = `Templates/PreviewTemplatePdf?id=${row.id}&isVo=true`;
                let typeLabel = "template";
                if (row.type === "1") typeLabel = "discharge-rg";
                else if (row.type === "2") typeLabel = "terminate";
                else if (row.type === "3") typeLabel = "discharge-final";
                fileName = `${typeLabel}-${templateRef}.pdf`;
            }

            const response = await apiRequest({
                endpoint,
                method: "GET",
                token: token ?? "",
                responseType: "blob",
            });

            if (response instanceof Blob) {
                setPreviewData({ blob: response, id: row.id, fileName, rowData: { ...row, templateType } });
                setViewMode('preview');
                toaster.success("Template preview loaded successfully");
            } else {
                toaster.error("Failed to load template preview");
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to preview template");
        } finally {
            // Always clear loading state
            setPreviewLoadingRowId(null);
        }
    };

    const handleBackToTable = () => {
        setViewMode('table');
        setPreviewData(null);
    };

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

    const openDeleteModal = (templateData: any, templateType: 'contract' | 'vo' | 'other') => {
        setTemplateToDelete({ data: templateData, type: templateType });
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setTemplateToDelete(null);
    };

    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return;
        
        setIsDeleting(true);
        try {
            const { data: templateData, type: templateType } = templateToDelete;
            const isContractTemplate = templateType === 'contract';
            const isVoParam = isContractTemplate ? 'false' : 'true';
            const endpoint = `Templates/DeleteTemplate?id=${templateData.id}&isVo=${isVoParam}`;

            const response = await apiRequest({
                endpoint,
                method: "DELETE",
                token: token ?? "",
            });
            
            if (response.isSuccess) {
                toaster.success("Template deleted successfully");
                getTemplates(); // Refresh the list
                closeDeleteModal();
            } else {
                console.error('Delete failed:', response);
                toaster.error(response.message || "Failed to delete template");
            }
        } catch (error) {
            console.error('Delete error:', error);
            toaster.error("Failed to delete template");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportPdf = async () => {
        if (!previewData) return;
        
        setExportingPdf(true);
        try {
            let endpoint = '';
            
            if (previewData.rowData.templateType === 'contract') {
                endpoint = `Templates/PreviewTemplatePdf?id=${previewData.id}&isVo=false`;
            } else {
                endpoint = `Templates/PreviewTemplatePdf?id=${previewData.id}&isVo=true`;
            }

            const response = await apiRequest({
                endpoint,
                method: "GET",
                responseType: "blob",
                token: token ?? ""
            });
            
            if (response instanceof Blob) {
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = previewData.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("PDF file downloaded successfully");
            } else {
                toaster.error("Failed to download PDF file");
            }
        } catch (error) {
            toaster.error("Failed to download PDF file");
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExportWord = async () => {
        if (!previewData) return;

        setExportingWord(true);
        try {
            let endpoint = '';

            if (previewData.rowData.templateType === 'contract') {
                endpoint = `Templates/PreviewTemplate?id=${previewData.id}&isVo=false`;
            } else {
                endpoint = `Templates/PreviewTemplate?id=${previewData.id}&isVo=true`;
            }

            const response = await apiRequest({
                endpoint,
                method: "GET",
                responseType: "blob",
                token: token ?? ""
            });

            if (response instanceof Blob) {
                const fileName = previewData.fileName.replace('.pdf', '.docx');
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("Word file downloaded successfully");
            } else {
                toaster.error("Failed to download Word file");
            }
        } catch (error) {
            toaster.error("Failed to download Word file");
        } finally {
            setExportingWord(false);
        }
    };

    // Handle Edit Template (Admin only)
    const handleEditTemplate = async (row: any, templateType: 'contract' | 'vo' | 'other') => {
        if (!isAdmin) {
            toaster.error("Only administrators can edit templates");
            return;
        }

        const isVo = templateType !== 'contract';
        const templateName = row.templateName || row.name || `Template #${row.id}`;

        setCurrentEditTemplate({
            id: row.id,
            isVo,
            name: templateName,
            type: templateType,
        });
        setLoadingSfdt(true);
        setSfdtError(undefined);
        setShowEditor(true);

        try {
            const sfdt = await getTemplateSfdt(row.id, isVo);
            setTemplateSfdt(sfdt);
        } catch (error) {
            console.error("Error loading template SFDT:", error);
            setSfdtError("Failed to load template document for editing");
            toaster.error("Failed to load template for editing");
        } finally {
            setLoadingSfdt(false);
        }
    };

    // Handle Editor Save
    const handleEditorSave = async (sfdtContent: string, filename: string) => {
        if (!currentEditTemplate) return;

        try {
            const result = await saveTemplateFromSfdt(
                currentEditTemplate.id,
                currentEditTemplate.isVo,
                sfdtContent
            );

            if (result.success) {
                toaster.success("Template saved successfully");
                setShowEditor(false);
                setTemplateSfdt(undefined);
                setCurrentEditTemplate(null);
                getTemplates(); // Refresh the list
            } else {
                toaster.error(result.error || "Failed to save template");
            }
        } catch (error) {
            console.error("Error saving template:", error);
            toaster.error("Failed to save template");
        }
    };

    // Handle Editor Close
    const handleEditorClose = () => {
        setShowEditor(false);
        setTemplateSfdt(undefined);
        setCurrentEditTemplate(null);
        setSfdtError(undefined);
    };

    // Safe length getter - returns 0 if data is not a valid array
    const safeLength = (data: any): number => {
        if (!data || !Array.isArray(data)) return 0;
        return data.length;
    };

    // Safe array getter - returns empty array if data is not valid or contains Syncfusion documents
    const safeArray = (data: any): any[] => {
        if (!data || !Array.isArray(data)) return [];
        // Filter out any Syncfusion document objects (have width/height/body keys)
        return data.filter((item: any) => {
            if (!item || typeof item !== 'object') return true;
            return !('body' in item || 'sections' in item || ('width' in item && 'height' in item));
        });
    };

    const tableHeaderContent = (
        <div className="flex items-center justify-between flex-1">
            <button
                onClick={handleBackToAdminTools}
                className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
            >
                <span className="iconify lucide--arrow-left size-4"></span>
                <span>Back</span>
            </button>

            {/* Category Selection Cards */}
            <div className="flex items-center gap-2">
                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 0
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => setActiveTab(0)}
                >
                    <span className="iconify lucide--file-text size-4" />
                    <span>Contract Templates ({safeLength(contractData)})</span>
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 1
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => setActiveTab(1)}
                >
                    <span className="iconify lucide--file-plus size-4" />
                    <span>VO Templates ({safeLength(voData)})</span>
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 2
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => setActiveTab(2)}
                >
                    <span className="iconify lucide--file-plus-2 size-4" />
                    <span>Other Templates ({safeLength(otherTemplatesData)})</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden -mt-5">
            {viewMode === 'table' ? (
                <div className="flex-1 min-h-0">
                    {loading ? (
                        <Loader />
                    ) : (
                        <>
                                {/* Contract Templates Tab */}
                                {activeTab === 0 && (
                                    <SAMTable
                                        columns={contractColumns}
                                        tableData={safeArray(contractData)}
                                        inputFields={contractInputFields}
                                        actions={true}
                                        editAction={false}
                                        deleteAction={canDeleteTemplates}
                                        previewAction={true}
                                        title={"Contract Template"}
                                        loading={false}
                                        addBtn={canManageTemplates}
                                        addBtnText="Upload Template"
                                        createEndPoint="Templates/AddContractTemplate"
                                        deleteEndPoint="Templates/DeleteTemplate"
                                        onSuccess={getTemplates}
                                        openStaticDialog={(type, data) => {
                                            if (type === "Preview" && data) {
                                                handlePreview(data, 'contract');
                                            } else if (type === "Delete" && data) {
                                                openDeleteModal(data, 'contract');
                                            }
                                        }}
                                        dynamicDialog={true}
                                        previewLoadingRowId={previewLoadingRowId}
                                        customActions={isAdmin ? [
                                            {
                                                icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>,
                                                label: "Edit Template",
                                                tooltip: "Edit template document",
                                                onClick: (row) => handleEditTemplate(row, 'contract'),
                                                className: "text-primary hover:text-primary/80"
                                            }
                                        ] : undefined}
                                        customHeaderContent={tableHeaderContent}
                                    />
                                )}

                                {/* VO Templates Tab */}
                                {activeTab === 1 && (
                                    <SAMTable
                                        columns={voColumns}
                                        tableData={safeArray(voData)}
                                        inputFields={voInputFields}
                                        actions={true}
                                        editAction={false}
                                        deleteAction={canDeleteTemplates}
                                        previewAction={true}
                                        title={"VO Template"}
                                        loading={false}
                                        addBtn={canManageTemplates}
                                        addBtnText="Upload Template"
                                        createEndPoint="Templates/AddVOContractTemplate"
                                        deleteEndPoint="Templates/DeleteTemplate"
                                        onSuccess={getTemplates}
                                        openStaticDialog={(type, data) => {
                                            if (type === "Preview" && data) {
                                                handlePreview(data, 'vo');
                                            } else if (type === "Delete" && data) {
                                                openDeleteModal(data, 'vo');
                                            }
                                        }}
                                        dynamicDialog={true}
                                        previewLoadingRowId={previewLoadingRowId}
                                        customActions={isAdmin ? [
                                            {
                                                icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>,
                                                label: "Edit Template",
                                                tooltip: "Edit template document",
                                                onClick: (row) => handleEditTemplate(row, 'vo'),
                                                className: "text-primary hover:text-primary/80"
                                            }
                                        ] : undefined}
                                        customHeaderContent={tableHeaderContent}
                                    />
                                )}

                                {/* Other Templates Tab */}
                                {activeTab === 2 && (
                                    <SAMTable
                                        columns={otherColumns}
                                        tableData={safeArray(otherTemplatesData)}
                                        inputFields={otherInputFields}
                                        actions={true}
                                        editAction={false}
                                        deleteAction={canDeleteTemplates}
                                        previewAction={true}
                                        title={"Other Templates"}
                                        loading={false}
                                        addBtn={canManageTemplates}
                                        addBtnText="Upload Template"
                                        createEndPoint="Templates/AddVOContractTemplate"
                                        deleteEndPoint="Templates/DeleteTemplate"
                                        onSuccess={getTemplates}
                                        openStaticDialog={(type, data) => {
                                            if (type === "Preview" && data) {
                                                handlePreview(data, 'other');
                                            } else if (type === "Delete" && data) {
                                                openDeleteModal(data, 'other');
                                            }
                                        }}
                                        dynamicDialog={true}
                                        previewLoadingRowId={previewLoadingRowId}
                                        customActions={isAdmin ? [
                                            {
                                                icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>,
                                                label: "Edit Template",
                                                tooltip: "Edit template document",
                                                onClick: (row) => handleEditTemplate(row, 'other'),
                                                className: "text-primary hover:text-primary/80"
                                            }
                                        ] : undefined}
                                        customHeaderContent={tableHeaderContent}
                                    />
                                )}
                        </>
                    )}
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col">
                    {/* Fixed Header Section */}
                    <div className="flex justify-between items-center pb-3 flex-shrink-0">
                        <button
                            onClick={handleBackToTable}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left size-4"></span>
                            <span>Back</span>
                        </button>

                        <ExportDropdown
                            exportingPdf={exportingPdf}
                            exportingWord={exportingWord}
                            onExportPdf={handleExportPdf}
                            onExportWord={handleExportWord}
                        />
                    </div>

                    {/* Preview Content */}
                    <div className="flex-1 min-h-0 overflow-auto">
                        <div className="card bg-base-100 shadow-sm p-4">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <span className="iconify lucide--file-text text-primary size-5"></span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base-content">Template Preview</h3>
                                    <p className="text-sm text-base-content/60">
                                        {previewData?.fileName} • Template #{previewData?.id}
                                    </p>
                                </div>
                            </div>

                            {/* Template Preview Content */}
                            <div className="bg-base-100 border border-base-300 rounded-lg shadow-sm">
                                <div className="h-[calc(100vh-300px)]">
                                    {previewData && (
                                        <PDFViewer
                                            fileBlob={previewData.blob}
                                            fileName={previewData.fileName}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-error/20 rounded-full">
                                <span className="iconify lucide--trash-2 text-error size-6"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-base-content">Delete Template</h3>
                                <p className="text-sm text-base-content/70">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="py-4">
                            <p className="text-base-content mb-2">
                                Are you sure you want to delete this template?
                            </p>
                            <div className="bg-base-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="iconify lucide--file-text text-base-content/70 size-4"></span>
                                    <span className="font-medium text-base-content">
                                        {templateToDelete?.data?.templateName || templateToDelete?.data?.name || 'Unknown Template'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="iconify lucide--hash text-base-content/50 size-3.5"></span>
                                    <span className="text-sm text-base-content/70">
                                        {templateToDelete?.data?.code || 'No code'}
                                    </span>
                                </div>
                            </div>
                            <div className="alert alert-warning">
                                <span className="iconify lucide--alert-triangle size-4"></span>
                                <span className="text-sm">This template will be permanently deleted and cannot be recovered.</span>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={closeDeleteModal}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={handleDeleteTemplate}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--trash size-4"></span>
                                        Delete Template
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Editor Modal (Admin only) */}
            {showEditor && currentEditTemplate && (
                <DocumentEditorModal
                    isOpen={showEditor}
                    onClose={handleEditorClose}
                    sfdtContent={templateSfdt}
                    documentName={`${currentEditTemplate.name}.docx`}
                    title="Edit Template"
                    description={`Editing ${currentEditTemplate.type === 'contract' ? 'Contract' : currentEditTemplate.type === 'vo' ? 'VO' : 'Other'} Template: ${currentEditTemplate.name}`}
                    onSaveSfdt={handleEditorSave}
                    showSaveButton={true}
                    isLoadingSfdt={loadingSfdt}
                    loadError={sfdtError}
                    metadata={[
                        { label: "Template Type", value: currentEditTemplate.type === 'contract' ? 'Contract Template' : currentEditTemplate.type === 'vo' ? 'VO Template' : 'Other Template' },
                        { label: "Template ID", value: String(currentEditTemplate.id) },
                    ]}
                />
            )}
        </div>
    );
};

const TemplatesWithErrorBoundary = () => (
    <ErrorBoundary>
        <Templates />
    </ErrorBoundary>
);

export default TemplatesWithErrorBoundary;