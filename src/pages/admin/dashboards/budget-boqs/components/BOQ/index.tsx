import { Button, Select, SelectOption } from "@/components/daisyui";

import BOQTable from "./components/boqTable";

interface BOQStepProps {
    dialogType: "Add" | "Edit" | "Delete" | "Preview" | "Select";
    buildings: any[];
}

const BOQStep: React.FC<BOQStepProps> = ({ dialogType, buildings }) => {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-2">
                <Button type="button" size="sm">
                    Clear BOQ
                </Button>
                <div className="flex items-center space-x-2">
                    <Select
                        className="w-full border-none bg-transparent focus:ring-0 focus:outline-none"
                        onChange={(e) => {
                            // setFormData({ ...formData, [name]: e.target.value });
                        }}
                        name="building"
                        onTouchStart={(e) => {
                            if (e.touches.length > 1) {
                                e.preventDefault();
                            }
                        }}>
                        <>
                            {dialogType === "Add" && (
                                <SelectOption value="" disabled hidden>
                                    Select Building
                                </SelectOption>
                            )}

                            {(buildings ?? []).map((building) => (
                                <SelectOption key={building.id} value={building.id} className="bg-base-100">
                                    {building.name}
                                </SelectOption>
                            ))}
                        </>
                    </Select>
                    <Button type="button" size="sm">
                        Create buildings
                    </Button>
                    <Button type="button" size="sm">
                        Import BOQ
                    </Button>
                </div>
            </div>
            <div className="h-[92%] p-2">
                <BOQTable />
            </div>
        </div>
    );
};

export default BOQStep;
