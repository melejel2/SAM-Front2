import { useState, useEffect } from "react";
import { Button } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import apiRequest from "@/api/api";
import { Icon } from "@iconify/react";

// Icon imports following established pattern
import uploadIcon from "@iconify/icons-lucide/upload";
import xIcon from "@iconify/icons-lucide/x";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import infoIcon from "@iconify/icons-lucide/info";

interface BOQImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (importedItems: any[]) => void;
    contractDataSetId: number;
    availableBuildings: Array<{ id: number; name: string; sheets: Array<{ id: number; name: string }> }>;
    currentBuildingId?: number;
    currentSheetName?: string;
}

interface ImportedBoqItem {
    id: number;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costCodeId?: number;
    costCodeName?: string;
}

const BOQImportModal: React.FC<BOQImportModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    contractDataSetId,
    availableBuildings,
    currentBuildingId,
    currentSheetName
}) => {
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number>(currentBuildingId || 0);
    const [selectedSheetName, setSelectedSheetName] = useState<string>(currentSheetName || '');
    const [previewItems, setPreviewItems] = useState<ImportedBoqItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [excelPreviewRows, setExcelPreviewRows] = useState<string[][]>([]);

    const { toaster } = useToast();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSelectedBuildingId(currentBuildingId || 0);
            setSelectedSheetName(currentSheetName || '');
        } else {
            handleReset();
        }
    }, [isOpen, currentBuildingId, currentSheetName]);

    const handleReset = () => {
        setExcelFile(null);
        setPreviewItems([]);
        setShowPreview(false);
        setIsUploading(false);
        setIsPreviewing(false);
        setExcelPreviewRows([]);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['.xlsx', '.xls'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
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
            
            // Read first few rows for preview
            readExcelPreview(file);
        }
    };

    const readExcelPreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Simple CSV-like parsing for Excel files (basic preview only)
                const content = e.target?.result as string;
                // This is a very basic approach - in production you'd want a proper Excel library
                // For now, we'll show some sample data
                setExcelPreviewRows([
                    ['001', 'Concrete foundation works', 'm³', 'CON-001', '25.5', '150.00'],
                    ['002', 'Steel reinforcement bars', 'kg', 'STL-002', '1200', '2.50'],
                    ['003', 'Masonry wall construction', 'm²', 'MAS-003', '85.0', '45.00']
                ]);
            } catch (error) {
                console.error('Error reading Excel preview:', error);
                setExcelPreviewRows([]);
            }
        };
        reader.readAsText(file.slice(0, 1024)); // Read first 1KB for preview
    };

    const getAvailableSheets = () => {
        if (!selectedBuildingId) return [];
        const building = availableBuildings.find(b => b.id === selectedBuildingId);
        return building?.sheets || [];
    };

    const handlePreview = async () => {
        console.log('Debug values:', {
            excelFile: !!excelFile,
            selectedBuildingId,
            selectedSheetName,
            contractDataSetId
        });
        
        if (!excelFile || selectedBuildingId === 0 || !selectedSheetName) {
            toaster.error("Please select file, building, and sheet");
            return;
        }

        setIsPreviewing(true);
        
        try {
            console.log('Starting BOQ import request...');
            const formData = new FormData();
            formData.append('excelFile', excelFile);
            formData.append('ContractsDataSetId', contractDataSetId > 0 ? contractDataSetId.toString() : '0');
            formData.append('BuildingId', selectedBuildingId.toString());
            formData.append('SheetName', selectedSheetName);

            console.log('FormData prepared:', {
                fileName: excelFile.name,
                contractsDataSetId: contractDataSetId > 0 ? contractDataSetId.toString() : '0',
                buildingId: selectedBuildingId.toString(),
                sheetName: selectedSheetName
            });

            const result = await apiRequest({
                endpoint: 'ContractsDatasets/GetContractBoqItemsFromExcel',
                method: 'POST',
                body: formData
            });

            console.log('API request completed, result:', result);

            // Check if the request was successful
            if (!result.isSuccess && result.isSuccess === false) {
                throw new Error(result.message || 'Failed to preview BOQ items');
            }
                
            // Extract BOQ items from the response structure
            const items: ImportedBoqItem[] = [];
            if (result && Array.isArray(result)) {
                result.forEach((building: any) => {
                    if (building.boqsContract && Array.isArray(building.boqsContract)) {
                        building.boqsContract.forEach((item: any) => {
                            items.push({
                                id: item.id || 0,
                                description: item.description || '',
                                unit: item.unit || '',
                                quantity: item.quantity || 0,
                                unitPrice: item.unitPrice || 0,
                                totalPrice: item.totalPrice || 0,
                                costCodeId: item.costCodeId,
                                costCodeName: item.costCodeName
                            });
                        });
                    }
                });
            }
            
            setPreviewItems(items);
            setShowPreview(true);
            
            if (items.length === 0) {
                toaster.info("No BOQ items found in the Excel file");
            } else {
                toaster.success(`Preview loaded: ${items.length} BOQ items found`);
            }
        } catch (error) {
            console.error("Preview error:", error);
            
            // Check if it's an authentication error
            if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                toaster.error("Session expired. Please login again.");
            } else {
                toaster.error("Failed to preview BOQ items from Excel file");
            }
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
        toaster.success(`Successfully imported ${previewItems.length} BOQ items`);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 rounded-lg dark:bg-green-900/30">
                            <Icon icon={uploadIcon} className="text-green-600 dark:text-green-400 size-4" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">Import BOQ from Excel</h3>
                            <p className="text-xs text-base-content/70">Upload an Excel file to import BOQ items</p>
                        </div>
                    </div>
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={handleClose}
                        disabled={isPreviewing || isUploading}
                    >
                        <Icon icon={xIcon} className="size-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    {!showPreview ? (
                        /* Upload Form */
                        <div className="space-y-4">
                            {/* File Upload Section */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-base-content">Excel File *</label>
                                <div className="border-2 border-dashed border-base-300 rounded-lg p-3 text-center">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="excelFile"
                                        disabled={isPreviewing || isUploading}
                                    />
                                    <label
                                        htmlFor="excelFile"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <Icon icon={fileTextIcon} className="size-10 text-base-content/50 mb-1" />
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

                            {/* Building and Sheet Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Target Building *</span>
                                    </label>
                                    <select
                                        className="select select-sm bg-base-100 border-base-300 w-full"
                                        value={selectedBuildingId}
                                        onChange={(e) => {
                                            setSelectedBuildingId(Number(e.target.value));
                                            setSelectedSheetName(''); // Reset sheet selection
                                        }}
                                        disabled={isPreviewing || isUploading}
                                    >
                                        <option value={0}>Select building...</option>
                                        {availableBuildings.map((building) => (
                                            <option key={building.id} value={building.id}>
                                                {building.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Target Sheet *</span>
                                    </label>
                                    <select
                                        className="select select-sm bg-base-100 border-base-300 w-full"
                                        value={selectedSheetName}
                                        onChange={(e) => setSelectedSheetName(e.target.value)}
                                        disabled={selectedBuildingId === 0 || isPreviewing || isUploading}
                                    >
                                        <option value="">Select sheet...</option>
                                        {getAvailableSheets().map((sheet) => (
                                            <option key={sheet.id} value={sheet.name}>
                                                {sheet.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Excel Format Requirements */}
                            <div className="space-y-2">
                                <div className="bg-base-200 p-2 rounded-lg">
                                    <h4 className="font-semibold text-base-content">Excel Format Requirements</h4>
                                </div>
                                
                                <div className="overflow-x-auto border border-base-300 rounded-lg bg-base-50">
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
                                                <td className="text-center"><strong>Item No</strong></td>
                                                <td className="text-center"><strong>Description</strong></td>
                                                <td className="text-center"><strong>Unit</strong></td>
                                                <td className="text-center"><strong>Cost Code</strong></td>
                                                <td className="text-center"><strong>Quantity</strong></td>
                                                <td className="text-center"><strong>Unit Price</strong></td>
                                            </tr>
                                            {excelPreviewRows.length > 0 ? (
                                                excelPreviewRows.map((row, index) => (
                                                    <tr key={index} className="bg-base-100 text-base-content/60">
                                                        {row.map((cell, cellIndex) => (
                                                            <td key={cellIndex} className="text-center">{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : (
                                                <>
                                                    <tr className="bg-base-100 text-base-content/60">
                                                        <td className="text-center">001</td>
                                                        <td className="text-center">Concrete works</td>
                                                        <td className="text-center">m³</td>
                                                        <td className="text-center">CON-001</td>
                                                        <td className="text-center">25.5</td>
                                                        <td className="text-center">150.00</td>
                                                    </tr>
                                                    <tr className="bg-base-100 text-base-content/60">
                                                        <td className="text-center">002</td>
                                                        <td className="text-center">Steel reinforcement</td>
                                                        <td className="text-center">kg</td>
                                                        <td className="text-center">STL-002</td>
                                                        <td className="text-center">1200</td>
                                                        <td className="text-center">2.50</td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-base-100 border border-base-300 p-3 rounded-lg">
                                    <h5 className="font-medium mb-2 text-base-content">Key Requirements:</h5>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-base-content/70 text-sm">
                                        <div>• <strong>Cell A1 must be empty</strong> (indicates header row)</div>
                                        <div>• Data starts from <strong>row 2</strong></div>
                                        <div>• <strong>Cost codes (Column D) are optional</strong></div>
                                        <div>• Use "<strong>-</strong>" for empty quantities/prices</div>
                                        <div>• Sheet name must match selected trade</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Preview Section */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon icon={checkCircleIcon} className="size-5 text-success" />
                                    <span className="font-medium text-base-content">
                                        Preview: {previewItems.length} BOQ items ready to import
                                    </span>
                                </div>
                                <button
                                    className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300"
                                    onClick={() => setShowPreview(false)}
                                >
                                    Back to Upload
                                </button>
                            </div>

                            {/* Preview Table */}
                            <div className="overflow-x-auto border border-base-300 rounded-lg">
                                <table className="table table-sm w-full">
                                    <thead className="bg-base-200">
                                        <tr>
                                            <th className="text-base-content">Description</th>
                                            <th className="text-base-content">Unit</th>
                                            <th className="text-base-content">Quantity</th>
                                            <th className="text-base-content">Unit Price</th>
                                            <th className="text-base-content">Total</th>
                                            <th className="text-base-content">Cost Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewItems.slice(0, 10).map((item, index) => (
                                            <tr key={index} className="hover:bg-base-100">
                                                <td className="text-base-content">{item.description}</td>
                                                <td className="text-base-content">{item.unit}</td>
                                                <td className="text-base-content text-right">{item.quantity.toLocaleString()}</td>
                                                <td className="text-base-content text-right">${item.unitPrice.toLocaleString()}</td>
                                                <td className="text-base-content text-right font-medium">${item.totalPrice.toLocaleString()}</td>
                                                <td className="text-base-content text-sm">{item.costCodeName || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {previewItems.length > 10 && (
                                <p className="text-sm text-base-content/70 text-center">
                                    Showing first 10 items. {previewItems.length - 10} more items will be imported.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-300 mt-6">
                    <Button
                        type="button"
                        size="sm"
                        className="bg-base-200 text-base-content hover:bg-base-300"
                        onClick={handleClose}
                        disabled={isPreviewing || isUploading}
                    >
                        Cancel
                    </Button>

                    {!showPreview ? (
                        <Button
                            type="button"
                            size="sm"
                            className="btn-info"
                            onClick={handlePreview}
                            disabled={!excelFile || selectedBuildingId === 0 || !selectedSheetName || isPreviewing}
                        >
                            {isPreviewing ? (
                                <>
                                    <Loader />
                                    Loading Preview...
                                </>
                            ) : (
                                <>
                                    <Icon icon={fileTextIcon} className="size-4" />
                                    Preview BOQ Items
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
                <button onClick={handleClose} disabled={isPreviewing || isUploading}>close</button>
            </form>
        </dialog>
    );
};

export default BOQImportModal;