import { Button } from "@/components/daisyui";
import { VOLevelType, VOLevelContext } from "@/types/variation-order";

interface LevelBreadcrumbProps {
    levelContext: VOLevelContext;
    onLevelClick: (level: VOLevelType) => void;
}

const LevelBreadcrumb: React.FC<LevelBreadcrumbProps> = ({
    levelContext,
    onLevelClick
}) => {
    
    const getBreadcrumbItems = () => {
        const items = [];

        // Project level is always available
        items.push({
            level: 'Project' as VOLevelType,
            label: levelContext.projectName || 'Project',
            icon: 'lucide--building-2',
            active: levelContext.level === 'Project'
        });

        // Building level if we have building context
        if (levelContext.buildingId && levelContext.buildingName) {
            items.push({
                level: 'Building' as VOLevelType,
                label: levelContext.buildingName,
                icon: 'lucide--home',
                active: levelContext.level === 'Building'
            });
        }

        // Sheet level if we have sheet context
        if (levelContext.sheetId && levelContext.sheetName) {
            items.push({
                level: 'Sheet' as VOLevelType,
                label: levelContext.sheetName,
                icon: 'lucide--file-text',
                active: levelContext.level === 'Sheet'
            });
        }

        return items;
    };

    const breadcrumbItems = getBreadcrumbItems();

    const handleBreadcrumbClick = (level: VOLevelType) => {
        // Only allow clicking on levels that are not the current active level
        if (level !== levelContext.level) {
            onLevelClick(level);
        }
    };

    const getBreadcrumbButtonClass = (item: any) => {
        const baseClass = "btn btn-sm transition-all duration-200";
        if (item.active) {
            return `${baseClass} btn-primary cursor-default`;
        }
        return `${baseClass} btn-ghost hover:bg-base-300 text-base-content`;
    };

    return (
        <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
            {/* Home Icon */}
            <span className="iconify lucide--home text-base-content/70 size-4"></span>

            {breadcrumbItems.map((item, index) => (
                <div key={item.level} className="flex items-center gap-2">
                    {/* Separator */}
                    {index > 0 && (
                        <span className="iconify lucide--chevron-right text-base-content/50 size-3"></span>
                    )}

                    {/* Breadcrumb Item */}
                    <Button
                        type="button"
                        className={getBreadcrumbButtonClass(item)}
                        onClick={() => handleBreadcrumbClick(item.level)}
                        disabled={item.active}
                        title={item.active ? `Current level: ${item.label}` : `Navigate to ${item.level} level: ${item.label}`}
                    >
                        <span className={`iconify ${item.icon} size-4`}></span>
                        <span className="max-w-32 truncate">{item.label}</span>
                        {item.active && (
                            <span className="iconify lucide--map-pin text-primary size-3"></span>
                        )}
                    </Button>
                </div>
            ))}

            {/* Current Level Indicator */}
            <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <span className="iconify lucide--layers text-primary size-4"></span>
                <span className="text-sm font-medium text-primary">
                    {levelContext.level} Level
                </span>
            </div>
        </div>
    );
};

export default LevelBreadcrumb;