import { useRef, useImperativeHandle, forwardRef, useState } from "react";
import {
    DocumentEditorContainerComponent,
    Toolbar,
    Inject,
} from "@syncfusion/ej2-react-documenteditor";
import { Loader } from "@/components/Loader";

// Register Syncfusion license (free community license)
import { registerLicense } from "@syncfusion/ej2-base";

// Register Syncfusion license key (same as backend - from appsettings.json)
registerLicense('Ngo9BigBOggjHTQxAR8/V1JGaF5cXGpCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWH1feHRWQmRcUkZ/WkVWYEs=');

export interface WordDocumentEditorRef {
    /** Load a Word document from SFDT JSON string */
    loadFromSfdt: (sfdtContent: string, filename?: string) => void;
    /** Get the document as SFDT JSON string */
    getSfdt: () => string;
    /** Save the document as a Blob (DOCX format) */
    saveAsBlob: (format?: "Docx" | "Sfdt") => Promise<Blob>;
    /** Get the document editor instance */
    getEditor: () => DocumentEditorContainerComponent | null;
    /** Check if document has unsaved changes */
    hasChanges: () => boolean;
    /** Get current document name */
    getDocumentName: () => string;
    /** Open a blank document */
    openBlank: () => void;
}

interface WordDocumentEditorProps {
    /** Height of the editor (default: 600px) */
    height?: string;
    /** Whether to show the toolbar (default: true) */
    showToolbar?: boolean;
    /** Whether to enable editing (default: true) */
    enableEditing?: boolean;
    /** Callback when document content changes */
    onContentChange?: () => void;
    /** Callback when document is loaded */
    onDocumentLoaded?: (documentName: string) => void;
    /** Initial SFDT content to load */
    initialSfdt?: string;
    /** Initial document filename */
    initialDocumentName?: string;
}

const WordDocumentEditor = forwardRef<WordDocumentEditorRef, WordDocumentEditorProps>(
    (
        {
            height = "600px",
            showToolbar = true,
            enableEditing = true,
            onContentChange,
            onDocumentLoaded,
            initialSfdt,
            initialDocumentName,
        },
        ref
    ) => {
        const containerRef = useRef<DocumentEditorContainerComponent>(null);
        const [isLoading, setIsLoading] = useState(false);
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
        const [documentName, setDocumentName] = useState(initialDocumentName || "Untitled");

        // Load document from SFDT format
        const loadFromSfdt = (sfdtContent: string, filename?: string) => {
            if (!containerRef.current) {
                console.error("Editor not initialized");
                return;
            }

            setIsLoading(true);
            try {
                const documentEditor = containerRef.current.documentEditor;

                // Open the document using SFDT JSON
                documentEditor.open(sfdtContent);

                const name = filename || "Document.docx";
                setDocumentName(name);
                setHasUnsavedChanges(false);

                // Small delay to ensure document is rendered
                setTimeout(() => {
                    onDocumentLoaded?.(name);
                    setIsLoading(false);
                }, 300);

            } catch (error) {
                console.error("Error loading document from SFDT:", error);
                setIsLoading(false);
                throw error;
            }
        };

        // Get document as SFDT string
        const getSfdt = (): string => {
            if (!containerRef.current) {
                throw new Error("Editor not initialized");
            }
            return containerRef.current.documentEditor.serialize();
        };

        // Open a blank document
        const openBlank = () => {
            if (!containerRef.current) return;
            containerRef.current.documentEditor.openBlank();
            setDocumentName("Untitled");
            setHasUnsavedChanges(false);
        };

        // Expose methods to parent component
        useImperativeHandle(ref, () => ({
            loadFromSfdt,

            getSfdt,

            saveAsBlob: async (format: "Docx" | "Sfdt" = "Docx") => {
                if (!containerRef.current) {
                    throw new Error("Editor not initialized");
                }

                const blob = await containerRef.current.documentEditor.saveAsBlob(format);
                setHasUnsavedChanges(false);
                return blob;
            },

            getEditor: () => containerRef.current,

            hasChanges: () => hasUnsavedChanges,

            getDocumentName: () => documentName,

            openBlank,
        }));

        // Handle document editor created event
        const handleCreated = () => {
            // Load initial SFDT content if provided
            if (initialSfdt && containerRef.current) {
                loadFromSfdt(initialSfdt, initialDocumentName);
            }
        };

        // Handle content changes
        const handleContentChange = () => {
            setHasUnsavedChanges(true);
            onContentChange?.();
        };

        return (
            <div className="relative">
                {isLoading && (
                    <Loader
                        overlay
                        icon="file-text"
                        subtitle="Loading: Document"
                        description="Preparing document..."
                    />
                )}
                <DocumentEditorContainerComponent
                    ref={containerRef}
                    height={height}
                    enableToolbar={showToolbar}
                    restrictEditing={!enableEditing}
                    enableSpellCheck={false}
                    enableComment={true}
                    enableTrackChanges={false}
                    showPropertiesPane={false}
                    contentChange={handleContentChange}
                    created={handleCreated}
                >
                    <Inject services={[Toolbar]} />
                </DocumentEditorContainerComponent>

                {/* Unsaved changes indicator */}
                {hasUnsavedChanges && (
                    <div className="absolute top-2 right-2 z-10">
                        <span className="badge badge-warning badge-sm gap-1">
                            <span className="iconify lucide--circle-dot size-3"></span>
                            Unsaved changes
                        </span>
                    </div>
                )}
            </div>
        );
    }
);

WordDocumentEditor.displayName = "WordDocumentEditor";

export default WordDocumentEditor;
