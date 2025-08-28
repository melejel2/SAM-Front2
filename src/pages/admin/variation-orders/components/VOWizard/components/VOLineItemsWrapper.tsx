import { useState, useEffect } from "react";
import VOLineItemsStep from "../../VOLineItems";

interface VOLineItemsWrapperProps {
    items: any[];
    onItemsChange: (items: any[], totalAmount: number) => void;
    mode: 'view' | 'edit';
    currency: string;
    showControls: boolean;
}

const VOLineItemsWrapper: React.FC<VOLineItemsWrapperProps> = ({
    items,
    onItemsChange,
    mode,
    currency,
    showControls
}) => {
    const [voItems, setVoItems] = useState<any[]>(items || []);

    // Calculate total amount when items change
    const calculateTotal = (items: any[]) => {
        return items.reduce((sum, item) => {
            const quantity = Number(item.qte) || 0;
            const unitPrice = Number(item.pu) || 0;
            return sum + (quantity * unitPrice);
        }, 0);
    };

    // Handle items change from the VOLineItems component
    const handleVoItemsChange = (updatedItems: any[]) => {
        setVoItems(updatedItems);
        const totalAmount = calculateTotal(updatedItems);
        onItemsChange(updatedItems, totalAmount);
    };

    // Update internal state when props change
    useEffect(() => {
        setVoItems(items || []);
    }, [items]);

    return (
        <div className="w-full">
            <VOLineItemsStep
                buildingId={1} // TODO: Get from context
                voLevel={1}
                buildings={[]} // TODO: Pass selected buildings
                onVoItemsChange={handleVoItemsChange}
                readonly={mode === 'view'}
                showControls={showControls}
            />
        </div>
    );
};

export default VOLineItemsWrapper;