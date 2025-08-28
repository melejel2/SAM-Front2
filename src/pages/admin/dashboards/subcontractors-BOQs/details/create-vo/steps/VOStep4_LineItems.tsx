import React, { useState, useEffect } from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';
import { getContractBOQItems } from '@/api/services/vo-api';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';

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
        addLineItem, 
        updateLineItem, 
        removeLineItem 
    } = useContractVOWizardContext();
    
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [availableBOQItems, setAvailableBOQItems] = useState<any[]>([]);
    const [loadingBOQItems, setLoadingBOQItems] = useState(false);
    const [showBOQTemplate, setShowBOQTemplate] = useState(false);
    const [newItem, setNewItem] = useState<Omit<VOLineItem, 'id' | 'totalPrice'>>({
        no: '',
        description: '',
        unit: 'm²',
        quantity: 1,
        unitPrice: 0,
        costCode: '',
        buildingId: undefined
    });

    // Load BOQ items when buildings are selected
    useEffect(() => {
        if (formData.selectedBuildingIds.length > 0 && contractData) {
            loadBOQItemsForBuildings();
        }
    }, [formData.selectedBuildingIds, contractData]);

    const loadBOQItemsForBuildings = async () => {
        if (!contractData || !getToken()) return;
        
        setLoadingBOQItems(true);
        try {
            const allBOQItems: any[] = [];
            
            // Load BOQ items for all selected buildings
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

    // Get selected buildings for the dropdown
    const selectedBuildings = contractData?.buildings.filter(b => 
        formData.selectedBuildingIds.includes(b.id)
    ) || [];

    const handleAddItem = () => {
        if (!newItem.no.trim() || !newItem.description.trim() || newItem.quantity <= 0) {
            return;
        }
        
        addLineItem(newItem);
        
        // Reset form
        setNewItem({
            no: '',
            description: '',
            unit: 'm²',
            quantity: 1,
            unitPrice: 0,
            costCode: '',
            buildingId: undefined
        });
    };

    const handleEditItem = (index: number) => {
        setEditingIndex(index);
    };

    const handleSaveEdit = (index: number) => {
        setEditingIndex(null);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
    };

    const handleItemChange = (index: number, field: keyof VOLineItem, value: any) => {
        updateLineItem(index, { [field]: value });
    };

    const handleAddFromBOQ = (boqItem: any) => {
        const newVOItem: Omit<VOLineItem, 'id' | 'totalPrice'> = {
            no: `VO-${formData.lineItems.length + 1}`,
            description: boqItem.key || boqItem.description || '',
            unit: boqItem.unite || boqItem.unit || 'm²',
            quantity: 1, // Default quantity for VO
            unitPrice: boqItem.pu || boqItem.unitPrice || 0,
            costCode: boqItem.costCode,
            buildingId: boqItem.buildingId
        };
        
        addLineItem(newVOItem);
        toaster.success(`Added "${newVOItem.description}" to VO line items`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            maximumFractionDigits: 2
        }).format(Math.abs(amount));
    };

    const getBuildingName = (buildingId?: number) => {
        if (!buildingId) return 'All selected buildings';
        return contractData?.buildings.find(b => b.id === buildingId)?.name || `Building ${buildingId}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                            <span className="iconify lucide--list-plus text-green-600 dark:text-green-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">VO Line Items</h3>
                            <p className="text-sm text-base-content/70">
                                Add line items for this variation order ({formData.lineItems.length} items)
                            </p>
                        </div>
                    </div>

                    {/* Add New Item Form */}
                    <div className="bg-base-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-base-content mb-4">Add New Line Item</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Item Number */}
                            <div className="form-control">
                                <label className="label label-text font-medium">Item No.</label>
                                <input
                                    type="text"
                                    className="input input-sm input-bordered bg-base-100"
                                    value={newItem.no}
                                    onChange={(e) => setNewItem({...newItem, no: e.target.value})}
                                    placeholder="e.g., VO-001"
                                />
                            </div>

                            {/* Description */}
                            <div className="form-control lg:col-span-2">
                                <label className="label label-text font-medium">Description</label>
                                <input
                                    type="text"
                                    className="input input-sm input-bordered bg-base-100"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                    placeholder="Description of work"
                                />
                            </div>

                            {/* Unit */}
                            <div className="form-control">
                                <label className="label label-text font-medium">Unit</label>
                                <select
                                    className="select select-sm select-bordered bg-base-100"
                                    value={newItem.unit}
                                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                                >
                                    <option value="m²">m²</option>
                                    <option value="m³">m³</option>
                                    <option value="m">m</option>
                                    <option value="No">No</option>
                                    <option value="L.S">L.S</option>
                                    <option value="kg">kg</option>
                                    <option value="ton">ton</option>
                                </select>
                            </div>

                            {/* Quantity */}
                            <div className="form-control">
                                <label className="label label-text font-medium">Quantity</label>
                                <input
                                    type="number"
                                    className="input input-sm input-bordered bg-base-100"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            {/* Unit Price */}
                            <div className="form-control">
                                <label className="label label-text font-medium">Unit Price</label>
                                <input
                                    type="number"
                                    className="input input-sm input-bordered bg-base-100"
                                    value={newItem.unitPrice}
                                    onChange={(e) => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})}
                                    step="0.01"
                                />
                            </div>

                            {/* Building Assignment */}
                            <div className="form-control">
                                <label className="label label-text font-medium">Building</label>
                                <select
                                    className="select select-sm select-bordered bg-base-100"
                                    value={newItem.buildingId || ''}
                                    onChange={(e) => setNewItem({...newItem, buildingId: e.target.value ? parseInt(e.target.value) : undefined})}
                                >
                                    <option value="">All selected</option>
                                    {selectedBuildings.map(building => (
                                        <option key={building.id} value={building.id}>
                                            {building.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {/* Total Price Display */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-base-content/70">
                                Total: {contractData?.currencySymbol} {formatCurrency(newItem.quantity * newItem.unitPrice)}
                            </div>
                            <button
                                onClick={handleAddItem}
                                disabled={!newItem.no.trim() || !newItem.description.trim() || newItem.quantity <= 0}
                                className="btn btn-sm btn-primary"
                            >
                                <span className="iconify lucide--plus size-4"></span>
                                Add Item
                            </button>
                        </div>
                    </div>

                    {/* BOQ Template Section */}
                    {availableBOQItems.length > 0 && (
                        <div className="bg-base-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-base-content flex items-center gap-2">
                                    <span className="iconify lucide--database text-blue-600 size-4"></span>
                                    BOQ Template Items ({availableBOQItems.length} available)
                                </h4>
                                <button
                                    onClick={() => setShowBOQTemplate(!showBOQTemplate)}
                                    className="btn btn-sm btn-ghost"
                                >
                                    {showBOQTemplate ? (
                                        <>
                                            <span className="iconify lucide--chevron-up size-4"></span>
                                            Hide Templates
                                        </>
                                    ) : (
                                        <>
                                            <span className="iconify lucide--chevron-down size-4"></span>
                                            Show Templates
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {showBOQTemplate && (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    <div className="text-sm text-base-content/60 mb-2">
                                        Click on any BOQ item to add it as a VO line item:
                                    </div>
                                    {loadingBOQItems ? (
                                        <div className="text-center py-4">
                                            <div className="loading loading-spinner loading-sm"></div>
                                            <p className="text-sm text-base-content/60 mt-2">Loading BOQ items...</p>
                                        </div>
                                    ) : (
                                        availableBOQItems.map((boqItem, index) => (
                                            <div
                                                key={`${boqItem.buildingId}-${index}`}
                                                onClick={() => handleAddFromBOQ(boqItem)}
                                                className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:bg-primary hover:text-primary-content cursor-pointer transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {boqItem.key || boqItem.description || 'Unnamed Item'}
                                                    </div>
                                                    <div className="text-xs opacity-70">
                                                        {boqItem.buildingName} • {boqItem.unite || boqItem.unit || 'Unit'} • {contractData?.currencySymbol} {formatCurrency(boqItem.pu || boqItem.unitPrice || 0)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="iconify lucide--plus size-4 opacity-60"></span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Line Items Table */}
                    {formData.lineItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table table-sm">
                                <thead>
                                    <tr className="border-base-300">
                                        <th className="w-20">Item No.</th>
                                        <th>Description</th>
                                        <th className="w-20">Unit</th>
                                        <th className="w-24">Quantity</th>
                                        <th className="w-24">Unit Price</th>
                                        <th className="w-24">Total</th>
                                        <th className="w-32">Building</th>
                                        <th className="w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.lineItems.map((item, index) => (
                                        <tr key={item.id || index} className="border-base-300">
                                            {editingIndex === index ? (
                                                // Edit mode
                                                <>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="input input-xs input-bordered w-full"
                                                            value={item.no}
                                                            onChange={(e) => handleItemChange(index, 'no', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="input input-xs input-bordered w-full"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="select select-xs select-bordered w-full"
                                                            value={item.unit}
                                                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                        >
                                                            <option value="m²">m²</option>
                                                            <option value="m³">m³</option>
                                                            <option value="m">m</option>
                                                            <option value="No">No</option>
                                                            <option value="L.S">L.S</option>
                                                            <option value="kg">kg</option>
                                                            <option value="ton">ton</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-xs input-bordered w-full"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="input input-xs input-bordered w-full"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="font-medium">
                                                        {contractData?.currencySymbol} {formatCurrency(item.totalPrice)}
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="select select-xs select-bordered w-full"
                                                            value={item.buildingId || ''}
                                                            onChange={(e) => handleItemChange(index, 'buildingId', e.target.value ? parseInt(e.target.value) : undefined)}
                                                        >
                                                            <option value="">All</option>
                                                            {selectedBuildings.map(building => (
                                                                <option key={building.id} value={building.id}>
                                                                    {building.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleSaveEdit(index)}
                                                                className="btn btn-xs btn-success"
                                                                title="Save"
                                                            >
                                                                <span className="iconify lucide--check size-3"></span>
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="btn btn-xs btn-ghost"
                                                                title="Cancel"
                                                            >
                                                                <span className="iconify lucide--x size-3"></span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                // View mode
                                                <>
                                                    <td className="font-medium">{item.no}</td>
                                                    <td>{item.description}</td>
                                                    <td>{item.unit}</td>
                                                    <td>{item.quantity.toLocaleString()}</td>
                                                    <td>{contractData?.currencySymbol} {formatCurrency(item.unitPrice)}</td>
                                                    <td className={`font-medium ${
                                                        item.totalPrice >= 0 ? 'text-success' : 'text-error'
                                                    }`}>
                                                        {item.totalPrice >= 0 ? '+' : '-'}{contractData?.currencySymbol} {formatCurrency(item.totalPrice)}
                                                    </td>
                                                    <td className="text-xs text-base-content/70">
                                                        {getBuildingName(item.buildingId)}
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleEditItem(index)}
                                                                className="btn btn-xs btn-ghost"
                                                                title="Edit"
                                                            >
                                                                <span className="iconify lucide--edit size-3"></span>
                                                            </button>
                                                            <button
                                                                onClick={() => removeLineItem(index)}
                                                                className="btn btn-xs btn-ghost text-error hover:bg-error hover:text-error-content"
                                                                title="Delete"
                                                            >
                                                                <span className="iconify lucide--trash-2 size-3"></span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <span className="iconify lucide--list-plus size-16 text-base-content/20 mb-4"></span>
                            <p className="text-base-content/70 text-lg mb-2">No Line Items Added</p>
                            <p className="text-base-content/50 text-sm">Add line items using the form above to define the work for this VO.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Summary */}
            {formData.lineItems.length > 0 && (
                <div className="card bg-base-100 shadow-sm border border-base-300">
                    <div className="card-body">
                        <h4 className="font-medium text-base-content mb-4 flex items-center gap-2">
                            <span className="iconify lucide--calculator text-green-600 size-4"></span>
                            Financial Summary
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
                                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Total Additions</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    +{contractData?.currencySymbol} {formatCurrency(formData.totalAdditions)}
                                </p>
                            </div>
                            
                            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
                                <p className="text-sm text-red-700 dark:text-red-400 font-medium">Total Deductions</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    -{contractData?.currencySymbol} {formatCurrency(formData.totalDeductions)}
                                </p>
                            </div>
                            
                            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
                                <p className="text-sm text-primary font-medium">Net Amount</p>
                                <p className={`text-2xl font-bold ${
                                    formData.totalAmount >= 0 ? 'text-success' : 'text-error'
                                }`}>
                                    {formData.totalAmount >= 0 ? '+' : '-'}{contractData?.currencySymbol} {formatCurrency(formData.totalAmount)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};