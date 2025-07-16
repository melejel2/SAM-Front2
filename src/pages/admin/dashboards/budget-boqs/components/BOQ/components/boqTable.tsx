import { useEffect, useState } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";

import useBudgetBOQsDialog from "../../use-budget-boq-dialog";

interface BOQTableProps {
    selectedBuilding: any;
    projectData: any;
    setProjectData: (data: any) => void;
}

const BOQTable: React.FC<BOQTableProps> = ({ 
    selectedBuilding, 
    projectData, 
    setProjectData 
}) => {
    const { getTrades, sheets } = useTrades();
    const { 
        columns, 
        formatCurrency, 
        processBoqData,
        selectedTrade,
        setSelectedTrade
    } = useBudgetBOQsDialog();
    
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getTrades();
    }, []);

    useEffect(() => {
        if (selectedBuilding && projectData && selectedTrade) {
            const building = projectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
            if (building) {
                const sheet = building.boqSheets?.find((s: any) => s.id === selectedTrade.id);
                if (sheet && sheet.boqItems && sheet.boqItems.length > 0) {
                    const processedData = processBoqData(sheet.boqItems);
                    setTableData(processedData);
                } else {
                    setTableData([]);
                }
            } else {
                setTableData([]);
            }
        } else {
            setTableData([]);
        }
    }, [selectedBuilding, projectData, selectedTrade]);

    const handleSheetSelect = (sheetId: number) => {
        const sheet = sheets.find((s: any) => s.id === sheetId);
        setSelectedTrade(sheet);
    };

    const handleItemUpdate = (updatedItem: any) => {
        if (!projectData || !selectedBuilding || !selectedTrade) return;

        const updatedProjectData = { ...projectData };
        const building = updatedProjectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
        
        if (building) {
            const sheet = building.boqSheets?.find((s: any) => s.id === selectedTrade.id);
            if (sheet) {
                const itemIndex = sheet.boqItems.findIndex((item: any) => item.id === updatedItem.id);
                if (itemIndex !== -1) {
                    sheet.boqItems[itemIndex] = updatedItem;
                } else {
                    sheet.boqItems.push(updatedItem);
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

    return (
        <div className="h-full">
            <SAMTable
                columns={columns}
                tableData={tableData}
                title={selectedBuilding ? `${selectedBuilding.name} - Budget BOQ` : "Budget BOQ"}
                loading={loading}
                onSuccess={() => {}}
                hasSheets={true}
                sheets={sheets}
                actions
                editAction
                deleteAction
                rowsPerPage={6}
            />
        </div>
    );
};

export default BOQTable;
