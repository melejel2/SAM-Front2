import checkIcon from "@iconify/icons-lucide/check";
import editIcon from "@iconify/icons-lucide/edit";
import trashIcon from "@iconify/icons-lucide/trash";
import uploadIcon from "@iconify/icons-lucide/upload";
import xIcon from "@iconify/icons-lucide/x";
import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";

import { BudgetVO, BudgetVOItem, BudgetVOSheet } from "@/api/services/budget-vo-api";
import { saveBudgetVo, uploadBudgetVo } from "@/api/services/budget-vo-api";
import { Button, Input } from "@/components/daisyui";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/helpers/utils/cn";
import useToast from "@/hooks/use-toast";
import { UnsavedChangesDialog } from "@/pages/admin/dashboards/subcontractors-BOQs/shared/components/UnsavedChangesDialog";

interface VOTableProps {
    vo: BudgetVO;
    onClose: () => void;
    onSave: () => void; // To refresh data in VODialog
    buildingName: string;
    tradeName?: string;
    projectId: number;
    buildingId: number;
    sheetId?: number;
    projectLevel: number;
}

const VOTable: React.FC<VOTableProps> = (props) => {
    const { vo, onClose, onSave, buildingName, tradeName } = props;
    const { projectId, buildingId, sheetId, projectLevel } = props;
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [loading, setLoading] = useState(false);
    const [editedVO, setEditedVO] = useState<BudgetVO>(JSON.parse(JSON.stringify(vo)));
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [originalVO, setOriginalVO] = useState<BudgetVO | null>(null);
    const [activeSheetId, setActiveSheetId] = useState<number | null>(editedVO.voSheets[0]?.id || null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

    useEffect(() => {
        setOriginalVO(JSON.parse(JSON.stringify(vo)));
    }, [vo]);

    useEffect(() => {
        if (originalVO && JSON.stringify(editedVO) !== JSON.stringify(originalVO)) {
            setHasUnsavedChanges(true);
        } else {
            setHasUnsavedChanges(false);
        }
    }, [editedVO, originalVO]);

    const handleItemChange = (sheetIndex: number, itemIndex: number, field: keyof BudgetVOItem, value: any) => {
        const newVO = { ...editedVO };
        const item = newVO.voSheets[sheetIndex].voItems[itemIndex];
        (item[field] as any) = value;
        setEditedVO(newVO);
    };

    const handleItemDelete = (sheetIndex: number, itemIndex: number) => {
        const newVO = { ...editedVO };
        newVO.voSheets[sheetIndex].voItems.splice(itemIndex, 1);
        setEditedVO(newVO);
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            toaster.error("Authentication token not found.");
            setLoading(false);
            return;
        }

        const payload: BudgetVO = {
            ...editedVO,
            voSheets: [],
        };

        let changesDetected = false;
        editedVO.voSheets.forEach((editedSheet) => {
            const originalSheet = originalVO?.voSheets.find((s) => s.id === editedSheet.id);
            if (!originalSheet || JSON.stringify(editedSheet.voItems) !== JSON.stringify(originalSheet.voItems)) {
                payload.voSheets.push(editedSheet);
                changesDetected = true;
            }
        });

        if (!changesDetected) {
            toaster.info("No changes to save.");
            setLoading(false);
            onClose();
            return;
        }

        try {
            const result = await saveBudgetVo(payload, token);
            if (result.isSuccess) {
                toaster.success("Changes saved successfully!");
                onSave();
                onClose();
            } else {
                toaster.error(result.error?.message || "Failed to save changes.");
            }
        } catch (error) {
            toaster.error("An error occurred while saving changes.");
        } finally {
            setLoading(false);
        }
    };

    const handleDirectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const token = getToken();
        const currentProjectId = projectId;
        const currentBuildingId = buildingId;
        const currentSheetId = sheetId;

        if (!token || !currentSheetId) {
            toaster.error("Please select a trade/sheet first");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const uploadRequest = {
                projectId: currentProjectId,
                buildingId: currentBuildingId,
                sheetId: currentSheetId,
                voLevel: vo.voLevel,
                isFromBudgetBoq: false,
                excelFile: file,
            };

            const result = await uploadBudgetVo(uploadRequest, token);

            if (result.isSuccess) {
                toaster.success("VO uploaded successfully");
                onSave(); // Refresh the VO page in parent
            } else {
                toaster.error(result.error?.message || "Failed to upload VO");
            }
        } catch (error) {
            console.error("Error uploading VO:", error);
            toaster.error("Failed to upload VO");
        } finally {
            setLoading(false);
            // Reset file input
            if (event.target) {
                event.target.value = "";
            }
        }
    };

    const formatCurrency = (amount: number) => {
        if (!amount || isNaN(amount) || amount === 0) return "-";
        const hasDecimals = amount % 1 !== 0;
        return new Intl.NumberFormat("en-US", {
            style: "decimal",
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatQuantity = (quantity: number) => {
        if (!quantity || isNaN(quantity) || quantity === 0) return "-";

        const hasDecimals = quantity % 1 !== 0;

        return new Intl.NumberFormat("en-US", {
            style: "decimal",
            minimumFractionDigits: hasDecimals ? 1 : 0,
            maximumFractionDigits: hasDecimals ? 3 : 0,
        }).format(quantity);
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedChangesDialog(true);
        } else {
            onClose();
        }
    };

    const activeSheet = editedVO.voSheets.find((s) => s.id === activeSheetId);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-base-100 mx-4 flex max-h-[90vh] w-full max-w-7xl flex-col rounded-lg p-6 shadow-xl">
                <div className="mb-4 flex flex-shrink-0 items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Edit VO Level {vo.voLevel}</h3>
                        <p className="text-base-content/70 text-sm">{buildingName}</p>
                    </div>
                    <button onClick={handleClose} className="btn btn-sm btn-ghost">
                        <Icon icon={xIcon} className="h-4 w-4" />
                    </button>
                </div>
                <div className="mb-4 flex items-center gap-2">
                    <Button size="sm" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                        <Icon icon={uploadIcon} className="mr-1 h-4 w-4" />
                        Upload VO
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleDirectFileUpload}
                        accept=".xlsx,.xls"
                        style={{ display: "none" }}
                    />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {activeSheet ? (
                        <div key={activeSheet.id} className="mb-6">
                            <div className="overflow-x-auto">
                                <table className="table-xs table">
                                    <thead>
                                        <tr>
                                            <th className="w-12">No</th>
                                            <th>Description</th>
                                            <th className="w-20">Unit</th>
                                            <th className="w-24">Qty</th>
                                            <th className="w-28">Unit Price</th>
                                            <th className="w-28">Total</th>
                                            <th className="w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeSheet.voItems.map((item, itemIndex) => {
                                            const total = (item.qte || 0) * (item.pu || 0);
                                            const isEditing = editingItemId === item.id;
                                            return (
                                                <tr key={item.id}>
                                                    <td>{item.no}</td>
                                                    <td>
                                                        {isEditing ? (
                                                            <Input
                                                                className="input-xs w-full"
                                                                value={item.key || ""}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        editedVO.voSheets.findIndex(
                                                                            (s) => s.id === activeSheetId,
                                                                        ),
                                                                        itemIndex,
                                                                        "key",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            item.key
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isEditing ? (
                                                            <Input
                                                                className="input-xs w-full"
                                                                value={item.unite || ""}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        editedVO.voSheets.findIndex(
                                                                            (s) => s.id === activeSheetId,
                                                                        ),
                                                                        itemIndex,
                                                                        "unite",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            item.unite
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isEditing ? (
                                                            <Input
                                                                type="number"
                                                                className="input-xs w-full"
                                                                value={item.qte || 0}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        editedVO.voSheets.findIndex(
                                                                            (s) => s.id === activeSheetId,
                                                                        ),
                                                                        itemIndex,
                                                                        "qte",
                                                                        parseFloat(e.target.value),
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            formatQuantity(item.qte)
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isEditing ? (
                                                            <Input
                                                                type="number"
                                                                className="input-xs w-full"
                                                                value={item.pu || 0}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        editedVO.voSheets.findIndex(
                                                                            (s) => s.id === activeSheetId,
                                                                        ),
                                                                        itemIndex,
                                                                        "pu",
                                                                        parseFloat(e.target.value),
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            formatCurrency(item.pu)
                                                        )}
                                                    </td>
                                                    <td>{formatCurrency(total)}</td>
                                                    <td>
                                                        <div className="flex items-center gap-1">
                                                            {isEditing ? (
                                                                <>
                                                                    <Button
                                                                        size="xs"
                                                                        color="ghost"
                                                                        onClick={() => setEditingItemId(null)}>
                                                                        <Icon
                                                                            icon={checkIcon}
                                                                            className="text-success h-4 w-4"
                                                                        />
                                                                    </Button>
                                                                    <Button
                                                                        size="xs"
                                                                        color="ghost"
                                                                        onClick={() => {
                                                                            setEditingItemId(null);
                                                                            if (originalVO) {
                                                                                setEditedVO(originalVO);
                                                                                setOriginalVO(null);
                                                                            }
                                                                        }}>
                                                                        <Icon
                                                                            icon={xIcon}
                                                                            className="text-error h-4 w-4"
                                                                        />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        size="xs"
                                                                        color="ghost"
                                                                        onClick={() => {
                                                                            setEditingItemId(item.id);
                                                                        }}>
                                                                        <Icon icon={editIcon} className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="xs"
                                                                        color="ghost"
                                                                        className="text-error"
                                                                        onClick={() =>
                                                                            handleItemDelete(
                                                                                editedVO.voSheets.findIndex(
                                                                                    (s) => s.id === activeSheetId,
                                                                                ),
                                                                                itemIndex,
                                                                            )
                                                                        }>
                                                                        <Icon icon={trashIcon} className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-error font-semibold">No sheet selected or data is missing.</p>
                        </div>
                    )}
                </div>
                <div className="bg-base-100 border-base-300 flex w-full flex-shrink-0 overflow-x-auto border-t">
                    {editedVO.voSheets.map((sheet) => (
                        <span
                            key={sheet.id}
                            className={cn(
                                "relative min-w-max cursor-pointer border-b-2 px-3 py-2 text-center text-sm transition-all duration-200",
                                sheet.id === activeSheetId
                                    ? sheet.voItems.length > 0
                                        ? "text-primary border-primary bg-primary/5"
                                        : "text-base-content border-base-content/20 bg-base-200"
                                    : sheet.voItems.length > 0
                                      ? "text-base-content hover:text-primary hover:border-primary/30 border-transparent"
                                      : "text-base-content/50 hover:text-base-content/70 border-transparent",
                            )}
                            onClick={() => {
                                setActiveSheetId(sheet.id);
                            }}>
                            {sheet.sheetName}
                            {sheet.voItems.length > 0 && (
                                <span className="ml-1 text-xs opacity-60">({sheet.voItems.length})</span>
                            )}
                        </span>
                    ))}
                </div>
                <div className="mt-4 flex flex-shrink-0 justify-end gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button className="btn-primary" onClick={handleSaveChanges} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                        {!loading && <Icon icon={checkIcon} className="ml-2 h-4 w-4" />}
                    </Button>
                </div>

                {/* Unsaved Changes Dialog */}
                <UnsavedChangesDialog
                    isOpen={showUnsavedChangesDialog}
                    onConfirm={() => {
                        setShowUnsavedChangesDialog(false);
                        onClose();
                    }}
                    onCancel={() => setShowUnsavedChangesDialog(false)}
                />
            </div>
        </div>
    );
};

export default VOTable;
