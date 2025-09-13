import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import useVoBOQ from "../../use-vo-boq";
import { 
    ContractVoesVM, 
    VoItemsModel,
    BOQType 
} from "@/types/variation-order";

interface VOLineItemsHookProps {
    buildingId?: number;
    voLevel?: number;
}

const useVOLineItems = ({ buildingId, voLevel = 1 }: VOLineItemsHookProps = {}) => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    
    const { getVos, saveVo } = useVoBOQ();
    const { toaster } = useToast();

    // VO Line Items columns matching desktop ContractVo structure
    const columns = {
        order: "Order",
        no: "No",
        key: "Key", 
        unite: "Unit",
        costCode: "Cost Code",
        qte: "Quantity",
        pu: "Unit Price",
        pt: "Total Price",
        remark: "Remark",
        level: "Level"
    };

    // Load VO items from backend
    const loadVoItems = useCallback(async () => {
        if (!buildingId) return;
        
        setLoading(true);
        try {
            const voData = await getVos(buildingId, voLevel);
            
            // Transform backend VoVM data to table format
            const transformedData = voData.flatMap((vo, index) => 
                vo.voSheets?.flatMap(sheet => 
                    sheet.voItems?.map(item => ({
                        id: item.id || `temp-${index}-${Math.random()}`,
                        order: item.orderVo?.toString() || '',
                        no: item.no || '',
                        key: item.key || '',
                        unite: item.unite || '',
                        costCode: typeof item.costCode === 'string' ? item.costCode : '',
                        qte: item.qte?.toString() || '0',
                        pu: item.pu?.toString() || '0',
                        pt: calculatePt(item.qte || 0, item.pu || 0).toString(),
                        remark: (item as any).remark || '',
                        level: item.level || voLevel,
                        boqtype: (item as any).boqtype || BOQType.Item,
                        // Keep original item data for saving
                        originalItem: item
                    }))
                ) || []
            ) || [];

            setTableData(transformedData);
        } catch (error) {
            console.error('Error loading VO items:', error);
            toaster.error('Failed to load VO items');
            setTableData([]);
        } finally {
            setLoading(false);
        }
    }, [buildingId, voLevel, getVos, toaster]);

    // Calculate PT (Price Total) = Quantity × Unit Price
    const calculatePt = (quantity: number, unitPrice: number): number => {
        const qte = isNaN(quantity) ? 0 : quantity;
        const pu = isNaN(unitPrice) ? 0 : unitPrice;
        return qte * pu;
    };

    // Calculate total amount for all items
    const calculateTotal = (): number => {
        return tableData.reduce((sum, item) => {
            if (item.isTotal) return sum; // Skip total row
            const pt = parseFloat(item.pt.toString().replace(/,/g, ''));
            return sum + (isNaN(pt) ? 0 : pt);
        }, 0);
    };

    // Format currency display
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Add new VO line item
    const addVoItem = () => {
        const newItem = {
            id: `new-${Date.now()}`,
            order: (tableData.length + 1).toString(),
            no: '',
            key: '',
            unite: '',
            costCode: '',
            qte: '0',
            pu: '0',
            pt: '0.00',
            remark: '',
            level: voLevel,
            boqtype: BOQType.Item,
            isNew: true
        };
        setTableData(prev => [...prev, newItem]);
    };

    // Remove VO line item
    const removeVoItem = (itemId: string) => {
        setTableData(prev => prev.filter(item => item.id !== itemId));
    };

    // Update VO line item
    const updateVoItem = (itemId: string, field: string, value: any) => {
        setTableData(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                
                // Auto-calculate PT when quantity or unit price changes
                if (field === 'qte' || field === 'pu') {
                    const qte = parseFloat(field === 'qte' ? value : item.qte) || 0;
                    const pu = parseFloat(field === 'pu' ? value : item.pu) || 0;
                    updatedItem.pt = formatCurrency(calculatePt(qte, pu));
                }
                
                return updatedItem;
            }
            return item;
        }));
    };

    // Save VO items to backend
    const saveVoItems = useCallback(async (): Promise<boolean> => {
        if (!buildingId) return false;
        
        setLoading(true);
        try {
            // Transform table data back to VoVM format
            const voItems: VoItemsModel[] = tableData
                .filter(item => !item.isTotal)
                .map(item => ({
                    id: item.isNew ? 0 : (item.originalItem?.id || 0),
                    no: item.no,
                    key: item.key,
                    unite: item.unite,
                    qte: parseFloat(item.qte) || 0,
                    pu: parseFloat(item.pu) || 0,
                    costCode: item.costCode,
                    costCodeId: item.originalItem?.costCodeId || null,
                    level: typeof item.level === 'number' ? item.level : parseInt(item.level) || voLevel,
                    orderVo: parseFloat(item.order) || 0
                }));

            // Construct VoVM array
            const voData = [{
                buildingId: buildingId,
                voLevel: voLevel,
                voSheets: [{
                    id: 0,
                    sheetName: `VO Level ${voLevel}`,
                    voItems: voItems
                }]
            }];

            const result = await saveVo(voData);
            
            if (result.isSuccess) {
                toaster.success('VO items saved successfully');
                await loadVoItems(); // Refresh data
                return true;
            } else {
                toaster.error('Failed to save VO items');
                return false;
            }
        } catch (error) {
            console.error('Error saving VO items:', error);
            toaster.error('Failed to save VO items');
            return false;
        } finally {
            setLoading(false);
        }
    }, [buildingId, voLevel, tableData, saveVo, toaster, loadVoItems]);

    // Clear all VO items
    const clearVoItems = useCallback(async (): Promise<boolean> => {
        setTableData([]);
        return true;
    }, []);

    // Import VO items from Excel
    const importVoFromExcel = useCallback(async (file: File): Promise<boolean> => {
        // This would integrate with the uploadVo function from useVoBOQ
        // Implementation depends on the Excel upload workflow
        console.log('Import from Excel:', file.name);
        toaster.info('Excel import functionality to be implemented');
        return false;
    }, [toaster]);

    return {
        // Data
        columns,
        tableData,
        loading,

        // Calculations
        calculateTotal,
        formatCurrency,
        calculatePt,

        // CRUD Operations
        loadVoItems,
        addVoItem,
        removeVoItem,
        updateVoItem,
        saveVoItems,
        clearVoItems,
        importVoFromExcel,

        // State setters
        setTableData,
        setLoading
    };
};

export default useVOLineItems;