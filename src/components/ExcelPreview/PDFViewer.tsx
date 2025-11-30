import { useState, useEffect, memo, useCallback } from "react";

interface PDFViewerProps {
    fileBlob: Blob;
    fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = memo(({ fileBlob, fileName }) => {
    const [pdfUrl, setPdfUrl] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Create object URL for native browser PDF viewer
     
    useEffect(() => {
        if (!fileBlob) {
            setError('No PDF file provided');
            setIsLoading(false);
            return;
        }

        // Check if blob is valid and not empty
        if (!(fileBlob instanceof Blob)) {
            setError('Invalid PDF file - not a valid blob');
            setIsLoading(false);
            return;
        }

        if (fileBlob.size < 1000) {
            setError('PDF file is empty or corrupted');
            setIsLoading(false);
            return;
        }

        let objectUrl: string | null = null;

        try {
            // Create object URL for native browser PDF viewer
            objectUrl = URL.createObjectURL(fileBlob);
            // Remove #zoom=100 to avoid blob URL loading issues
            setPdfUrl(objectUrl);
            setIsLoading(false);
            setError(null);
        } catch (urlError) {
            console.error('Failed to create PDF viewer URL:', urlError);
            setError('Failed to create PDF viewer URL');
            setIsLoading(false);
        }

        // Cleanup function to revoke object URL
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [fileBlob]);

    // Handle iframe load error
    const handleIframeError = useCallback(() => {
        setError('Failed to load PDF document');
        setIsLoading(false);
    }, []);

    // Handle iframe load success
    const handleIframeLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <span className="iconify lucide--file-x text-error size-12 mb-2"></span>
                    <p className="text-error mb-2">{error}</p>
                    <p className="text-sm text-base-content/60">Please try downloading the file instead</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-base-100">
            {/* PDF Content */}
            <div className="flex-1 overflow-hidden">
                {isLoading && !error && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <span className="loading loading-ring loading-lg text-primary"></span>
                            <p className="text-base-content font-medium mt-4">Loading PDF...</p>
                        </div>
                    </div>
                )}
                {pdfUrl && !error && (
                    <object
                        data={pdfUrl}
                        type="application/pdf"
                        className="w-full h-full border-0"
                        style={{
                            minHeight: '500px',
                            backgroundColor: 'var(--fallback-b2, oklch(var(--b2)))'
                        }}
                        aria-label={fileName}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    >
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="text-center">
                                <span className="iconify lucide--file-text text-base-content/50 size-12 mb-4"></span>
                                <p className="text-base-content/70 mb-4">
                                    Your browser cannot display the PDF inline.
                                </p>
                                <a
                                    href={pdfUrl}
                                    download={fileName}
                                    className="btn btn-primary btn-sm"
                                >
                                    Download PDF
                                </a>
                            </div>
                        </div>
                    </object>
                )}
            </div>
        </div>
    );
});

PDFViewer.displayName = 'PDFViewer';

export default PDFViewer;