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
        console.log('PDFViewer useEffect triggered:', {
            hasFileBlob: !!fileBlob,
            blobSize: fileBlob?.size,
            blobType: fileBlob?.type
        });
        
        if (fileBlob) {
            // Check if blob is empty or very small
            if (fileBlob.size < 1000) {
                console.error('PDF file too small:', fileBlob.size);
                setError('PDF file is empty or corrupted');
                return;
            }
            
            console.log('Creating object URL for PDF blob...');
            // Create object URL for native browser PDF viewer
            const objectUrl = URL.createObjectURL(fileBlob);
            console.log('Object URL created:', objectUrl);
            setPdfUrl(objectUrl);
        } else {
            console.log('No fileBlob provided to PDFViewer');
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
                    <>
                        {console.log('Rendering iframe with URL:', pdfUrl)}
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            style={{ 
                                minHeight: '500px',
                                backgroundColor: '#f0f0f0' 
                            }}
                            title={fileName}
                            onLoad={() => console.log('PDF iframe loaded successfully')}
                            onError={(e) => {
                                console.error('PDF iframe error:', e);
                                setError('Failed to load PDF document');
                            }}
                        />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-top-primary mx-auto mb-4"></div>
                            <p className="text-base-content font-medium">Loading PDF...</p>
                            {console.log('PDFViewer waiting for pdfUrl, current pdfUrl:', pdfUrl)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;