import { useEffect } from "react";

import { Button, Select, SelectOption } from "@/components/daisyui";
import useCurrencies from "@/pages/admin/adminTools/currencies/use-currencies";

import BOQTable from "./components/boqTable";

interface SubcontractorBOQStepProps {
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    buildings: any[];
}

const SubcontractorBOQStep: React.FC<SubcontractorBOQStepProps> = ({ dialogType, buildings }) => {
    const { tableData, getCurrencies } = useCurrencies();

    useEffect(() => {
        getCurrencies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-2">
                <div className="flex space-x-2">
                    <label className="floating-label">
                        <span>Trade</span>
                        <input type="text" placeholder="Trade" className="input input-sm" value="Trade Name" disabled />
                    </label>
                    <label className="floating-label">
                        <span>Sub Trade</span>

                        <input
                            type="text"
                            placeholder="Sub Trade"
                            className="input input-sm"
                            value="Sub Trade Name"
                            disabled
                        />
                    </label>
                    <label className="floating-label">
                        <span>Currency</span>
                        <Select
                            className="input input-sm"
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
                <div className="flex items-center space-x-2">
                    <label className="floating-label">
                        <span>Building</span>
                        <Select
                            className="input input-sm"
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

                    <Button type="button" size="sm">
                        Clear BOQ
                    </Button>
                    <Button type="button" size="sm">
                        Import BOQ
                    </Button>
                    <Button type="button" size="sm">
                        Remarks
                    </Button>
                    <Button type="button" size="sm">
                        Attachments
                    </Button>
                </div>
            </div>
            <div className="h-[92%] p-2">
                <BOQTable />
            </div>
        </div>
    );
};

export default SubcontractorBOQStep;
