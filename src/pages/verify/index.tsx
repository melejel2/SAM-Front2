import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { MetaData } from "@/components/MetaData";
import { Loader } from "@/components/Loader";
import { ACTIVE_API_URL } from "@/api/api";

interface VerificationResult {
    isValid: boolean;
    message?: string;
    documentTypeName?: string;
    documentType?: number;
    projectName?: string;
    subcontractorName?: string;
    contractNumber?: string;
    documentNumber?: string;
    amount?: number;
    currency?: string;
    documentDate?: string;
    generatedAt?: string;
    status?: string;
}

const VerifyPage = () => {
    const { token } = useParams<{ token: string }>();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        const verifyDocument = async () => {
            if (!token) {
                setError("No verification token provided.");
                setLoading(false);
                return;
            }

            // Handle preview mode - this is a preview document, not saved to database
            if (token === "preview") {
                setIsPreview(true);
                setLoading(false);
                return;
            }

            try {
                // Get database region from URL query parameter (for multi-tenant routing)
                const dbRegion = searchParams.get("db");
                const dbParam = dbRegion ? `?dbConnection=${encodeURIComponent(dbRegion)}` : "";

                const response = await fetch(`${ACTIVE_API_URL}public/Verification/${token}${dbParam}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to verify document");
                }

                const data: VerificationResult = await response.json();
                setResult(data);
            } catch (err) {
                setError("An error occurred while verifying the document. Please try again.");
                console.error("Verification error:", err);
            } finally {
                setLoading(false);
            }
        };

        verifyDocument();
    }, [token, searchParams]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatAmount = (amount?: number, currency?: string) => {
        if (amount === undefined || amount === null) return "-";
        return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency || ""}`.trim();
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <MetaData title="Document Verification" noIndex />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-4">
                <div className="w-full max-w-md">
                    {/* Logo/Branding */}
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-base-content">
                            SAM Document Verification
                        </h1>
                        <p className="text-sm text-base-content/60">
                            Subcontractor Administration Module
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            {loading ? (
                                <Loader
                                    icon="shield-check"
                                    subtitle="Verifying Document"
                                    description="Checking document authenticity..."
                                    height="auto"
                                    minHeight="200px"
                                />
                            ) : isPreview ? (
                                <div className="text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-info/20">
                                            <span className="iconify lucide--eye text-info" style={{ fontSize: "2.5rem" }}></span>
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-info">Preview Document</h2>
                                    <p className="mt-2 text-base-content/70">
                                        This is a preview version of the document.
                                    </p>
                                    <div className="mt-4 rounded-lg bg-info/10 p-4 text-sm text-base-content/70">
                                        <p className="font-medium text-info">This QR code is for preview purposes only.</p>
                                        <p className="mt-2">
                                            Once the document is generated and saved, a unique verification
                                            QR code will be created that can be used to verify the document's authenticity.
                                        </p>
                                    </div>
                                    <div className="divider"></div>
                                    <div className="text-xs text-base-content/50">
                                        <p>SAM - Subcontractor Administration Module</p>
                                        <p className="mt-1">Karam Entreprises</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20">
                                            <span className="iconify lucide--x-circle text-error" style={{ fontSize: "2.5rem" }}></span>
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-error">Verification Failed</h2>
                                    <p className="mt-2 text-base-content/70">{error}</p>
                                </div>
                            ) : result?.isValid ? (
                                <>
                                    {/* Success Header */}
                                    <div className="text-center">
                                        <div className="mb-4 flex justify-center">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                                                <span className="iconify lucide--check-circle text-success" style={{ fontSize: "2.5rem" }}></span>
                                            </div>
                                        </div>
                                        <h2 className="text-xl font-bold text-success">Document Verified</h2>
                                        <p className="text-base-content/70">{result.message}</p>
                                    </div>

                                    <div className="divider"></div>

                                    {/* Document Details */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-base-content/60">Document Type</span>
                                            <span className="font-medium">{result.documentTypeName}</span>
                                        </div>
                                        {result.documentNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-base-content/60">Document Number</span>
                                                <span className="font-medium">{result.documentNumber}</span>
                                            </div>
                                        )}
                                        {result.contractNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-base-content/60">Contract Number</span>
                                                <span className="font-medium">{result.contractNumber}</span>
                                            </div>
                                        )}
                                        {result.projectName && (
                                            <div className="flex justify-between">
                                                <span className="text-base-content/60">Project</span>
                                                <span className="font-medium text-right max-w-[200px]">{result.projectName}</span>
                                            </div>
                                        )}
                                        {result.subcontractorName && (
                                            <div className="flex justify-between">
                                                <span className="text-base-content/60">Subcontractor</span>
                                                <span className="font-medium text-right max-w-[200px]">{result.subcontractorName}</span>
                                            </div>
                                        )}
                                        {result.amount !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="text-base-content/60">Amount</span>
                                                <span className="font-medium">{formatAmount(result.amount, result.currency)}</span>
                                            </div>
                                        )}
                                        {result.documentDate && (
                                            <div className="flex justify-between">
                                                <span className="text-base-content/60">Document Date</span>
                                                <span className="font-medium">{formatDate(result.documentDate)}</span>
                                            </div>
                                        )}
                                        {result.generatedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-base-content/60">Generated</span>
                                                <span className="font-medium">{formatDateTime(result.generatedAt)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="divider"></div>

                                    {/* Footer */}
                                    <div className="text-center text-xs text-base-content/50">
                                        <p>This document has been verified by the SAM system.</p>
                                        <p className="mt-1">Karam Entreprises</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
                                            <span className="iconify lucide--alert-triangle text-warning" style={{ fontSize: "2.5rem" }}></span>
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-warning">Verification Failed</h2>
                                    <p className="mt-2 text-base-content/70">{result?.message}</p>
                                    <div className="mt-4 text-sm text-base-content/60">
                                        <p>This document could not be verified.</p>
                                        <p>The verification link may be:</p>
                                        <ul className="mt-2 list-inside list-disc text-left">
                                            <li>Expired</li>
                                            <li>Invalid</li>
                                            <li>Already revoked</li>
                                        </ul>
                                        <p className="mt-2">Please contact the issuing party.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Link */}
                    <div className="mt-4 text-center text-sm text-base-content/50">
                        <a href="https://sam.karamentreprises.com" className="link">
                            SAM - Subcontractor Administration Module
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerifyPage;
