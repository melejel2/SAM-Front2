import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { VoDatasetBoqDetailsVM } from "@/types/variation-order";

interface VOPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    voData: VoDatasetBoqDetailsVM | null;
}

const VOPreviewModal = ({ isOpen, onClose, voData }: VOPreviewModalProps) => {
    const [activeTab, setActiveTab] = useState(0);
    const [expandedBuilding, setExpandedBuilding] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && voData) {
            setActiveTab(0);
            setExpandedBuilding(null);
        }
    }, [isOpen, voData]);

    if (!isOpen || !voData) return null;

    const calculateBuildingTotal = (building: any) => {
        return building.contractVoes?.reduce((total: number, vo: any) => {
            return total + (vo.totalPrice || 0);
        }, 0) || 0;
    };

    const calculateGrandTotal = () => {
        return voData.buildings?.reduce((total: number, building: any) => {
            return total + calculateBuildingTotal(building);
        }, 0) || 0;
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                            <span className="iconify lucide--file-text text-green-600 dark:text-green-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Variation Order Details</h3>
                            <p className="text-sm text-base-content/70">{voData.voNumber} • {voData.contractNumber}</p>
                        </div>
                    </div>
                    <button 
                        className="btn btn-sm btn-circle btn-ghost" 
                        onClick={onClose}
                    >
                        <span className="iconify lucide--x size-4"></span>
                    </button>
                </div>

                {/* VO Summary Card */}
                <div className="card bg-base-200/50 border border-base-300 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-base-content/70">Project</p>
                            <p className="font-semibold">{voData.projectName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Subcontractor</p>
                            <p className="font-semibold">{voData.subcontractorName || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Date</p>
                            <p className="font-semibold">{formatDate(voData.date, 'short')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Status</p>
                            <div className="badge badge-sm badge-primary">{voData.status}</div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <p className="text-sm text-base-content/70">Trade</p>
                            <p className="font-semibold">{voData.tradeName || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Sub Trade</p>
                            <p className="font-semibold">{voData.subTrade || '-'}</p>
                        </div>
                    </div>

                    {voData.remark && (
                        <div className="mt-4">
                            <p className="text-sm text-base-content/70">Remark</p>
                            <p className="font-medium">{voData.remark}</p>
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-base-300">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Total Amount:</span>
                            <span className="text-xl font-bold text-primary">{formatCurrency(calculateGrandTotal(), { decimals: 'never' })}</span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tabs tabs-lifted mb-4">
                    <button 
                        className={`tab tab-lg ${activeTab === 0 ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab(0)}
                    >
                        <span className="iconify lucide--building size-4 mr-2"></span>
                        Buildings & Items ({voData.buildings?.length || 0})
                    </button>
                    <button 
                        className={`tab tab-lg ${activeTab === 1 ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab(1)}
                    >
                        <span className="iconify lucide--file-text size-4 mr-2"></span>
                        Summary
                    </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
                    {activeTab === 0 && (
                        <div className="space-y-4">
                            {voData.buildings?.map((building) => (
                                <div key={building.id} className="card bg-base-100 border border-base-300">
                                    <div 
                                        className="card-header p-4 bg-base-200/50 cursor-pointer flex items-center justify-between"
                                        onClick={() => setExpandedBuilding(expandedBuilding === building.id ? null : building.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`iconify lucide--chevron-${expandedBuilding === building.id ? 'down' : 'right'} size-4`}></span>
                                            <span className="iconify lucide--building size-5 text-primary"></span>
                                            <div>
                                                <h4 className="font-semibold">{building.buildingName}</h4>
                                                <p className="text-sm text-base-content/70">{building.contractVoes?.length || 0} items</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">{formatCurrency(calculateBuildingTotal(building), { decimals: 'never' })}</p>
                                        </div>
                                    </div>
                                    
                                    {expandedBuilding === building.id && building.contractVoes && (
                                        <div className="card-body p-0">
                                            <div className="overflow-x-auto">
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr className="bg-base-200">
                                                            <th>No.</th>
                                                            <th>Key</th>
                                                            <th>Description</th>
                                                            <th>Unit</th>
                                                            <th>Qty</th>
                                                            <th>Unit Price</th>
                                                            <th>Total Price</th>
                                                            <th>Cost Code</th>
                                                            <th>Sheet</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {building.contractVoes.map((vo, index) => (
                                                            <tr key={`${building.id}-${index}`} className="hover">
                                                                <td>{vo.no || '-'}</td>
                                                                <td>{vo.key || '-'}</td>
                                                                <td className="font-medium">{vo.key || '-'}</td>
                                                                <td>{vo.unite || '-'}</td>
                                                                <td className="text-right">{vo.qte?.toFixed(2) || '0.00'}</td>
                                                                <td className="text-right">{formatCurrency(vo.pu, { decimals: 'never' })}</td>
                                                                <td className="text-right font-semibold text-primary">{formatCurrency(vo.totalPrice, { decimals: 'never' })}</td>
                                                                <td>{vo.costCode || '-'}</td>
                                                                <td>{vo.sheetName || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 1 && (
                        <div className="space-y-6">
                            {/* Summary Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="stat bg-base-200 rounded-lg">
                                    <div className="stat-figure text-primary">
                                        <span className="iconify lucide--building size-8"></span>
                                    </div>
                                    <div className="stat-title">Buildings</div>
                                    <div className="stat-value text-primary">{voData.buildings?.length || 0}</div>
                                </div>
                                
                                <div className="stat bg-base-200 rounded-lg">
                                    <div className="stat-figure text-secondary">
                                        <span className="iconify lucide--list size-8"></span>
                                    </div>
                                    <div className="stat-title">Total Items</div>
                                    <div className="stat-value text-secondary">
                                        {voData.buildings?.reduce((total, building) => total + (building.contractVoes?.length || 0), 0) || 0}
                                    </div>
                                </div>
                                
                                <div className="stat bg-base-200 rounded-lg">
                                    <div className="stat-figure text-success">
                                        <span className="iconify lucide--dollar-sign size-8"></span>
                                    </div>
                                    <div className="stat-title">Total Value</div>
                                    <div className="stat-value text-success">{formatCurrency(calculateGrandTotal(), { decimals: 'never' })}</div>
                                </div>
                            </div>

                            {/* Building Summary */}
                            <div className="card bg-base-100 border border-base-300">
                                <div className="card-header p-4 bg-base-200/50">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <span className="iconify lucide--bar-chart size-5"></span>
                                        Building Breakdown
                                    </h4>
                                </div>
                                <div className="card-body p-4">
                                    <div className="overflow-x-auto">
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Building</th>
                                                    <th className="text-right">Items</th>
                                                    <th className="text-right">Total Value</th>
                                                    <th className="text-right">% of Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voData.buildings?.map((building) => {
                                                    const buildingTotal = calculateBuildingTotal(building);
                                                    const grandTotal = calculateGrandTotal();
                                                    const percentage = grandTotal > 0 ? (buildingTotal / grandTotal) * 100 : 0;
                                                    
                                                    return (
                                                        <tr key={building.id} className="hover">
                                                            <td className="font-medium">{building.buildingName}</td>
                                                            <td className="text-right">{building.contractVoes?.length || 0}</td>
                                                            <td className="text-right font-semibold">{formatCurrency(buildingTotal, { decimals: 'never' })}</td>
                                                            <td className="text-right">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 bg-base-300 rounded-full h-2">
                                                                        <div 
                                                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-sm">{percentage.toFixed(1)}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VOPreviewModal;
