import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { MetaData } from "@/components/MetaData";
import { Loader } from "@/components/Loader";
import { ACTIVE_API_URL } from "@/api/api";
import { useAuth } from "@/contexts/auth";
import Icon from "@/components/Icon";
import { Button, Checkbox, Select, SelectOption } from "@/components/daisyui";
import useVerifyLogin from "./use-verify-login";

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
    const { isLoggedIn, getToken, logout } = useAuth();

    const loggedIn = isLoggedIn();
    const dbRegion = searchParams.get("db");

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPreview, setIsPreview] = useState(false);

    // Check for preview mode immediately (no auth needed)
    useEffect(() => {
        if (token === "preview") {
            setIsPreview(true);
        }
    }, [token]);

    // Verify document when user is logged in
    useEffect(() => {
        if (!loggedIn || !token || token === "preview") return;

        const verifyDocument = async () => {
            setLoading(true);
            setError(null);

            try {
                const dbParam = dbRegion ? `?dbConnection=${encodeURIComponent(dbRegion)}` : "";
                const authToken = getToken();

                const response = await fetch(`${ACTIVE_API_URL}public/Verification/${token}${dbParam}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                    },
                });

                if (response.status === 401) {
                    // Clear expired auth state so the login form reappears
                    logout();
                    return;
                }

                if (!response.ok) {
                    throw new Error("Failed to verify document");
                }

                const data: VerificationResult = await response.json();
                setResult(data);
            } catch {
                setError("An error occurred while verifying the document. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        verifyDocument();
    }, [loggedIn, token, dbRegion]);

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

    // Preview mode — no auth required
    if (isPreview) {
        return (
            <>
                <MetaData title="Document Verification - Preview" noIndex />
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-4">
                    <div className="w-full max-w-md">
                        <PageHeader />
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <PreviewContent />
                            </div>
                        </div>
                        <PageFooter />
                    </div>
                </div>
            </>
        );
    }

    // Not logged in — show login form
    if (!loggedIn) {
        return (
            <>
                <MetaData title="Document Verification - Login" noIndex />
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-4">
                    <div className="w-full max-w-md">
                        <PageHeader />
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <LoginGate preselectedDb={dbRegion} />
                            </div>
                        </div>
                        <PageFooter />
                    </div>
                </div>
            </>
        );
    }

    // Logged in — show verification result
    return (
        <>
            <MetaData title="Document Verification" noIndex />
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-200 to-base-300 p-4">
                <div className="w-full max-w-md">
                    <PageHeader />
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
                            ) : error ? (
                                <ErrorContent message={error} />
                            ) : result?.isValid ? (
                                <SuccessContent
                                    result={result}
                                    formatDate={formatDate}
                                    formatAmount={formatAmount}
                                    formatDateTime={formatDateTime}
                                />
                            ) : (
                                <FailedContent message={result?.message} />
                            )}
                        </div>
                    </div>
                    <PageFooter />
                </div>
            </div>
        </>
    );
};

// --- Sub-components ---

const PageHeader = () => (
    <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-base-content">
            SAM Document Verification
        </h1>
        <p className="text-sm text-base-content/60">
            Subcontractor Administration Module
        </p>
    </div>
);

const PageFooter = () => (
    <div className="mt-4 text-center text-sm text-base-content/50">
        <a href="https://sam.karamentreprises.com" className="link">
            SAM - Subcontractor Administration Module
        </a>
    </div>
);

const LoginGate = ({ preselectedDb }: { preselectedDb: string | null }) => {
    const {
        databases,
        showPassword,
        isLoading,
        isMicrosoftLoading,
        error,
        onSubmit,
        toggleShowPassword,
        onMicrosoftLogin,
        getInitialDb,
    } = useVerifyLogin({ preselectedDb });

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selectedDb, setSelectedDb] = useState("");
    const [isTermsAgreed, setIsTermsAgreed] = useState(false);

    // Set initial database selection when databases load
    useEffect(() => {
        if (databases.length > 0 && !selectedDb) {
            setSelectedDb(getInitialDb());
        }
    }, [databases, selectedDb, getInitialDb]);

    return (
        <div>
            <div className="mb-4 text-center">
                <div className="mb-3 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <span className="iconify lucide--log-in text-primary" style={{ fontSize: "1.75rem" }}></span>
                    </div>
                </div>
                <h2 className="text-lg font-semibold text-base-content">Login Required</h2>
                <p className="mt-1 text-sm text-base-content/60">
                    Please log in to verify this document
                </p>
            </div>

            <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit({ username, password, db: selectedDb });
                }}>
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">Database</legend>
                    <label className="input w-full focus:outline-0">
                        <Icon icon={"database"} fontSize={5} className="text-base-content/40" />
                        <Select
                            className="w-full border-none bg-transparent focus:ring-0 focus:outline-none"
                            value={selectedDb}
                            required
                            onChange={(e) => setSelectedDb(e.target.value)}>
                            {databases.map((db) => (
                                <SelectOption
                                    key={db}
                                    value={db}
                                    className="bg-base-100"
                                    hidden={db === databases[0]}>
                                    {db}
                                </SelectOption>
                            ))}
                        </Select>
                    </label>

                    <legend className="fieldset-legend">Username</legend>
                    <label className="input w-full focus:outline-0">
                        <Icon icon={"user-2"} fontSize={5} className="text-base-content/40" />
                        <input
                            disabled={!selectedDb || selectedDb === databases[0]}
                            className="grow focus:outline-0"
                            placeholder="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>

                    <legend className="fieldset-legend">Password</legend>
                    <label className="input w-full focus:outline-0">
                        <Icon icon={"key-round"} fontSize={5} className="text-base-content/40" />
                        <input
                            disabled={!selectedDb || selectedDb === databases[0]}
                            className="grow focus:outline-0"
                            placeholder="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            className="btn btn-xs btn-ghost btn-circle"
                            onClick={toggleShowPassword}
                            type="button">
                            {showPassword ? <Icon icon={"eye-off"} /> : <Icon icon={"eye"} />}
                        </button>
                    </label>

                    {error && <div className="text-error text-sm">{String(error)}</div>}
                </fieldset>

                <div className="flex items-center gap-3">
                    <Checkbox
                        color="primary"
                        size="xs"
                        aria-label="agreement"
                        onChange={() => setIsTermsAgreed(!isTermsAgreed)}
                    />
                    <label className="text-sm">
                        I agree with
                        <span className="text-primary ms-1 cursor-pointer hover:underline">
                            terms and conditions
                        </span>
                    </label>
                </div>

                <Button
                    type="submit"
                    color="primary"
                    className="btn-wide mt-2 max-w-full"
                    disabled={!isTermsAgreed || isLoading || !selectedDb || !username || !password}>
                    {isLoading ? "Logging in..." : "Login"}
                </Button>

                <Button
                    color="ghost"
                    className="btn-wide border-base-300 max-w-full gap-3"
                    type="button"
                    disabled={!isTermsAgreed || isLoading || isMicrosoftLoading || !selectedDb || selectedDb === "Select Database"}
                    onClick={() => onMicrosoftLogin(selectedDb)}>
                    {isMicrosoftLoading ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                                className="size-4.5"
                                alt="Microsoft Logo"
                            />
                            <span>Sign in with Microsoft</span>
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
};

const PreviewContent = () => (
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
);

const ErrorContent = ({ message }: { message: string }) => (
    <div className="text-center">
        <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20">
                <span className="iconify lucide--x-circle text-error" style={{ fontSize: "2.5rem" }}></span>
            </div>
        </div>
        <h2 className="text-xl font-bold text-error">Verification Failed</h2>
        <p className="mt-2 text-base-content/70">{message}</p>
    </div>
);

const SuccessContent = ({
    result,
    formatDate,
    formatAmount,
    formatDateTime,
}: {
    result: VerificationResult;
    formatDate: (d?: string) => string;
    formatAmount: (a?: number, c?: string) => string;
    formatDateTime: (d?: string) => string;
}) => (
    <>
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

        <div className="text-center text-xs text-base-content/50">
            <p>This document has been verified by the SAM system.</p>
            <p className="mt-1">Karam Entreprises</p>
        </div>
    </>
);

const FailedContent = ({ message }: { message?: string }) => (
    <div className="text-center">
        <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
                <span className="iconify lucide--alert-triangle text-warning" style={{ fontSize: "2.5rem" }}></span>
            </div>
        </div>
        <h2 className="text-xl font-bold text-warning">Verification Failed</h2>
        <p className="mt-2 text-base-content/70">{message}</p>
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
);

export default VerifyPage;
