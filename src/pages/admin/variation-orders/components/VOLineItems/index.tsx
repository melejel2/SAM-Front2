import { useEffect, useMemo } from "react";

import { Button, Select, SelectOption } from "@/components/daisyui";
import useCurrencies from "@/pages/admin/adminTools/currencies/use-currencies";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";

import VOLineItemsTable from "./components/voLineItemsTable";

interface VOLineItemsStepProps {
    buildingId?: number;
    voLevel?: number;
    buildings?: any[];
    onVoItemsChange?: (items: any[]) => void;
    readonly?: boolean;
    showControls?: boolean;
}

const VOLineItemsStep: React.FC<VOLineItemsStepProps> = ({
    buildingId,
    voLevel = 1,
    buildings = [],
    onVoItemsChange,
    readonly = false,
    showControls = true
}) => {
    const { tableData: currencies, getCurrencies } = useCurrencies();
    const { getTrades, sheets } = useTrades();

    useEffect(() => {
        getCurrencies();
        getTrades();
    }, [getCurrencies, getTrades]);

    // Memoize currency options to prevent recreation on every render
    const currencyOptions = useMemo(() =>
        (currencies ?? []).map((currency) => ({
            id: currency.id,
            label: currency.currencies
        })),
        [currencies]
    );

    // Memoize trade options to prevent recreation on every render
    const tradeOptions = useMemo(() =>
        sheets.map((sheet) => ({
            id: sheet.id,
            label: sheet.trade
        })),
        [sheets]
    );

    // Memoize building options to prevent recreation on every render
    const buildingOptions = useMemo(() =>
        buildings.map((building) => ({
            id: building.id,
            label: building.name
        })),
        [buildings]
    );

    return (
        <div className="flex h-full flex-col bg-base-100">
            {showControls && (
                <div className="flex items-center justify-between p-4 bg-base-100 border-b border-base-300">
                    <div className="flex space-x-3">
                        <label className="floating-label">
                            <span>VO Level</span>
                            <input 
                                type="text" 
                                placeholder="VO Level" 
                                className="input input-sm bg-base-100 border-base-300" 
                                value={`Level ${voLevel}`} 
                                disabled 
                            />
                        </label>
                        <label className="floating-label">
                            <span>Trade</span>
                            <Select
                                className="input input-sm bg-base-100 border-base-300"
                                name="trade"
                                disabled={readonly}
                                onTouchStart={(e) => {
                                    if (e.touches.length > 1) {
                                        e.preventDefault();
                                    }
                                }}>
                                <>
                                    {tradeOptions.map((option) => (
                                        <SelectOption key={option.id} value={option.id} className="bg-base-100">
                                            {option.label}
                                        </SelectOption>
                                    ))}
                                </>
                            </Select>
                        </label>
                        <label className="floating-label">
                            <span>Sub Trade</span>
                            <input
                                type="text"
                                placeholder="Sub Trade"
                                className="input input-sm bg-base-100 border-base-300"
                                defaultValue=""
                                disabled={readonly}
                            />
                        </label>
                        <label className="floating-label">
                            <span>Currency</span>
                            <Select
                                className="input input-sm bg-base-100 border-base-300"
                                name="currency"
                                disabled={readonly}
                                onTouchStart={(e) => {
                                    if (e.touches.length > 1) {
                                        e.preventDefault();
                                    }
                                }}>
                                <>
                                    {currencyOptions.map((option) => (
                                        <SelectOption key={option.id} value={option.id} className="bg-base-100">
                                            {option.label}
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
                                value={buildingId}
                                disabled={readonly}
                                onTouchStart={(e) => {
                                    if (e.touches.length > 1) {
                                        e.preventDefault();
                                    }
                                }}>
                                <>
                                    {buildingOptions.map((option) => (
                                        <SelectOption key={option.id} value={option.id} className="bg-base-100">
                                            {option.label}
                                        </SelectOption>
                                    ))}
                                </>
                            </Select>
                        </label>

                        {!readonly && (
                            <>
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    className="bg-primary text-primary-content hover:bg-primary/90 border-primary"
                                >
                                    <span className="iconify lucide--upload size-4"></span>
                                    Import Excel
                                </Button>
                                
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                                >
                                    <span className="iconify lucide--copy size-4"></span>
                                    From Budget BOQ
                                </Button>
                                
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    className="bg-base-100 border-base-300 text-base-content hover:bg-base-200"
                                >
                                    <span className="iconify lucide--trash-2 size-4"></span>
                                    Clear VO
                                </Button>
                                
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    className="bg-base-100 border-base-300 text-base-content hover:bg-base-200"
                                >
                                    <span className="iconify lucide--message-square size-4"></span>
                                    Remarks
                                </Button>
                                
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    className="bg-base-100 border-base-300 text-base-content hover:bg-base-200"
                                >
                                    <span className="iconify lucide--paperclip size-4"></span>
                                    Attachments
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
            <div className="flex-1 p-4 bg-base-100">
                <VOLineItemsTable 
                    buildingId={buildingId}
                    voLevel={voLevel}
                    onVoItemsChange={onVoItemsChange}
                    readonly={readonly}
                />
            </div>
        </div>
    );
};

export default VOLineItemsStep;