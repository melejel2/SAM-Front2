import { Button, Select, SelectOption } from "@/components/daisyui";
import { VOLevelType, VOLevelContext } from "@/types/variation-order";

interface LevelSelectorProps {
    currentLevel: VOLevelType;
    levelContext: VOLevelContext;
    availableBuildings: any[];
    availableSheets: any[];
    onLevelSelect: (level: VOLevelType, context: Partial<VOLevelContext>) => void;
    disabled?: boolean;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
    currentLevel,
    levelContext,
    availableBuildings,
    availableSheets,
    onLevelSelect,
    disabled = false
}) => {

    const handleProjectLevelClick = () => {
        onLevelSelect('Project', {
            buildingId: undefined,
            sheetId: undefined,
            buildingName: undefined,
            sheetName: undefined
        });
    };

    const handleBuildingSelect = (buildingId: string) => {
        const selectedBuilding = availableBuildings.find(b => b.id === parseInt(buildingId));
        if (selectedBuilding) {
            onLevelSelect('Building', {
                buildingId: selectedBuilding.id,
                buildingName: selectedBuilding.buildingName,
                sheetId: undefined,
                sheetName: undefined
            });
        }
    };

    const handleSheetSelect = (sheetId: string) => {
        const selectedSheet = availableSheets.find(s => s.id === parseInt(sheetId));
        if (selectedSheet) {
            onLevelSelect('Sheet', {
                sheetId: selectedSheet.id,
                sheetName: selectedSheet.name
            });
        }
    };

    const getLevelButtonClass = (level: VOLevelType) => {
        const baseClass = "btn btn-sm transition-all duration-200";
        if (currentLevel === level) {
            return `${baseClass} btn-primary`;
        }
        return `${baseClass} bg-base-200 text-base-content hover:bg-base-300`;
    };

    const canNavigateToBuilding = availableBuildings.length > 0;
    const canNavigateToSheet = levelContext.buildingId && availableSheets.length > 0;

    return (
        <div className="space-y-4">
            {/* Level Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    type="button"
                    className={getLevelButtonClass('Project')}
                    onClick={handleProjectLevelClick}
                    disabled={disabled}
                >
                    <span className="iconify lucide--building-2 size-4"></span>
                    Project Level
                </Button>

                <span className="text-base-content/50">→</span>

                <Button
                    type="button"
                    className={getLevelButtonClass('Building')}
                    onClick={() => {
                        if (levelContext.buildingId) {
                            onLevelSelect('Building', {});
                        }
                    }}
                    disabled={disabled || !canNavigateToBuilding || !levelContext.buildingId}
                >
                    <span className="iconify lucide--home size-4"></span>
                    Building Level
                </Button>

                <span className="text-base-content/50">→</span>

                <Button
                    type="button"
                    className={getLevelButtonClass('Sheet')}
                    onClick={() => {
                        if (levelContext.sheetId) {
                            onLevelSelect('Sheet', {});
                        }
                    }}
                    disabled={disabled || !canNavigateToSheet || !levelContext.sheetId}
                >
                    <span className="iconify lucide--file-text size-4"></span>
                    Sheet Level
                </Button>
            </div>

            {/* Building Selection */}
            {canNavigateToBuilding && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="floating-label">
                        <span>Select Building</span>
                        <Select
                            className="input input-sm bg-base-100 border-base-300"
                            onChange={(e) => handleBuildingSelect(e.target.value)}
                            value={levelContext.buildingId?.toString() || ""}
                            disabled={disabled}
                        >
                            <>
                                <SelectOption value="" className="bg-base-100">
                                    Choose building...
                                </SelectOption>
                                {availableBuildings.map((building) => (
                                    <SelectOption 
                                        key={building.id} 
                                        value={building.id.toString()} 
                                        className="bg-base-100"
                                    >
                                        {building.buildingName}
                                    </SelectOption>
                                ))}
                            </>
                        </Select>
                    </label>

                    {levelContext.buildingId && (
                        <div className="p-3 bg-base-200 rounded-lg">
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-base-content">
                                    {levelContext.buildingName}
                                </p>
                                <p className="text-base-content/70">
                                    Building ID: {levelContext.buildingId}
                                </p>
                                {availableSheets.length > 0 && (
                                    <p className="text-base-content/70">
                                        {availableSheets.length} sheet(s) available
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sheet Selection */}
            {canNavigateToSheet && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="floating-label">
                        <span>Select BOQ Sheet</span>
                        <Select
                            className="input input-sm bg-base-100 border-base-300"
                            onChange={(e) => handleSheetSelect(e.target.value)}
                            value={levelContext.sheetId?.toString() || ""}
                            disabled={disabled}
                        >
                            <>
                                <SelectOption value="" className="bg-base-100">
                                    Choose sheet...
                                </SelectOption>
                                {availableSheets.map((sheet) => (
                                    <SelectOption 
                                        key={sheet.id} 
                                        value={sheet.id.toString()} 
                                        className="bg-base-100"
                                    >
                                        {sheet.name}
                                    </SelectOption>
                                ))}
                            </>
                        </Select>
                    </label>

                    {levelContext.sheetId && (
                        <div className="p-3 bg-base-200 rounded-lg">
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-base-content">
                                    {levelContext.sheetName}
                                </p>
                                <p className="text-base-content/70">
                                    Sheet ID: {levelContext.sheetId}
                                </p>
                                <p className="text-base-content/70">
                                    Within: {levelContext.buildingName}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Status */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                    <span className="iconify lucide--map-pin text-green-600 dark:text-green-400 size-5 mt-0.5"></span>
                    <div>
                        <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                            Current Navigation Status
                        </h5>
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                            <p>
                                <strong>Level:</strong> {currentLevel} 
                                {levelContext.projectName && ` in ${levelContext.projectName}`}
                            </p>
                            {levelContext.buildingName && (
                                <p><strong>Building:</strong> {levelContext.buildingName}</p>
                            )}
                            {levelContext.sheetName && (
                                <p><strong>Sheet:</strong> {levelContext.sheetName}</p>
                            )}
                            <p>
                                <strong>Available Navigation:</strong>{' '}
                                {currentLevel === 'Project' && canNavigateToBuilding && 'Can navigate to Building level'}
                                {currentLevel === 'Building' && canNavigateToSheet && 'Can navigate to Sheet level'}
                                {currentLevel === 'Sheet' && 'At deepest level'}
                                {!canNavigateToBuilding && currentLevel === 'Project' && 'No buildings available'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelSelector;