import { useState, useEffect } from "react";
import { Button } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import useVOTemplates from "../use-vo-templates";

interface VOTemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template?: any;
}

const VOTemplatePreviewModal: React.FC<VOTemplatePreviewModalProps> = ({
    isOpen,
    onClose,
    template
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    const { downloadVoTemplate } = useVOTemplates();
    const { toaster } = useToast();

    useEffect(() => {
        if (isOpen && template) {
            loadPreview();
        }
        return () => {
            // Clean up preview URL when modal closes
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        };
    }, [isOpen, template]);

    const loadPreview = async () => {
        if (!template) return;
        
        setLoading(true);
        try {
            const blob = await downloadVoTemplate(template.id);
            if (blob) {
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
            }
        } catch (error) {
            console.error("Error loading template preview:", error);
            toaster.error("Failed to load template preview");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!template) return;
        
        setDownloadLoading(true);
        try {
            const blob = await downloadVoTemplate(template.id);
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${template.name || 'VO_Template'}.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toaster.success("Template downloaded successfully");
            }
        } catch (error) {
            console.error("Download error:", error);
            toaster.error("Failed to download template");
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleClose = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        onClose();
    };

    if (!isOpen || !template) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-6xl h-full max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                            <span className="iconify lucide--eye text-purple-600 dark:text-purple-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">Template Preview</h3>
                            <p className="text-sm text-base-content/70">{template.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={handleDownload}
                            disabled={downloadLoading || loading}
                        >
                            {downloadLoading ? (
                                <>
                                    <Loader />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--download size-4"></span>
                                    Download
                                </>
                            )}
                        </Button>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={handleClose}
                            disabled={loading || downloadLoading}
                        >
                            <span className="iconify lucide--x size-4"></span>
                        </button>
                    </div>
                </div>

                {/* Template Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-base-200 rounded-lg">
                    <div>
                        <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Template Number</span>
                        <p className="text-sm font-medium text-base-content">{template.templateNumber || '-'}</p>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Type</span>
                        <p className="text-sm font-medium text-base-content">{template.type || '-'}</p>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Language</span>
                        <p className="text-sm font-medium text-base-content">{template.language || 'Default'}</p>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">File Size</span>
                        <p className="text-sm font-medium text-base-content">{template.fileSize || '-'}</p>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 h-96 bg-base-200 rounded-lg border border-base-300">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader />
                                <p className="text-sm text-base-content/70 mt-2">Loading template preview...</p>
                            </div>
                        </div>
                    ) : previewUrl ? (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-blue-100 rounded-full dark:bg-blue-900/30 mx-auto w-fit">
                                    <span className="iconify lucide--file-text text-blue-600 dark:text-blue-400 size-12"></span>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-base-content">Word Document Template</h4>
                                    <p className="text-sm text-base-content/70 max-w-md">
                                        This is a Microsoft Word template file. Click the download button to view the full template 
                                        in Microsoft Word or a compatible application.
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-center pt-4">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="btn-primary"
                                        onClick={handleDownload}
                                        disabled={downloadLoading}
                                    >
                                        {downloadLoading ? (
                                            <>
                                                <Loader />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <span className="iconify lucide--download size-4"></span>
                                                Download Template
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <span className="iconify lucide--alert-circle text-base-content/50 size-12 mb-2"></span>
                                <p className="text-sm text-base-content/70">Failed to load template preview</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="btn-outline mt-2"
                                    onClick={loadPreview}
                                >
                                    Retry
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Template Usage Information */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <span className="iconify lucide--info text-blue-600 dark:text-blue-400 size-5 mt-0.5"></span>
                        <div>
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Template Usage</h5>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                This template will be used to generate variation order documents. 
                                The template contains placeholders that will be replaced with actual VO data during document generation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose} disabled={loading || downloadLoading}>close</button>
            </form>
        </dialog>
    );
};

export default VOTemplatePreviewModal;