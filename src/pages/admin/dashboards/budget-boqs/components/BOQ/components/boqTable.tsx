import { useEffect, useState } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";
import useBOQUnits from "@/pages/admin/dashboards/subcontractors-BOQs/hooks/use-units";

import useBudgetBOQsDialog from "../../use-budget-boq-dialog";

interface BOQTableProps {
    selectedBuilding: any;
    projectData: any;
    setProjectData: (data: any) => void;
    buildings?: any[];
    selectedProject?: any;
    onBuildingChange?: (building: any) => void;
}

const BOQTable: React.FC<BOQTableProps> = ({
    selectedBuilding,
    projectData,
    setProjectData,
    buildings,
    selectedProject,
    onBuildingChange
}) => {
    const { getTrades, sheets } = useTrades();
    const {
        columns,
        processBoqData,
        selectedTrade,
        setSelectedTrade
    } = useBudgetBOQsDialog();
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

    // Create enhanced sheets with data indicators and auto-select first sheet with data
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
            
            // Auto-select a sheet.
            const isSelectedTradeStillValid = enhanced.some(s => s.id === selectedTrade?.id);
            if (!isSelectedTradeStillValid) {
                const firstSheetWithData = enhanced.find(s => s.hasData);
                setSelectedTrade(firstSheetWithData || enhanced[0] || null);
            }
        } else {
            setEnhancedSheets([]);
            setSelectedTrade(null);
        }
    }, [sheets, selectedBuilding, projectData, selectedTrade]);

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

    const handleItemDelete = (itemId: number) => {
        if (!projectData || !selectedBuilding || !selectedTrade) return;

        const updatedProjectData = { ...projectData };
        const building = updatedProjectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
        
        if (building) {
            const sheet = building.boqSheets?.find((s: any) => s.id === selectedTrade.id);
            if (sheet) {
                sheet.boqItems = sheet.boqItems.filter((item: any) => item.id !== itemId);
                setProjectData(updatedProjectData);
            }
        }
    };

    const customHeaderContent = (
        <div className="flex items-center gap-4">
            {selectedProject && (
                <span className="text-sm text-base-content/70">
                    {selectedProject.name}
                </span>
            )}
            {buildings && onBuildingChange && (
                <select
                    className="select select-sm bg-base-100 border-base-300 text-base-content min-w-48"
                    onChange={(e) => {
                        const building = buildings.find(b => b.id === parseInt(e.target.value));
                        if (building) {
                            onBuildingChange(building);
                        }
                    }}
                    value={selectedBuilding?.id || ""}
                >
                    <option value="" disabled hidden>
                        {buildings.length === 0 ? "No buildings found" : "Select Building"}
                    </option>
                    {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                            {building.name}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );

    return (
        <div>
            {/* Table */}
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
                rowsPerPage={15}
                onItemUpdate={handleItemUpdate}
                inputFields={inputFields}
            />
        </div>
    );
};

export default BOQTable;
