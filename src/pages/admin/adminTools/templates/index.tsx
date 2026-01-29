import React, { memo, useCallback, useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import filePlusIcon from "@iconify/icons-lucide/file-plus";
import filePlus2Icon from "@iconify/icons-lucide/file-plus-2";
import downloadIcon from "@iconify/icons-lucide/download";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import uploadIcon from "@iconify/icons-lucide/upload";
import eyeIcon from "@iconify/icons-lucide/eye";
import pencilIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash-2";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import { Loader } from "@/components/Loader";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import DocumentEditorModal from "@/components/WordDocumentEditor/DocumentEditorModal";
import useToast from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";

import useTemplates from "./use-templates";

// Template type definitions
interface ContractTemplate {
    id: number;
    code: string;
    templateName: string;
    type: string;
    contractType: string;
    language: string;
}

interface VOTemplate {
    id: number;
    code: string;
    name: string;
    type: string;
    language: string;
}

interface OtherTemplate {
    id: number;
    code: string;
    name: string;
    type: string;
    language: string;
}

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
                        <Icon icon={downloadIcon} className="w-4 h-4" />
                        <span>Export</span>
                        <Icon icon={chevronDownIcon} className="w-3.5 h-3.5" />
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
                            <Icon icon={fileTextIcon} className="w-4 h-4" />
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

const Templates = memo(() => {
    const {
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
    const { canManageTemplates, canDeleteTemplates, isAdmin } = usePermissions();
    const { setLeftContent, setCenterContent, setRightContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
    const [previewData, setPreviewData] = useState<{ blob: Blob; id: string; fileName: string; rowData: any } | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        const stored = sessionStorage.getItem("admin-templates-tab");
        return stored ? Number(stored) : 0;
    });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ data: any, type: 'contract' | 'vo' | 'other' } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => { sessionStorage.setItem("admin-templates-tab", String(activeTab)); }, [activeTab]);

    // Upload modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadType, setUploadType] = useState<'contract' | 'vo' | 'other'>('contract');
    const [uploading, setUploading] = useState(false);
    const [uploadFormData, setUploadFormData] = useState<Record<string, any>>({});
    const [uploadFile, setUploadFile] = useState<File | null>(null);

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

    // Safe length getter - returns 0 if data is not a valid array
    const safeLength = useCallback((data: any): number => {
        if (!data || !Array.isArray(data)) return 0;
        return data.length;
    }, []);

    // Safe array getter - returns empty array if data is not valid or contains Syncfusion documents
    const safeArray = useCallback(<T,>(data: any): T[] => {
        if (!data || !Array.isArray(data)) return [];
        // Filter out any Syncfusion document objects (have width/height/body keys)
        return data.filter((item: any) => {
            if (!item || typeof item !== 'object') return true;
            return !('body' in item || 'sections' in item || ('width' in item && 'height' in item));
        }) as T[];
    }, []);

    const safeContractTemplates = useMemo(() => safeArray<ContractTemplate>(contractData), [contractData, safeArray]);
    const safeVoTemplates = useMemo(() => safeArray<VOTemplate>(voData), [voData, safeArray]);
    const safeOtherTemplates = useMemo(() => safeArray<OtherTemplate>(otherTemplatesData), [otherTemplatesData, safeArray]);

    const handleBackToAdminTools = useCallback(() => {
        tryNavigate('/admin-tools');
    }, [tryNavigate]);

    const handleBackToTable = useCallback(() => {
        setViewMode('table');
        setPreviewData(null);
    }, []);

    const handleTabChange = useCallback((tab: number) => {
        setActiveTab(tab);
    }, []);

    const handlePreview = async (row: any, templateType: 'contract' | 'vo' | 'other') => {
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
        }
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

    const handleExportPdf = useCallback(async () => {
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
    }, [previewData, token, toaster]);

    const handleExportWord = useCallback(async () => {
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
    }, [previewData, token, toaster]);

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
    const handleEditorSave = async (sfdtContent: string, _filename: string) => {
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

    // Handle Upload Template
    const handleOpenUploadModal = useCallback((type: 'contract' | 'vo' | 'other') => {
        setUploadType(type);
        setUploadFormData({});
        setUploadFile(null);
        setShowUploadModal(true);
    }, []);

    const handleUploadSubmit = useCallback(async () => {
        if (!uploadFile) {
            toaster.error("Please select a file to upload");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('wordFile', uploadFile);

            // Add form fields based on upload type
            Object.entries(uploadFormData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });

            let endpoint = '';
            if (uploadType === 'contract') {
                endpoint = 'Templates/AddContractTemplate';
            } else {
                endpoint = 'Templates/AddVOContractTemplate';
            }

            const response = await apiRequest({
                endpoint,
                method: "POST",
                token: token ?? "",
                body: formData,
            });

            if (response.isSuccess || response.success) {
                toaster.success("Template uploaded successfully");
                setShowUploadModal(false);
                setUploadFormData({});
                setUploadFile(null);
                getTemplates(); // Refresh the list
            } else {
                toaster.error(response.message || "Failed to upload template");
            }
        } catch (error) {
            console.error('Upload error:', error);
            toaster.error("Failed to upload template");
        } finally {
            setUploading(false);
        }
    }, [uploadFile, uploadFormData, uploadType, token, toaster, getTemplates]);

    // Get the input fields for the current upload type
    const currentInputFields = useMemo(() => {
        if (uploadType === 'contract') return contractInputFields;
        if (uploadType === 'vo') return voInputFields;
        return otherInputFields;
    }, [uploadType, contractInputFields, voInputFields, otherInputFields]);

    // Spreadsheet columns for Contract Templates
    const contractSpreadsheetColumns = useMemo((): SpreadsheetColumn<ContractTemplate>[] => [
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
            key: "templateName",
            label: "Template Name",
            width: 250,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "type",
            label: "Category",
            width: 150,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "contractType",
            label: "Type",
            width: 150,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "language",
            label: "Language",
            width: 100,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Spreadsheet columns for VO Templates
    const voSpreadsheetColumns = useMemo((): SpreadsheetColumn<VOTemplate>[] => [
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
            label: "Template Name",
            width: 300,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "type",
            label: "Type",
            width: 150,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "language",
            label: "Language",
            width: 100,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Spreadsheet columns for Other Templates
    const otherSpreadsheetColumns = useMemo((): SpreadsheetColumn<OtherTemplate>[] => [
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
            label: "Template Name",
            width: 300,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "type",
            label: "Type",
            width: 150,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "language",
            label: "Language",
            width: 100,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Actions render for Contract Templates
    const renderContractActions = useCallback((row: ContractTemplate) => {
        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(row, 'contract');
                    }}
                    title="Preview"
                >
                    <Icon icon={eyeIcon} className="w-4 h-4" />
                </button>
                {isAdmin && (
                    <button
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(row, 'contract');
                        }}
                        title="Edit Template"
                    >
                        <Icon icon={pencilIcon} className="w-4 h-4" />
                    </button>
                )}
                {canDeleteTemplates && (
                    <button
                        className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(row, 'contract');
                        }}
                        title="Delete"
                    >
                        <Icon icon={trashIcon} className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }, [isAdmin, canDeleteTemplates]);

    // Actions render for VO Templates
    const renderVOActions = useCallback((row: VOTemplate) => {
        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(row, 'vo');
                    }}
                    title="Preview"
                >
                    <Icon icon={eyeIcon} className="w-4 h-4" />
                </button>
                {isAdmin && (
                    <button
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(row, 'vo');
                        }}
                        title="Edit Template"
                    >
                        <Icon icon={pencilIcon} className="w-4 h-4" />
                    </button>
                )}
                {canDeleteTemplates && (
                    <button
                        className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(row, 'vo');
                        }}
                        title="Delete"
                    >
                        <Icon icon={trashIcon} className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }, [isAdmin, canDeleteTemplates]);

    // Actions render for Other Templates
    const renderOtherActions = useCallback((row: OtherTemplate) => {
        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(row, 'other');
                    }}
                    title="Preview"
                >
                    <Icon icon={eyeIcon} className="w-4 h-4" />
                </button>
                {isAdmin && (
                    <button
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(row, 'other');
                        }}
                        title="Edit Template"
                    >
                        <Icon icon={pencilIcon} className="w-4 h-4" />
                    </button>
                )}
                {canDeleteTemplates && (
                    <button
                        className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(row, 'other');
                        }}
                        title="Delete"
                    >
                        <Icon icon={trashIcon} className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }, [isAdmin, canDeleteTemplates]);

    // Toolbar for Contract Templates
    const contractToolbar = useMemo(() => {
        if (!canManageTemplates) return null;

        return (
            <button
                onClick={() => handleOpenUploadModal('contract')}
                className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
                <Icon icon={uploadIcon} className="size-4" />
                <span>Upload Template</span>
            </button>
        );
    }, [canManageTemplates, handleOpenUploadModal]);

    // Toolbar for VO Templates
    const voToolbar = useMemo(() => {
        if (!canManageTemplates) return null;

        return (
            <button
                onClick={() => handleOpenUploadModal('vo')}
                className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
                <Icon icon={uploadIcon} className="size-4" />
                <span>Upload Template</span>
            </button>
        );
    }, [canManageTemplates, handleOpenUploadModal]);

    // Toolbar for Other Templates
    const otherToolbar = useMemo(() => {
        if (!canManageTemplates) return null;

        return (
            <button
                onClick={() => handleOpenUploadModal('other')}
                className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
                <Icon icon={uploadIcon} className="size-4" />
                <span>Upload Template</span>
            </button>
        );
    }, [canManageTemplates, handleOpenUploadModal]);

    const contractCount = useMemo(() => safeLength(contractData), [contractData, safeLength]);
    const voCount = useMemo(() => safeLength(voData), [voData, safeLength]);
    const otherCount = useMemo(() => safeLength(otherTemplatesData), [otherTemplatesData, safeLength]);

    const leftTopbarContent = useMemo(() => {
        if (viewMode === 'table') {
            return (
                <button
                    onClick={handleBackToAdminTools}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                    title="Back to Admin Tools"
                >
                    <Icon icon={arrowLeftIcon} className="w-5 h-5" />
                </button>
            );
        }

        return (
            <button
                onClick={handleBackToTable}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to Templates"
            >
                <Icon icon={arrowLeftIcon} className="w-5 h-5" />
            </button>
        );
    }, [viewMode, handleBackToAdminTools, handleBackToTable]);

    const centerTopbarContent = useMemo(() => {
        if (viewMode !== 'table') return null;

        return (
            <div className="flex items-center gap-2">
                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${activeTab === 0
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                    onClick={() => handleTabChange(0)}
                >
                    <Icon icon={fileTextIcon} className="w-4 h-4" />
                    <span>Contract ({contractCount})</span>
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${activeTab === 1
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                    onClick={() => handleTabChange(1)}
                >
                    <Icon icon={filePlusIcon} className="w-4 h-4" />
                    <span>VO ({voCount})</span>
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${activeTab === 2
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                    onClick={() => handleTabChange(2)}
                >
                    <Icon icon={filePlus2Icon} className="w-4 h-4" />
                    <span>Other ({otherCount})</span>
                </button>
            </div>
        );
    }, [viewMode, activeTab, contractCount, voCount, otherCount, handleTabChange]);

    const rightTopbarContent = useMemo(() => {
        if (viewMode === 'table') return null;

        return (
            <ExportDropdown
                exportingPdf={exportingPdf}
                exportingWord={exportingWord}
                onExportPdf={handleExportPdf}
                onExportWord={handleExportWord}
            />
        );
    }, [viewMode, exportingPdf, exportingWord, handleExportPdf, handleExportWord]);

    useEffect(() => {
        setLeftContent(leftTopbarContent);
    }, [leftTopbarContent, setLeftContent]);

    useEffect(() => {
        setCenterContent(centerTopbarContent);
    }, [centerTopbarContent, setCenterContent]);

    useEffect(() => {
        setRightContent(rightTopbarContent);
    }, [rightTopbarContent, setRightContent]);

    useEffect(() => {
        return () => {
            clearContent();
        };
    }, [clearContent]);

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
            {viewMode === 'table' ? (
                <div className="flex-1 min-h-0 h-full">
                    {loading ? (
                        <Loader
                            icon="file-text"
                            subtitle="Loading: Templates"
                            description="Preparing template data..."
                        />
                    ) : (
                        <>
                            {/* Contract Templates Tab */}
                            {activeTab === 0 && (
                                <Spreadsheet<ContractTemplate>
                                    data={safeContractTemplates}
                                    columns={contractSpreadsheetColumns}
                                    mode="view"
                                    loading={false}
                                    emptyMessage="No contract templates found"
                                    persistKey="admin-contract-templates-spreadsheet"
                                    rowHeight={40}
                                    actionsRender={renderContractActions}
                                    actionsColumnWidth={isAdmin ? 120 : 80}
                                    getRowId={(row) => row.id}
                                    toolbar={contractToolbar}
                                    allowKeyboardNavigation
                                    allowColumnResize
                                    allowSorting
                                    allowFilters
                                />
                            )}

                            {/* VO Templates Tab */}
                            {activeTab === 1 && (
                                <Spreadsheet<VOTemplate>
                                    data={safeVoTemplates}
                                    columns={voSpreadsheetColumns}
                                    mode="view"
                                    loading={false}
                                    emptyMessage="No VO templates found"
                                    persistKey="admin-vo-templates-spreadsheet"
                                    rowHeight={40}
                                    actionsRender={renderVOActions}
                                    actionsColumnWidth={isAdmin ? 120 : 80}
                                    getRowId={(row) => row.id}
                                    toolbar={voToolbar}
                                    allowKeyboardNavigation
                                    allowColumnResize
                                    allowSorting
                                    allowFilters
                                />
                            )}

                            {/* Other Templates Tab */}
                            {activeTab === 2 && (
                                <Spreadsheet<OtherTemplate>
                                    data={safeOtherTemplates}
                                    columns={otherSpreadsheetColumns}
                                    mode="view"
                                    loading={false}
                                    emptyMessage="No other templates found"
                                    persistKey="admin-other-templates-spreadsheet"
                                    rowHeight={40}
                                    actionsRender={renderOtherActions}
                                    actionsColumnWidth={isAdmin ? 120 : 80}
                                    getRowId={(row) => row.id}
                                    toolbar={otherToolbar}
                                    allowKeyboardNavigation
                                    allowColumnResize
                                    allowSorting
                                    allowFilters
                                />
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col p-4 gap-3">
                    {/* Preview Header */}
                    <div className="flex items-center space-x-3 shrink-0">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Icon icon={fileTextIcon} className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base-content">Template Preview</h3>
                            <p className="text-sm text-base-content/60">
                                {previewData?.fileName} - Template #{previewData?.id}
                            </p>
                        </div>
                    </div>

                    {/* Template Preview Content - fills remaining space */}
                    <div className="flex-1 bg-base-100 border border-base-300 rounded-lg shadow-sm overflow-hidden">
                        {previewData && (
                            <PDFViewer
                                fileBlob={previewData.blob}
                                fileName={previewData.fileName}
                            />
                        )}
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

            {/* Upload Template Modal */}
            {showUploadModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">
                            Upload {uploadType === 'contract' ? 'Contract' : uploadType === 'vo' ? 'VO' : 'Other'} Template
                        </h3>
                        <div className="space-y-4">
                            {currentInputFields
                                .filter((field: any) => field.type !== 'file' && field.type !== 'hidden')
                                .map((field: any) => (
                                    <div key={field.name} className="form-control">
                                        <label className="label">
                                            <span className="label-text">
                                                {field.label} {field.required && '*'}
                                            </span>
                                        </label>
                                        {field.type === 'select' ? (
                                            <select
                                                className="select select-bordered w-full"
                                                value={uploadFormData[field.name] || ''}
                                                onChange={(e) => setUploadFormData(prev => ({
                                                    ...prev,
                                                    [field.name]: e.target.value
                                                }))}
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options?.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type}
                                                className="input input-bordered w-full"
                                                value={uploadFormData[field.name] || ''}
                                                onChange={(e) => setUploadFormData(prev => ({
                                                    ...prev,
                                                    [field.name]: e.target.value
                                                }))}
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                ))}

                            {/* Hidden fields */}
                            {currentInputFields
                                .filter((field: any) => field.type === 'hidden')
                                .map((field: any) => {
                                    // Set hidden field value if not already set
                                    if (uploadFormData[field.name] === undefined && field.value !== undefined) {
                                        setUploadFormData(prev => ({
                                            ...prev,
                                            [field.name]: field.value
                                        }));
                                    }
                                    return null;
                                })}

                            {/* File Upload */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Template File (Word Document) *</span>
                                </label>
                                <input
                                    type="file"
                                    className="file-input file-input-bordered w-full"
                                    accept=".doc,.docx"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                />
                                {uploadFile && (
                                    <label className="label">
                                        <span className="label-text-alt text-success">
                                            Selected: {uploadFile.name}
                                        </span>
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadFormData({});
                                    setUploadFile(null);
                                }}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUploadSubmit}
                                disabled={uploading || !uploadFile}
                            >
                                {uploading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={uploadIcon} className="w-4 h-4" />
                                        <span>Upload Template</span>
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
});

Templates.displayName = 'Templates';

const TemplatesWithErrorBoundary = () => (
    <ErrorBoundary>
        <Templates />
    </ErrorBoundary>
);

export default TemplatesWithErrorBoundary;
