import { useState } from "react";
import { Button } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import { VOLevelType } from "@/types/variation-order";

interface VOItemsViewProps {
    items: any[];
    level: VOLevelType;
    loading?: boolean;
    mode?: 'view' | 'edit';
    onItemEdit?: (item: any) => void;
    onItemDelete?: (item: any) => void;
}

const VOItemsView: React.FC<VOItemsViewProps> = ({
    items,
    level,
    loading = false,
    mode = 'view',
    onItemEdit,
    onItemDelete
}) => {

    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [sortField, setSortField] = useState<string>('orderVo');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Define columns based on the current level
    const getColumns = () => {
        const baseColumns: any[] = [
            {
                key: 'orderVo',
                label: 'Order',
                sortable: true,
                render: (value: number) => (
                    <div className="font-mono text-sm">
                        {value?.toString().padStart(3, '0') || '-'}
                    </div>
                )
            },
            {
                key: 'no',
                label: 'Item No',
                sortable: true,
                render: (value: string) => (
                    <div className="font-medium text-base-content">
                        {value || '-'}
                    </div>
                )
            },
            {
                key: 'key',
                label: 'Description',
                sortable: true,
                render: (value: string) => (
                    <div className="max-w-64 truncate" title={value || ''}>
                        {value || '-'}
                    </div>
                )
            },
            {
                key: 'unite',
                label: 'Unit',
                sortable: true,
                render: (value: string) => (
                    <div className="text-center">
                        {value || '-'}
                    </div>
                )
            },
            {
                key: 'qte',
                label: 'Quantity',
                sortable: true,
                render: (value: number) => (
                    <div className="text-right font-mono">
                        {value?.toLocaleString() || '0'}
                    </div>
                )
            },
            {
                key: 'pu',
                label: 'Unit Price',
                sortable: true,
                render: (value: number) => (
                    <div className="text-right font-mono">
                        ${value?.toLocaleString() || '0'}
                    </div>
                )
            },
            {
                key: 'totalPrice',
                label: 'Total',
                sortable: true,
                render: (value: number) => (
                    <div className="text-right font-mono font-semibold text-primary">
                        ${value?.toLocaleString() || '0'}
                    </div>
                )
            },
            {
                key: 'costCode',
                label: 'Cost Code',
                sortable: true,
                render: (value: string) => (
                    <div className="font-mono text-sm">
                        {value || '-'}
                    </div>
                )
            }
        ];

        // Add level-specific columns
        if (level === 'Project') {
            // Show building information at project level
            baseColumns.splice(1, 0, {
                key: 'buildingName',
                label: 'Building',
                sortable: true,
                render: (value: string) => (
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--home size-4 text-base-content/70"></span>
                        <span className="font-medium">{value || '-'}</span>
                    </div>
                )
            });
        }

        if (level === 'Building' || level === 'Project') {
            // Show sheet information at building and project levels
            baseColumns.splice(level === 'Project' ? 2 : 1, 0, {
                key: 'sheetName',
                label: 'Sheet',
                sortable: true,
                render: (value: string) => (
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--file-text size-4 text-base-content/70"></span>
                        <span className="text-sm">{value || '-'}</span>
                    </div>
                )
            });
        }

        // Add actions column if in edit mode
        if (mode === 'edit') {
            baseColumns.push({
                key: 'actions',
                label: 'Actions',
                sortable: false,
                render: (_: any, item: any) => (
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => onItemEdit?.(item)}
                        >
                            <span className="iconify lucide--edit size-3"></span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => onItemDelete?.(item)}
                        >
                            <span className="iconify lucide--trash-2 size-3"></span>
                        </Button>
                    </div>
                )
            });
        }

        return baseColumns;
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle different data types
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal?.toLowerCase() || '';
        }
        if (typeof aVal === 'number') {
            aVal = aVal || 0;
            bVal = bVal || 0;
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const calculateTotals = () => {
        return {
            items: items.length,
            quantity: items.reduce((sum, item) => sum + (item.qte || 0), 0),
            totalPrice: items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
        };
    };

    const totals = calculateTotals();

    const handleSelectItem = (itemId: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(item => item.id)));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                    <Loader />
                    <span className="text-base-content/70">Loading VO items...</span>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-base-200 rounded-lg">
                <div className="p-4 bg-base-300 rounded-full mb-4">
                    <span className="iconify lucide--package-x text-base-content/50 size-8"></span>
                </div>
                <h4 className="text-lg font-semibold text-base-content mb-2">No VO Items Found</h4>
                <p className="text-sm text-base-content/70 text-center max-w-md">
                    No variation order items are available at the {level.toLowerCase()} level. 
                    {level !== 'Project' && ' Try navigating to a different level or check your selection.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Items Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-base-200 rounded-lg">
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totals.items}</div>
                    <div className="text-sm text-base-content/70">Items</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totals.quantity.toLocaleString()}</div>
                    <div className="text-sm text-base-content/70">Total Quantity</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary">${totals.totalPrice.toLocaleString()}</div>
                    <div className="text-sm text-base-content/70">Total Value</div>
                </div>
            </div>

            {/* Bulk Actions (Edit Mode) */}
            {mode === 'edit' && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary checkbox-sm"
                                checked={selectedItems.size === items.length && items.length > 0}
                                onChange={handleSelectAll}
                            />
                            <span className="text-sm font-medium">
                                {selectedItems.size > 0 
                                    ? `${selectedItems.size} of ${items.length} selected`
                                    : 'Select all items'
                                }
                            </span>
                        </label>
                    </div>
                    
                    {selectedItems.size > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => {
                                    // Handle bulk delete
                                }}
                            >
                                <span className="iconify lucide--trash-2 size-4"></span>
                                Delete Selected
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Items Table */}
            <div className="bg-base-100 rounded-lg border border-base-300 overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            {mode === 'edit' && (
                                <th className="w-10">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={selectedItems.size === sortedItems.length && sortedItems.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedItems(new Set(sortedItems.map(item => item.id)));
                                            } else {
                                                setSelectedItems(new Set());
                                            }
                                        }}
                                    />
                                </th>
                            )}
                            {getColumns().map((column: any) => (
                                <th
                                    key={column.key}
                                    className={column.sortable ? 'cursor-pointer hover:bg-base-200' : ''}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {column.label}
                                        {column.sortable && sortField === column.key && (
                                            <span className={`iconify lucide--chevron-${sortDirection === 'asc' ? 'up' : 'down'} size-3`}></span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-base-200">
                                {mode === 'edit' && (
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => handleSelectItem(item.id)}
                                        />
                                    </td>
                                )}
                                {getColumns().map((column: any) => (
                                    <td key={column.key}>
                                        {column.render ? 
                                            (column.key === 'actions' ? 
                                                column.render(item[column.key], item) : 
                                                column.render(item[column.key])) 
                                            : item[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {sortedItems.length === 0 && (
                            <tr>
                                <td colSpan={getColumns().length + (mode === 'edit' ? 1 : 0)} className="text-center py-8">
                                    <div className="text-base-content/50">No items to display</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Level Information */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                    <span className="iconify lucide--info text-purple-600 dark:text-purple-400 size-5 mt-0.5"></span>
                    <div>
                        <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                            {level} Level View
                        </h5>
                        <div className="text-xs text-purple-700 dark:text-purple-300">
                            {level === 'Project' && "Showing all VO items across all buildings in the project"}
                            {level === 'Building' && "Showing VO items for the selected building only"}
                            {level === 'Sheet' && "Showing VO items for the selected BOQ sheet only"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VOItemsView;