import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import WordDocumentEditor, { WordDocumentEditorRef } from "./index";

interface DocumentEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** The SFDT content to edit (from backend conversion) */
    sfdtContent?: string;
    /** The document blob to edit (legacy - will be converted to SFDT) */
    documentBlob?: Blob;
    /** The document filename */
    documentName?: string;
    /** Title shown in the modal header */
    title?: string;
    /** Description shown in the modal header */
    description?: string;
    /** Callback when document is saved - receives the SFDT content */
    onSaveSfdt?: (sfdtContent: string, filename: string) => Promise<void>;
    /** Legacy callback when document is saved - receives blob */
    onSave?: (blob: Blob, filename: string) => Promise<void>;
    /** Callback when document is downloaded */
    onDownload?: (blob: Blob, filename: string) => void;
    /** Whether to show save button (for saving back to server) */
    showSaveButton?: boolean;
    /** Additional metadata to display */
    metadata?: {
        label: string;
        value: string;
    }[];
    /** Whether the SFDT content is currently loading */
    isLoadingSfdt?: boolean;
    /** Error message when loading SFDT fails */
    loadError?: string;
}

const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
    isOpen,
    onClose,
    sfdtContent,
    documentBlob,
    documentName = "Document.docx",
    title = "Edit Document",
    description,
    onSaveSfdt,
    onSave,
    onDownload,
    showSaveButton = true,
    metadata,
    isLoadingSfdt = false,
    loadError,
}) => {
    const editorRef = useRef<WordDocumentEditorRef>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [isEditorLoading, setIsEditorLoading] = useState(false);

    // Load SFDT content when it becomes available
    useEffect(() => {
        if (sfdtContent && editorRef.current && !documentLoaded) {
            // Show loading state while editor initializes
            setIsEditorLoading(true);
            // Small delay to ensure editor is fully initialized
            const timer = setTimeout(() => {
                try {
                    console.log("Loading SFDT content, length:", sfdtContent.length);
                    editorRef.current?.loadFromSfdt(sfdtContent, documentName);
                    setDocumentLoaded(true);
                    setIsEditorLoading(false);
                } catch (error) {
                    console.error("Error loading SFDT:", error);
                    setIsEditorLoading(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [sfdtContent, documentName, documentLoaded]);

    // Reset states when modal closes
    useEffect(() => {
        if (!isOpen) {
            setDocumentLoaded(false);
            setIsEditorLoading(false);
        }
    }, [isOpen]);

    const handleContentChange = useCallback(() => {
        setHasChanges(true);
    }, []);

    const handleDocumentLoaded = useCallback((name: string) => {
        console.log("Document loaded callback:", name);
    }, []);

    const handleSave = async () => {
        if (!editorRef.current || !onSaveSfdt) return;

        setIsSaving(true);
        try {
            const sfdt = editorRef.current.getSfdt();
            await onSaveSfdt(sfdt, documentName);
            setHasChanges(false);
        } catch (error) {
            console.error("Error saving document:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!editorRef.current) return;

        setIsDownloading(true);
        try {
            const blob = await editorRef.current.saveAsBlob("Docx");

            if (onDownload) {
                onDownload(blob, documentName);
            } else {
                // Default download behavior
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = documentName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Error downloading document:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleClose = () => {
        if (hasChanges) {
            const confirm = window.confirm(
                "You have unsaved changes. Are you sure you want to close?"
            );
            if (!confirm) return;
        }
        setHasChanges(false);
        setDocumentLoaded(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-7xl h-full max-h-[95vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--file-pen text-blue-600 dark:text-blue-400 size-5"></span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-base-content">
                                    {title}
                                </h3>
                                {hasChanges && (
                                    <span className="badge badge-warning badge-sm">
                                        Unsaved
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-base-content/70">
                                {description || documentName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {showSaveButton && onSaveSfdt && (
                            <Button
                                type="button"
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700"
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--save size-4"></span>
                                        Save
                                    </>
                                )}
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={handleDownload}
                            disabled={isDownloading || !sfdtContent}
                        >
                            {isDownloading ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
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
                            disabled={isSaving}
                        >
                            <span className="iconify lucide--x size-4"></span>
                        </button>
                    </div>
                </div>

                {/* Metadata Section */}
                {metadata && metadata.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-base-200 rounded-lg">
                        {metadata.map((item, index) => (
                            <div key={index}>
                                <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">
                                    {item.label}
                                </span>
                                <p className="text-sm font-medium text-base-content">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Editor Container */}
                <div className="flex-1 min-h-0 bg-base-100 rounded-lg border border-base-300 overflow-hidden relative">
                    {isLoadingSfdt ? (
                        <Loader
                            icon="file-text"
                            subtitle="Loading: Document"
                            description="Preparing document for editing..."
                        />
                    ) : loadError ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-error/10 rounded-full mx-auto w-fit">
                                    <span className="iconify lucide--alert-circle text-error size-12"></span>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-base-content">
                                        Failed to Load Document
                                    </h4>
                                    <p className="text-sm text-base-content/70 max-w-md">
                                        {loadError}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Loading overlay while editor initializes document */}
                            {isEditorLoading && (
                                <Loader
                                    overlay
                                    icon="file-edit"
                                    subtitle="Initializing Editor"
                                    description="Preparing document editor..."
                                />
                            )}
                            <WordDocumentEditor
                                ref={editorRef}
                                height="calc(95vh - 220px)"
                                showToolbar={true}
                                enableEditing={true}
                                onContentChange={handleContentChange}
                                onDocumentLoaded={handleDocumentLoaded}
                                initialDocumentName={documentName}
                            />
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-base-300">
                    <div className="flex items-center justify-between text-xs text-base-content/60">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <span className="iconify lucide--info size-3"></span>
                                Full Word editing experience - format text, add tables, images, and more
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="badge badge-ghost badge-xs">
                                Powered by Syncfusion
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose} disabled={isSaving}>
                    close
                </button>
            </form>
        </dialog>
    );
};

export default DocumentEditorModal;
