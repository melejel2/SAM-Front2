import { useEffect } from "react";

import { Button, Select, SelectOption } from "@/components/daisyui";
import useCurrencies from "@/pages/admin/adminTools/currencies/use-currencies";

import BOQTable from "./components/boqTable";

interface SubcontractorBOQStepProps {
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    buildings: any[];
    onBoqItemsChange?: (items: any[]) => void;
}

const SubcontractorBOQStep: React.FC<SubcontractorBOQStepProps> = ({ dialogType, buildings, onBoqItemsChange }) => {
    const { tableData, getCurrencies } = useCurrencies();

    useEffect(() => {
        getCurrencies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div className="flex h-full flex-col bg-base-100">
            <div className="flex items-center justify-between p-4 bg-base-100 border-b border-base-300">
                <div className="flex space-x-3">
                    <label className="floating-label">
                        <span>Trade</span>
                        <input type="text" placeholder="Trade" className="input input-sm bg-base-100 border-base-300" value="Trade Name" disabled />
                    </label>
                    <label className="floating-label">
                        <span>Sub Trade</span>
                        <input
                            type="text"
                            placeholder="Sub Trade"
                            className="input input-sm bg-base-100 border-base-300"
                            value="Sub Trade Name"
                            disabled
                        />
                    </label>
                    <label className="floating-label">
                        <span>Currency</span>
                        <Select
                            className="input input-sm bg-base-100 border-base-300"
                            name="currency"
                            onTouchStart={(e) => {
                                if (e.touches.length > 1) {
                                    e.preventDefault();
                                }
                            }}>
                            <>
                                {(tableData ?? []).map((currency) => (
                                    <SelectOption key={currency.id} value={currency.id} className="bg-base-100">
                                        {currency.currencies}
                                    </SelectOption>
                                ))}
                            </>
                        </Select>
                    </label>
                </div>
                <div className="flex items-center space-x-3">
                    <label className="floating-label">
                        <span>Building</span>
                        <Select
                            className="input input-sm bg-base-100 border-base-300 w-40"
                            name="building"
                            onTouchStart={(e) => {
                                if (e.touches.length > 1) {
                                    e.preventDefault();
                                }
                            }}>
                            <>
                                {(buildings ?? []).map((building) => (
                                    <SelectOption key={building.id} value={building.id} className="bg-base-100">
                                        {building.name}
                                    </SelectOption>
                                ))}
                            </>
                        </Select>
                    </label>

                    <Button type="button" size="sm" className="bg-primary text-primary-content hover:bg-primary/90 border-primary">
                        Import BOQ
                    </Button>
                    
                    <Button type="button" size="sm" className="bg-base-100 border-base-300 text-base-content hover:bg-base-200">
                        Clear BOQ
                    </Button>
                    <Button type="button" size="sm" className="bg-base-100 border-base-300 text-base-content hover:bg-base-200">
                        Remarks
                    </Button>
                    <Button type="button" size="sm" className="bg-base-100 border-base-300 text-base-content hover:bg-base-200">
                        Attachments
                    </Button>
                </div>
            </div>
            <div className="flex-1 p-4 bg-base-100">
                <BOQTable onBoqItemsChange={onBoqItemsChange} />
            </div>
        </div>
    );
};

export default SubcontractorBOQStep;
