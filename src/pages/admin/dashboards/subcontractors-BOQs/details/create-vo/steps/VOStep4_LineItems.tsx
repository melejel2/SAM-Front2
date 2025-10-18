import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import uploadIcon from "@iconify/icons-lucide/upload";
import trashIcon from "@iconify/icons-lucide/trash";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import infoIcon from "@iconify/icons-lucide/info";
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';
import { getContractBOQItems, copyVoProjectToVoDataSet, getVosBuildings, BuildingsVOs } from '@/api/services/vo-api';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';
import useBOQUnits from '../../../hooks/use-units';

interface VOLineItem {
    id?: number;
    no: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costCode?: string;
    buildingId?: number;
}

export const VOStep4_LineItems: React.FC = () => {
    const { 
        contractData, 
        formData, 
        setFormData
    } = useContractVOWizardContext();
    
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const { units } = useBOQUnits();
    const [availableBOQItems, setAvailableBOQItems] = useState<any[]>([]);
    const [loadingBOQItems, setLoadingBOQItems] = useState(false);
    const [selectedBuildingForItems, setSelectedBuildingForItems] = useState<string>(
        formData.selectedBuildingIds && formData.selectedBuildingIds.length > 0 
            ? formData.selectedBuildingIds[0].toString() 
            : ""
    );
    const [vos, setVos] = useState<BuildingsVOs[]>([]);
    const [filteredVOs, setFilteredVOs] = useState<BuildingsVOs[]>([]);
    const [selectedVO, setSelectedVO] = useState<string>('');
    const [loadingVOs, setLoadingVOs] = useState(false);

    useEffect(() => {
        if (formData.selectedBuildingIds.length > 0 && contractData) {
            loadBOQItemsForBuildings();
        }
    }, [formData.selectedBuildingIds, contractData?.id]);

    useEffect(() => {
        if (contractData?.projectId && getToken()) {
            setLoadingVOs(true);
            getVosBuildings(contractData.projectId, getToken() || '')
                .then(response => {
                    if (response.success && response.data) {
                        setVos(response.data);
                    } else {
                        toaster.error('Failed to load VOs');
                    }
                })
                .catch(error => {
                    console.error('Error loading VOs:', error);
                    toaster.error('Failed to load VOs');
                })
                .finally(() => {
                    setLoadingVOs(false);
                });
        }
    }, [contractData?.projectId]);

    useEffect(() => {
        if (selectedBuildingForItems) {
            const buildingId = parseInt(selectedBuildingForItems);
            const filtered = vos.filter(vo => vo.buildingId === buildingId);
            setFilteredVOs(filtered);
            setSelectedVO(''); // Reset selected VO when building changes
        } else {
            setFilteredVOs([]);
        }
    }, [selectedBuildingForItems, vos]);

    const handleVOSelect = async (selectedVoName: string) => {
        setSelectedVO(selectedVoName);
        if (!selectedVoName) return;

        const vo = filteredVOs.find(v => v.vo === selectedVoName);
        if (!vo) return;

        if (!contractData || !selectedBuildingForItems) {
            toaster.error("Contract data or building not selected.");
            return;
        }

        setLoadingBOQItems(true);
        try {
            const response = await copyVoProjectToVoDataSet(
                parseInt(selectedBuildingForItems),
                vo.voLevel,
                contractData.id,
                getToken() || ''
            );

            if (response && response.contractVoes) {
                handleBOQImport(response.contractVoes);
                toaster.success(`Successfully imported ${response.contractVoes.length} items from ${selectedVoName}`);
            } else {
                const itemsResponse = await getContractBOQItems(
                    contractData.id,
                    parseInt(selectedBuildingForItems),
                    getToken() || ''
                );
                if (itemsResponse.success && itemsResponse.data) {
                    handleBOQImport(itemsResponse.data);
                } else {
                    toaster.error("Failed to fetch imported items after VO import.");
                }
            }
        } catch (error) {
            console.error("Error importing from VO:", error);
            toaster.error((error as any).message || "An error occurred while importing from VO.");
        } finally {
            setLoadingBOQItems(false);
        }
    };

    const loadBOQItemsForBuildings = async () => {
        if (!contractData || !getToken()) return;
        
        setLoadingBOQItems(true);
        try {
            const allBOQItems: any[] = [];
            for (const buildingId of formData.selectedBuildingIds) {
                const response = await getContractBOQItems(contractData.id, buildingId, getToken() || '');
                if (response.success && response.data) {
                    const itemsWithBuilding = response.data.map((item: any) => ({
                        ...item,
                        buildingId,
                        buildingName: contractData.buildings.find(b => b.id === buildingId)?.name || `Building ${buildingId}`
                    }));
                    allBOQItems.push(...itemsWithBuilding);
                }
            }
            setAvailableBOQItems(allBOQItems);
        } catch (error) {
            console.error('Error loading BOQ items:', error);
            toaster.error('Failed to load BOQ items');
        } finally {
            setLoadingBOQItems(false);
        }
    };

        const handleImportClick = async () => {
            if (loadingBOQItems) return;

            if (!contractData) {
                toaster.error("Contract data is not available.");
                return;
            }

            if (!selectedBuildingForItems) {
                toaster.error("Please select a building.");
                return;
            }

            setLoadingBOQItems(true);
            try {
                await copyVoProjectToVoDataSet(
                    parseInt(selectedBuildingForItems),
                    1, // voLevel 1 for main BOQ
                    contractData.id,
                    getToken() || ''
                );
        
                const itemsResponse = await getContractBOQItems(
                    contractData.id,
                    parseInt(selectedBuildingForItems),
                    getToken() || ''
                );
        
                if (itemsResponse.success && itemsResponse.data) {
                    handleBOQImport(itemsResponse.data);
                } else {
                    toaster.error((itemsResponse as any).error || "Failed to fetch imported items after BOQ import.");
                }
            } catch (error) {
                console.error("Error importing from BOQ:", error);
                toaster.error((error as any).message || "An error occurred while importing from BOQ.");
            } finally {
                setLoadingBOQItems(false);
            }
        };

    const formatNumber = (value: number, forceDecimals: boolean = false) => {
        if (value === 0) return '0';
        const hasDecimals = value % 1 !== 0;
        if (forceDecimals || hasDecimals) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
        } else {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
        }
    };

    const createEmptyVOItem = (): VOLineItem => ({ id: 0, no: "", description: "", costCode: "", unit: "", quantity: 0, unitPrice: 0, totalPrice: 0 });

    const addNewVOItem = (initialData: Partial<VOLineItem>, fieldName: string) => {
        const buildingId = selectedBuildingForItems ? parseInt(selectedBuildingForItems) : formData.selectedBuildingIds[0];
        const newItem = { ...createEmptyVOItem(), ...initialData, buildingId };
        const updatedItems = [...formData.lineItems, newItem];
        setFormData({ lineItems: updatedItems });
    };

    const updateVOItem = (itemIndex: number, field: keyof VOLineItem, value: any) => {
        const updatedItems = [...formData.lineItems];
        if (updatedItems[itemIndex]) {
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                updatedItems[itemIndex].totalPrice = (updatedItems[itemIndex].quantity || 0) * (updatedItems[itemIndex].unitPrice || 0);
            }
        }
        setFormData({ lineItems: updatedItems });
    };

    const deleteVOItem = (itemIndex: number) => {
        const updatedItems = formData.lineItems.filter((_, index) => index !== itemIndex);
        setFormData({ lineItems: updatedItems });
    };

    const handleBOQImport = (importedItems: any[]) => {
        if (!importedItems || importedItems.length === 0) {
            toaster.error("No items to import");
            return;
        }
        const newVOItems: VOLineItem[] = importedItems.map((item, index) => ({
            id: Date.now() + index,
            no: `VO-${formData.lineItems.length + index + 1}`,
            description: item.key || item.description || '',
            costCode: item.costCode || '',
            unit: item.unite || item.unit || '',
            quantity: item.qte || item.quantity || 1,
            unitPrice: item.pu || item.unitPrice || 0,
            totalPrice: (item.qte || item.quantity || 1) * (item.pu || item.unitPrice || 0),
            buildingId: item.buildingId
        }));
        const updatedItems = newVOItems; // Overwrite existing items as requested
        setFormData({ lineItems: updatedItems });
        toaster.success(`Successfully imported ${newVOItems.length} items`);
    };

    const selectedBuildings = contractData?.buildings.filter(b => formData.selectedBuildingIds.includes(b.id)) || [];

    if (formData.selectedBuildingIds.length === 0) {
        return (
            <div className="text-center py-8">
                <Icon icon={calculatorIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                <p className="text-base-content/60">Please select buildings first</p>
            </div>
        );
    }

    const items = formData.lineItems || [];
    const displayItems = [...items];
    if (displayItems.length === 0 || displayItems[displayItems.length - 1].no !== '') {
        displayItems.push(createEmptyVOItem());
    }

    const isAddition = formData.voType === 'Addition';
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const netAmount = isAddition ? totalAmount : -totalAmount;

    useEffect(() => {
        setFormData({ totalAdditions: isAddition ? totalAmount : 0, totalDeductions: !isAddition ? totalAmount : 0, totalAmount: netAmount });
    }, [isAddition, totalAmount, netAmount, setFormData]);

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {selectedBuildings.length > 1 && (
                        <select
                            className="select select-bordered w-auto max-w-xs"
                            value={selectedBuildingForItems || ''}
                            onChange={(e) => setSelectedBuildingForItems(e.target.value)}
                        >
                            {selectedBuildings.map(building => (
                                <option key={building.id} value={building.id.toString()}>
                                    {building.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {vos.length > 0 && (
                        <select
                            className="select select-bordered w-auto max-w-xs"
                            value={selectedVO}
                            onChange={(e) => handleVOSelect(e.target.value)}
                            disabled={loadingVOs}
                        >
                            <option value="">Select a VO to import from</option>
                            {filteredVOs.map(vo => (
                                <option key={vo.vo} value={vo.vo}>
                                    {vo.vo}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <button
                    onClick={handleImportClick}
                    className="btn btn-info btn-sm hover:btn-info-focus transition-all duration-200 ease-in-out"
                >
                    <Icon icon={uploadIcon} className="w-4 h-4" />
                    Import Boq
                </button>
            </div>
            <div className="bg-base-100 rounded-xl border border-base-300 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full table-auto bg-base-100">
                        <thead className="bg-base-200">
                            <tr>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Item No.</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Description</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Cost Code</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Quantity</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit Price</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Total Price</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider w-24 sm:w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-300">
                            {displayItems.map((item, index) => {
                                const isEmptyRow = item.no === '' && item.description === '' && (!item.costCode || item.costCode === '') && (!item.unit || item.unit === '') && item.quantity === 0 && item.unitPrice === 0;
                                const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                                return (
                                    <tr key={item.id || index} className="bg-base-100 hover:bg-base-200">
                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                value={item.no}
                                                onChange={(e) => { if (isEmptyRow && e.target.value) { addNewVOItem({ no: e.target.value }, 'no'); } else if (!isEmptyRow) { updateVOItem(index, 'no', e.target.value); }}}
                                                placeholder="Item No."
                                            />
                                        </td>
                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                value={item.description}
                                                onChange={(e) => { if (isEmptyRow && e.target.value) { addNewVOItem({ description: e.target.value }, 'description'); } else if (!isEmptyRow) { updateVOItem(index, 'description', e.target.value); }}}
                                                placeholder="Description"
                                            />
                                        </td>
                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                value={item.costCode || ''}
                                                onChange={(e) => { if (isEmptyRow && e.target.value) { addNewVOItem({ costCode: e.target.value }, 'costCode'); } else if (!isEmptyRow) { updateVOItem(index, 'costCode', e.target.value); }}}
                                                placeholder=""
                                            />
                                        </td>
                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                            <select
                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5 border-0"
                                                value={item.unit || ''}
                                                onChange={(e) => { const selectedUnit = units.find(unit => unit.name === e.target.value); const unitName = selectedUnit?.name || e.target.value; if (isEmptyRow && unitName) { addNewVOItem({ unit: unitName }, 'unit'); } else if (!isEmptyRow) { updateVOItem(index, 'unit', unitName); }}}
                                            >
                                                <option value=""></option>
                                                {units.map(unit => (
                                                    <option key={unit.id} value={unit.name}>
                                                        {unit.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                            <input
                                                type="text"
                                                className={`w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5 ${!item.unit && !isEmptyRow ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                value={isEmptyRow ? '' : (item.quantity ? formatNumber(item.quantity) : '')}
                                                onChange={(e) => { if (!item.unit && !isEmptyRow) return; const cleanValue = e.target.value.replace(/,/g, ''); const value = parseFloat(cleanValue) || 0; if (isEmptyRow && value !== 0) { addNewVOItem({ quantity: value }, 'quantity'); } else if (!isEmptyRow) { updateVOItem(index, 'quantity', value); }}}
                                                placeholder=""
                                                disabled={!item.unit && !isEmptyRow}
                                            />
                                        </td>
                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                            <input
                                                type="text"
                                                className={`w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5 ${!item.unit && !isEmptyRow ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                value={isEmptyRow ? '' : (item.unitPrice ? formatNumber(item.unitPrice) : '')}
                                                onChange={(e) => { if (!item.unit && !isEmptyRow) return; const cleanValue = e.target.value.replace(/,/g, ''); const value = parseFloat(cleanValue) || 0; if (isEmptyRow && value !== 0) { addNewVOItem({ unitPrice: value }, 'unitPrice'); } else if (!isEmptyRow) { updateVOItem(index, 'unitPrice', value); }}}
                                                placeholder=""
                                                disabled={!item.unit && !isEmptyRow}
                                            />
                                        </td>
                                        <td className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-center ${isAddition ? 'text-success' : 'text-error'}`}>
                                            {isEmptyRow || !item.unit ? '-' : formatNumber(itemTotal)}
                                        </td>
                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content w-24 sm:w-28 text-center">
                                            {!isEmptyRow && (
                                                <div className="inline-flex">
                                                    <button
                                                        onClick={() => deleteVOItem(index)}
                                                        className="btn btn-ghost btn-sm text-error/70 hover:bg-error/20"
                                                        title="Delete item"
                                                    >
                                                        <Icon icon={trashIcon} className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length > 0 && (
                                <tr className="bg-base-200 border-t-2 border-base-300 font-bold text-base-content">
                                    <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm" colSpan={6}>TOTAL</td>
                                    <td className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold ${isAddition ? 'text-primary' : 'text-error'}`}>
                                        {formatNumber(totalAmount)}
                                    </td>
                                    <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {items.length === 0 && (
                <div className="text-center py-8 mt-4">
                    <Icon icon={infoIcon} className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
                    <p className="text-base-content/60 text-sm">Start adding line items by typing in any field in the empty row above.</p>
                    <p className="text-base-content/50 text-xs mt-1">Items will be automatically marked as additions or deductions based on the VO type.</p>
                </div>
            )}
        </div>
    );
};