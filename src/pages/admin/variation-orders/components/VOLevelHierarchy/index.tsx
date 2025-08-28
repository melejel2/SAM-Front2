import { VOLevelType, VOLevelContext } from "@/types/variation-order";
import LevelSelector from "./LevelSelector";
import LevelBreadcrumb from "./LevelBreadcrumb";
import VOItemsView from "./VOItemsView";
import useVOLevelHierarchy from "./use-vo-level-hierarchy";

interface VOLevelHierarchyProps {
    voDatasetId?: number;
    voDataset?: any;
    onLevelChange?: (level: VOLevelType, context: VOLevelContext) => void;
    showControls?: boolean;
    mode?: 'view' | 'edit';
    initialLevel?: VOLevelType;
}

const VOLevelHierarchy: React.FC<VOLevelHierarchyProps> = ({
    voDatasetId,
    voDataset,
    onLevelChange,
    showControls = true,
    mode = 'view',
    initialLevel = 'Project'
}) => {
    const {
        currentLevel,
        levelContext,
        filteredItems,
        availableBuildings,
        availableSheets,
        loading,
        navigateToLevel,
        totals,
        navigationStatus
    } = useVOLevelHierarchy({
        voDataset,
        initialLevel,
        onLevelChange
    });

    const handleLevelSelect = (level: VOLevelType, context: Partial<VOLevelContext>) => {
        navigateToLevel(level, context);
    };

    const handleBreadcrumbClick = (level: VOLevelType) => {
        navigateToLevel(level);
    };

    return (
        <div className="flex flex-col bg-base-100 min-h-full">
            {showControls && (
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                            <span className="iconify lucide--layers text-purple-600 dark:text-purple-400 size-5"></span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-base-content">VO Level Hierarchy</h2>
                            <p className="text-sm text-base-content/70">Navigate through VO levels and view filtered items</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-sm text-base-content/70">
                            {totals.items} items • ${totals.amount.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 p-4 space-y-6">
                {/* Breadcrumb Navigation */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold text-base-content">Current Location</h3>
                    <LevelBreadcrumb
                        levelContext={levelContext}
                        onLevelClick={handleBreadcrumbClick}
                    />
                </div>

                {/* Level Selection Controls */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold text-base-content">Navigation</h3>
                    <LevelSelector
                        currentLevel={currentLevel}
                        levelContext={levelContext}
                        availableBuildings={availableBuildings}
                        availableSheets={availableSheets}
                        onLevelSelect={handleLevelSelect}
                        disabled={loading}
                    />
                </div>

                {/* Level Summary */}
                <div className="p-4 bg-base-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Current Level</span>
                            <p className="text-sm font-medium text-base-content">
                                {currentLevel}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Items Count</span>
                            <p className="text-sm font-medium text-base-content">
                                {totals.items} items
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Total Value</span>
                            <p className="text-sm font-medium text-base-content">
                                ${totals.amount.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Context</span>
                            <p className="text-sm font-medium text-base-content">
                                {levelContext.sheetName || levelContext.buildingName || levelContext.projectName || 'All'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* VO Items View */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold text-base-content">
                        VO Items - {currentLevel} Level
                    </h3>
                    <VOItemsView
                        items={filteredItems}
                        level={currentLevel}
                        loading={loading}
                        mode={mode}
                        onItemEdit={(item) => {
                            // Handle item editing if in edit mode
                            console.log("Edit item:", item);
                        }}
                        onItemDelete={(item) => {
                            // Handle item deletion if in edit mode
                            console.log("Delete item:", item);
                        }}
                    />
                </div>

                {/* Instructions */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <span className="iconify lucide--info text-blue-600 dark:text-blue-400 size-5 mt-0.5"></span>
                        <div>
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                VO Level Hierarchy Navigation
                            </h5>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• <strong>Project Level:</strong> View all VO items across all buildings in the project</li>
                                <li>• <strong>Building Level:</strong> View VO items for a specific building</li>
                                <li>• <strong>Sheet Level:</strong> View VO items for a specific BOQ sheet within a building</li>
                                <li>• Use breadcrumbs to navigate back up the hierarchy</li>
                                <li>• Level selection updates the filtered view automatically</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VOLevelHierarchy;