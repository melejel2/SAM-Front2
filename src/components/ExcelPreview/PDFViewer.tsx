import { useState, useEffect } from "react";

interface PDFViewerProps {
    fileBlob: Blob;
    fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileBlob, fileName }) => {
    const [pdfUrl, setPdfUrl] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    // Create object URL for native browser PDF viewer
    useEffect(() => {
        if (fileBlob) {
            // Check if blob is empty or very small
            if (fileBlob.size < 1000) {
                setError('PDF file is empty or corrupted');
                return;
            }
            
            // Create object URL for native browser PDF viewer
            const objectUrl = URL.createObjectURL(fileBlob);
            setPdfUrl(objectUrl);
        }
    }, [fileBlob]);

    // Cleanup object URL when component unmounts
    useEffect(() => {
        return () => {
            if (pdfUrl && pdfUrl.startsWith('blob:')) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

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
                {pdfUrl ? (
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title={fileName}
                        onError={() => setError('Failed to load PDF document')}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-top-primary mx-auto mb-4"></div>
                            <p className="text-base-content font-medium">Loading PDF...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;