import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import infoIcon from "@iconify/icons-lucide/info";
import uploadIcon from "@iconify/icons-lucide/upload";
import xIcon from "@iconify/icons-lucide/x";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import { uploadContractVo } from "@/api/services/vo-api";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/daisyui";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

interface VOBOQImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (importedItems: any[]) => void;
    contractDataSetId: number;
    voNumber: string;
    tradeName?: string;
    contractNumber: string;
    projectName: string;
}

interface ImportedVOItem {
    id: number;
    no: string;
    key: string; // description
    unite: string; // unit
    qte: number; // quantity
    pu: number; // unit price
    totalPrice: number;
    costCodeId?: number;
    costCode?: string;
}

const VOBOQImportModal: React.FC<VOBOQImportModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    contractDataSetId,
    voNumber,
    tradeName,
    contractNumber,
    projectName,
}) => {
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [previewItems, setPreviewItems] = useState<ImportedVOItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const { toaster } = useToast();
    const { getToken } = useAuth();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            handleReset();
        }
    }, [isOpen]);

    const handleReset = () => {
        setExcelFile(null);
        setPreviewItems([]);
        setShowPreview(false);
        setIsUploading(false);
        setIsPreviewing(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = [".xlsx", ".xls"];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
            if (!validTypes.includes(fileExtension)) {
                toaster.error("Please select an Excel file (.xlsx or .xls)");
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toaster.error("File size must be less than 10MB");
                return;
            }

            setExcelFile(file);
            setShowPreview(false);
            setPreviewItems([]);
        }
    };

    const handlePreview = async () => {
        if (!excelFile) {
            toaster.error("Please select an Excel file");
            return;
        }

        setIsPreviewing(true);

        try {
            const token = getToken();
            if (!token) {
                toaster.error("Authentication token is missing. Please log in again.");
                return;
            }

            const response = await uploadContractVo(contractDataSetId, excelFile, token);

            if (response && response.contractVoes && Array.isArray(response.contractVoes)) {
                setPreviewItems(response.contractVoes);
                setShowPreview(true);

                if (response.contractVoes.length === 0) {
                    toaster.error(
                        `No VO items found. Please check:\n` +
                            `• Data must start from row 2 with item numbers in Column A\n` +
                            `• File format must match the requirements above`,
                    );
                } else {
                    toaster.success(`Preview loaded: ${response.contractVoes.length} VO items found`);
                }
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (error) {
            console.error("Preview error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toaster.error(`Failed to preview VO items: ${errorMessage}`);
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleImport = () => {
        if (previewItems.length === 0) {
            toaster.error("No items to import");
            return;
        }
        onSuccess(previewItems);
        handleClose();
        toaster.success(`Successfully imported ${previewItems.length} VO items`);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box flex max-h-[90vh] w-full max-w-5xl flex-col">
                {/* Modal Header */}
                <div className="mb-4 flex items-center justify-between border-b border-base-300 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                            <Icon icon={uploadIcon} className="size-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">Import VO BOQ</h3>
                            <p className="text-sm text-base-content/70">Upload Excel file with VO line items</p>
                        </div>
                    </div>
                    <button className="btn btn-sm btn-ghost" onClick={handleClose} disabled={isPreviewing || isUploading}>
                        <Icon icon={xIcon} className="size-4" />
                    </button>
                </div>

                {/* VO Context Information */}
                <div className="mb-4 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon icon={infoIcon} className="size-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-medium text-purple-800 dark:text-purple-200">VO Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                            <span className="text-purple-700 dark:text-purple-300 font-medium">VO Number:</span>
                            <span className="ml-2 text-purple-900 dark:text-purple-100 font-semibold">{voNumber}</span>
                        </div>
                        <div>
                            <span className="text-purple-700 dark:text-purple-300 font-medium">Contract:</span>
                            <span className="ml-2 text-purple-900 dark:text-purple-100">{contractNumber}</span>
                        </div>
                        <div>
                            <span className="text-purple-700 dark:text-purple-300 font-medium">Project:</span>
                            <span className="ml-2 text-purple-900 dark:text-purple-100">{projectName}</span>
                        </div>
                        {tradeName && (
                            <div>
                                <span className="text-purple-700 dark:text-purple-300 font-medium">Trade:</span>
                                <span className="ml-2 text-purple-900 dark:text-purple-100">{tradeName}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {!showPreview ? (
                        /* Upload Form */
                        <div className="space-y-4">
                            {/* File Upload Section */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-base-content">Excel File *</label>
                                <div className="rounded-lg border-2 border-dashed border-base-300 p-4 text-center">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="voExcelFile"
                                        disabled={isPreviewing || isUploading}
                                    />
                                    <label htmlFor="voExcelFile" className="flex cursor-pointer flex-col items-center">
                                        <Icon icon={fileTextIcon} className="mb-2 size-12 text-base-content/50" />
                                        {excelFile ? (
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-base-content">{excelFile.name}</p>
                                                <p className="text-xs text-base-content/70">
                                                    {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-base-content">
                                                    Click to select or drag and drop
                                                </p>
                                                <p className="text-xs text-base-content/70">
                                                    Excel files (.xlsx, .xls) up to 10MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Excel Format Requirements */}
                            <div className="space-y-3">
                                <div className="rounded-lg bg-base-200 p-3">
                                    <h4 className="font-semibold text-base-content">Excel Format Requirements</h4>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-50">
                                    <table className="table table-sm w-full text-xs">
                                        <thead className="bg-base-200">
                                            <tr>
                                                <th className="text-center font-bold">Column A</th>
                                                <th className="text-center font-bold">Column B</th>
                                                <th className="text-center font-bold">Column C</th>
                                                <th className="text-center font-bold">Column D</th>
                                                <th className="text-center font-bold">Column E</th>
                                                <th className="text-center font-bold">Column F</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="text-center">
                                                    <strong>Item No</strong>
                                                </td>
                                                <td className="text-center">
                                                    <strong>Description</strong>
                                                </td>
                                                <td className="text-center">
                                                    <strong>Unit</strong>
                                                </td>
                                                <td className="text-center">
                                                    <strong>Cost Code</strong>
                                                </td>
                                                <td className="text-center">
                                                    <strong>Quantity</strong>
                                                </td>
                                                <td className="text-center">
                                                    <strong>Unit Price</strong>
                                                </td>
                                            </tr>
                                            <tr className="bg-base-100 text-base-content/60">
                                                <td className="text-center">V001</td>
                                                <td className="text-center">Additional concrete works</td>
                                                <td className="text-center">m³</td>
                                                <td className="text-center">CON-001</td>
                                                <td className="text-center">15.5</td>
                                                <td className="text-center">180.00</td>
                                            </tr>
                                            <tr className="bg-base-100 text-base-content/60">
                                                <td className="text-center">V002</td>
                                                <td className="text-center">Extra steel reinforcement</td>
                                                <td className="text-center">kg</td>
                                                <td className="text-center">STL-002</td>
                                                <td className="text-center">850</td>
                                                <td className="text-center">3.20</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="rounded-lg border border-base-300 bg-base-100 p-3">
                                    <h5 className="mb-2 font-medium text-base-content">Key Requirements:</h5>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-base-content/70">
                                        <div>• <strong>Cell A1 must be empty</strong> (indicates header row)</div>
                                        <div>• Data starts from <strong>row 2</strong></div>
                                        <div>• <strong>Cost codes (Column D) are optional</strong></div>
                                        <div>• Use "<strong>-</strong>" for empty quantities/prices</div>
                                        <div className="col-span-2 mt-2 rounded border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-2">
                                            <strong>💡 Tip:</strong> VO item numbers typically start with "V" (e.g., V001, V002) to distinguish from original BOQ items
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Preview Section */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <button
                                    className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300"
                                    onClick={() => setShowPreview(false)}
                                >
                                    Back
                                </button>
                                <span className="font-medium text-base-content">
                                    Preview: {previewItems.length} VO items ready to import
                                </span>
                            </div>

                            {/* Preview Table */}
                            <div className="overflow-x-auto rounded-lg border border-base-300">
                                <table className="table table-sm w-full">
                                    <thead className="bg-base-200">
                                        <tr>
                                            <th className="text-base-content">Item No</th>
                                            <th className="text-base-content">Description</th>
                                            <th className="text-base-content">Unit</th>
                                            <th className="text-base-content">Cost Code</th>
                                            <th className="text-base-content">Quantity</th>
                                            <th className="text-base-content">Unit Price</th>
                                            <th className="text-base-content">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewItems.slice(0, 10).map((item, index) => (
                                            <tr key={index} className="hover:bg-base-100">
                                                <td className="font-mono text-sm text-base-content">
                                                    {item.no || `V${(index + 1).toString().padStart(3, '0')}`}
                                                </td>
                                                <td className="text-base-content">{item.key}</td>
                                                <td className="text-center text-base-content">{item.unite || "-"}</td>
                                                <td className="text-center text-sm text-base-content">
                                                    {item.costCode || "-"}
                                                </td>
                                                <td className="text-right text-base-content">{item.qte.toLocaleString()}</td>
                                                <td className="text-right text-base-content">${item.pu.toLocaleString()}</td>
                                                <td className="text-right font-medium text-base-content">
                                                    ${item.totalPrice.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {previewItems.length > 10 && (
                                <p className="text-center text-sm text-base-content/70">
                                    Showing first 10 items. {previewItems.length - 10} more items will be imported.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-base-300 pt-4">
                    {!showPreview ? (
                        <Button
                            type="button"
                            size="sm"
                            className="btn-info"
                            onClick={handlePreview}
                            disabled={!excelFile || isPreviewing}
                        >
                            {isPreviewing ? (
                                <>
                                    <Loader />
                                    Loading Preview...
                                </>
                            ) : (
                                <>
                                    <Icon icon={fileTextIcon} className="size-4" />
                                    Preview VO Items
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            className="btn-success"
                            onClick={handleImport}
                            disabled={previewItems.length === 0}
                        >
                            <Icon icon={checkCircleIcon} className="size-4" />
                            Import {previewItems.length} Items
                        </Button>
                    )}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose} disabled={isPreviewing || isUploading}>
                    close
                </button>
            </form>
        </dialog>
    );
};

export default VOBOQImportModal;
