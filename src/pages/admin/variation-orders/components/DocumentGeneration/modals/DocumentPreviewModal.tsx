import { useState, useEffect } from "react";
import { Button } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import useDocumentGeneration from "../use-document-generation";

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewData?: {
        type: 'live' | 'saved';
        data: Blob;
        template?: any;
        voDataset?: any;
        voDatasetId?: number;
    };
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    isOpen,
    onClose,
    previewData
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [downloadLoading, setDownloadLoading] = useState(false);

    const { downloadDocument } = useDocumentGeneration();
    const { toaster } = useToast();

    useEffect(() => {
        if (isOpen && previewData?.data) {
            // Create preview URL from blob
            const url = URL.createObjectURL(previewData.data);
            setPreviewUrl(url);
        }

        return () => {
            // Clean up preview URL when modal closes
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        };
    }, [isOpen, previewData]);

    const handleDownload = async () => {
        if (!previewData) return;

        setDownloadLoading(true);
        try {
            if (previewData.type === 'saved' && previewData.voDatasetId) {
                // Use the download function for saved documents
                await downloadDocument(previewData.voDatasetId);
            } else if (previewData.data) {
                // Direct download of the blob
                const url = URL.createObjectURL(previewData.data);
                const a = document.createElement('a');
                a.href = url;
                
                const fileName = previewData.type === 'live' 
                    ? `VO_Preview_${Date.now()}.zip`
                    : `VO_Document_${previewData.voDatasetId || 'Unknown'}.zip`;
                    
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toaster.success("Document downloaded successfully");
            }
        } catch (error) {
            console.error("Download error:", error);
            toaster.error("Failed to download document");
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

    const handleApprove = () => {
        // TODO: Implement approval workflow
        toaster.info("Approval functionality to be implemented");
    };

    const handleReject = () => {
        // TODO: Implement rejection workflow  
        toaster.info("Rejection functionality to be implemented");
    };

    if (!isOpen || !previewData) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-6xl h-full max-h-[95vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--eye text-blue-600 dark:text-blue-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">Document Preview</h3>
                            <p className="text-sm text-base-content/70">
                                {previewData.type === 'live' ? 'Live Preview' : 'Saved Document'} 
                                {previewData.template && ` - ${previewData.template.name}`}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={handleApprove}
                        >
                            <span className="iconify lucide--check size-4"></span>
                            Approve
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleReject}
                        >
                            <span className="iconify lucide--x size-4"></span>
                            Reject
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
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
                                    Download
                                </>
                            )}
                        </Button>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={handleClose}
                            disabled={downloadLoading}
                        >
                            <span className="iconify lucide--x size-4"></span>
                        </button>
                    </div>
                </div>

                {/* Document Information */}
                {(previewData.voDataset || previewData.template) && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-base-200 rounded-lg">
                        {previewData.voDataset && (
                            <>
                                <div>
                                    <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">VO Number</span>
                                    <p className="text-sm font-medium text-base-content">
                                        {previewData.voDataset.voNumber || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Project</span>
                                    <p className="text-sm font-medium text-base-content">
                                        {previewData.voDataset.projectName || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Subcontractor</span>
                                    <p className="text-sm font-medium text-base-content">
                                        {previewData.voDataset.subcontractorName || '-'}
                                    </p>
                                </div>
                            </>
                        )}
                        {previewData.template && (
                            <div>
                                <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Template</span>
                                <p className="text-sm font-medium text-base-content">
                                    {previewData.template.name || '-'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview Content */}
                <div className="flex-1 min-h-96 bg-base-200 rounded-lg border border-base-300">
                    <div className="h-96 flex flex-col items-center justify-center p-8">
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-blue-100 rounded-full dark:bg-blue-900/30 mx-auto w-fit">
                                <span className="iconify lucide--file-archive text-blue-600 dark:text-blue-400 size-12"></span>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-base-content">VO Document Package</h4>
                                <p className="text-sm text-base-content/70 max-w-md">
                                    This is a ZIP archive containing both Word and PDF versions of the VO document. 
                                    Click the download button to save the complete document package.
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className="badge badge-info badge-sm">
                                    <span className="iconify lucide--file-text size-3 mr-1"></span>
                                    Word Document
                                </span>
                                <span className="badge badge-error badge-sm">
                                    <span className="iconify lucide--file-text size-3 mr-1"></span>
                                    PDF Document
                                </span>
                                <span className="badge badge-warning badge-sm">
                                    <span className="iconify lucide--archive size-3 mr-1"></span>
                                    ZIP Archive
                                </span>
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
                                            Download Documents
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document Information */}
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                        <span className="iconify lucide--info text-green-600 dark:text-green-400 size-5 mt-0.5"></span>
                        <div>
                            <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">Document Package Contents</h5>
                            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                                <p>• <strong>Word Document (.docx)</strong> - Editable version for modifications and signatures</p>
                                <p>• <strong>PDF Document (.pdf)</strong> - Final formatted version for distribution and archival</p>
                                <p>• Both documents contain identical VO information with proper formatting and calculations</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Type Information */}
                {previewData.type === 'live' && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-3">
                            <span className="iconify lucide--alert-triangle text-yellow-600 dark:text-yellow-400 size-5 mt-0.5"></span>
                            <div>
                                <h5 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">Live Preview Notice</h5>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                    This is a live preview generated from current data. Changes have not been saved to the database. 
                                    Use the Generate button to create and save the final document.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose} disabled={downloadLoading}>close</button>
            </form>
        </dialog>
    );
};

export default DocumentPreviewModal;