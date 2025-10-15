import React, { useEffect, useState } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";
import useBOQUnits from "@/pages/admin/dashboards/subcontractors-BOQs/hooks/use-units";

interface BOQTableProps {
    selectedBuilding: any;
    projectData: any;
    setProjectData: (data: any) => void;
    selectedProject?: any;
    columns: Record<string, string>;
    processBoqData: (data: any) => any;
    selectedTrade: any;
    setSelectedTrade: (trade: any) => void;
}

const BOQTable: React.FC<BOQTableProps> = ({
    selectedBuilding,
    projectData,
    setProjectData,
    selectedProject,
    columns,
    processBoqData,
    selectedTrade,
    setSelectedTrade,
}) => {
    const { getTrades, sheets } = useTrades();
    const { units } = useBOQUnits();
    
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [enhancedSheets, setEnhancedSheets] = useState<any[]>([]);

    const inputFields = [
        { name: 'key', label: 'Item', type: 'text', required: true },
        { name: 'unite', label: 'Unit', type: 'select', required: true, options: units.map(u => u.name) },
        { name: 'qte', label: 'Quantity', type: 'number', required: true },
        { name: 'pu', label: 'Unit Price', type: 'number', required: true }
    ];

    useEffect(() => {
        getTrades();
    }, []);


    useEffect(() => {
        if (sheets && sheets.length > 0) {
            const building = selectedBuilding && projectData?.buildings?.find((b: any) => b.id === selectedBuilding.id);
            
            const enhanced = sheets.map((sheet: any) => {
                // For each master trade sheet, find the corresponding data sheet in the building's data.
                const buildingSheet = building?.boqSheets?.find((s: any) => s.name === sheet.name);
                const hasData = !!(buildingSheet && buildingSheet.boqItems && buildingSheet.boqItems.length > 0);
                
                return {
                    ...sheet,
                    hasData,
                    itemCount: buildingSheet?.boqItems?.length || 0,
                    buildingSheetId: buildingSheet?.id
                };
            });

            setEnhancedSheets(enhanced);

            let newSelectedTrade = null;
            const selectedTradeStillExists = enhanced.some(s => s.id === selectedTrade?.id);

            if (selectedTradeStillExists) {
                // If it still exists, get the updated version from the new enhanced list
                newSelectedTrade = enhanced.find(s => s.id === selectedTrade?.id);
            } else {
                // If not, find the first one with data
                newSelectedTrade = enhanced.find(s => s.hasData) || enhanced[0] || null;
            }
            
            // Only update if the trade object has actually changed to avoid loops
            if (JSON.stringify(newSelectedTrade) !== JSON.stringify(selectedTrade)) {
                setSelectedTrade(newSelectedTrade);
            }
        } else {
            setEnhancedSheets([]);
            setSelectedTrade(null);
        }
    }, [sheets, selectedBuilding, projectData]);

    useEffect(() => {
        if (selectedBuilding && projectData && selectedTrade) {
            const building = projectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
            
            if (building) {
                // First try to find by building sheet ID if available, otherwise by name
                const sheet = (selectedTrade as any).buildingSheetId 
                    ? building.boqSheets?.find((s: any) => s.id === (selectedTrade as any).buildingSheetId)
                    : building.boqSheets?.find((s: any) => s.name === selectedTrade.name);
                
                if (sheet && sheet.boqItems && sheet.boqItems.length > 0) {
                    const processedData = processBoqData(sheet.boqItems);
                    setTableData(processedData);
                } else {
                    setTableData([]);
                }
            } else {
                setTableData([]);
            }
        }
    }, [selectedBuilding, projectData, selectedTrade]);

    const handleSheetSelect = (sheetId: number) => {
        const sheet = enhancedSheets.find((s: any) => s.id === sheetId);
        if (sheet) {
            setSelectedTrade(sheet);
        }
    };

    const handleItemUpdate = (updatedItem: any) => {
        if (!projectData || !selectedBuilding || !selectedTrade) return;

        const updatedProjectData = { ...projectData };
        const building = updatedProjectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
        
        if (building) {
            const sheet = building.boqSheets?.find((s: any) => s.id === (selectedTrade as any).buildingSheetId || s.name === selectedTrade.name);
            if (sheet) {
                const itemIndex = sheet.boqItems.findIndex((item: any) => item.id === updatedItem.id);
                if (itemIndex !== -1) {
                    const qte = parseFloat(updatedItem.qte);
                    const pu = parseFloat(updatedItem.pu);

                    const newItem = { 
                        ...sheet.boqItems[itemIndex], 
                        ...updatedItem,
                        qte: isNaN(qte) ? sheet.boqItems[itemIndex].qte : qte,
                        pu: isNaN(pu) ? sheet.boqItems[itemIndex].pu : pu,
                    };
                    sheet.boqItems[itemIndex] = newItem;
                }
                setProjectData(updatedProjectData);
            }
        }
    };

    const handleItemDelete = (itemToDelete: any) => {
        if (!projectData || !selectedBuilding || !selectedTrade || !itemToDelete) return;

        const updatedProjectData = { ...projectData };
        const building = updatedProjectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
        
        if (building) {
            const sheet = building.boqSheets?.find((s: any) => s.id === (selectedTrade as any).buildingSheetId || s.name === selectedTrade.name);
            if (sheet) {
                sheet.boqItems = sheet.boqItems.filter((item: any) => item.id !== itemToDelete.id);
                setProjectData(updatedProjectData);
            }
        }
    };

    const customHeaderContent = selectedProject ? (
        <div className="flex items-center gap-4">
            <span className="text-sm text-base-content/70">
                {selectedProject.name}
            </span>
            {selectedBuilding && (
                <>
                    <span className="text-base-content/40">•</span>
                    <span className="text-sm font-medium text-base-content">
                        {selectedBuilding.name}
                    </span>
                </>
            )}
        </div>
    ) : null;

    return (
        <div style={{ height: '100%', width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Table */}
            <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    title="Budget BOQ"
                    loading={loading}
                    onSuccess={() => {}}
                    hasSheets={true}
                    sheets={enhancedSheets}
                    activeSheetId={selectedTrade?.id}
                    onSheetSelect={handleSheetSelect}
                    customHeaderContent={customHeaderContent}
                    actions
                    editAction
                    deleteAction
                    rowsPerPage={10000}
                    onItemUpdate={handleItemUpdate}
                    onItemDelete={handleItemDelete}
                    inputFields={inputFields}
                />
            </div>
        </div>
    );
};

export default BOQTable;
