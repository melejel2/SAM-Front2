import React, { useState } from "react";

import Icon from "@/components/Icon";
import { Button } from "@/components/daisyui/Button";
import { useDialog } from "@/components/daisyui/Modal";
import { cn } from "@/helpers/utils/cn";
import { PageScrollTracker } from "@/utils/pageScrollTracker";

import DialogComponent from "./Dialog";

// Badge component for status and type rendering
const StatusBadge = ({ value, type }: { value: string; type: 'status' | 'type' }) => {
    const getBadgeClasses = (val: string, badgeType: 'status' | 'type') => {
        const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
        
        if (badgeType === 'status') {
            switch (val.toLowerCase()) {
                case 'editable':
                    return `${baseClasses} bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50`;
                case 'issued':
                    return `${baseClasses} bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50`;
                case 'pending':
                    return `${baseClasses} bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50`;
                case 'active':
                    return `${baseClasses} bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50`;
                case 'terminated':
                    return `${baseClasses} bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50`;
                case 'completed':
                    return `${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50`;
                case 'suspended':
                    return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50`;
                default:
                    return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50`;
            }
        } else {
            switch (val.toLowerCase()) {
                case 'provisoire':
                    return `${baseClasses} bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50`;
                case 'final':
                    return `${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50`;
                case 'rg':
                    return `${baseClasses} bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50`;
                case 'avance':
                    return `${baseClasses} bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/50`;
                default:
                    return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50`;
            }
        }
    };

    return (
        <span className={getBadgeClasses(value, type)}>
            {value}
        </span>
    );
};

// Helper function to extract text content from HTML strings
const getTextContent = (value: any): string => {
    if (typeof value === 'string' && value.includes('<')) {
        // Extract text content from HTML
        const div = document.createElement('div');
        div.innerHTML = value;
        return div.textContent || div.innerText || '';
    }
    return String(value || '');
};

interface AccordionProps {
    rowData: object;
    actions: boolean;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    onEdit?: (data: any) => void;
    onDelete?: (id: number) => void;
    onShow?: (data: any) => void;
    title: string;
    previewLoadingRowId?: string | null;
    // Added property for selectable mode
    select?: boolean;
}

interface AccordionsProps {
    accordionData: any[];
    columns: Record<string, string>;
    previewColumns?: Record<string, string>;
    actions: boolean;
    previewAction?: boolean;
    deleteAction?: boolean;
    editAction?: boolean;
    inputFields?: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
    }>;
    title: string;
    addBtn?: boolean;
    addBtnText?: string;
    openStaticDialog?: (type: "Add" | "Edit" | "Delete" | "Preview", Data?: any) => void | Promise<void>;
    dynamicDialog?: boolean;
    // Added property for selectable mode
    select?: boolean;
    previewLoadingRowId?: string | null;
}

const Accordion: React.FC<AccordionProps> = ({
    onDelete,
    onEdit,
    onShow,
    title,
    rowData,
    actions,
    previewAction,
    deleteAction,
    editAction,
    previewLoadingRowId,
    select, // now destructured and used
}) => {
    // Scroll indicator states
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const accordionContentRef = React.useRef<HTMLDivElement>(null);

    // Check scroll capabilities
    const checkScrollCapability = React.useCallback(() => {
        const container = accordionContentRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
            
            // Show scroll hint if can scroll right and not shown yet for this page
            const pageKey = PageScrollTracker.generatePageKey();
            if (scrollLeft === 0 && scrollWidth > clientWidth && 
                !showScrollHint && !PageScrollTracker.hasShownScrollHint(pageKey)) {
                setShowScrollHint(true);
                PageScrollTracker.markScrollHintShown(pageKey);
                
                // Smoother scroll movement with better timing
                setTimeout(() => {
                    if (container && container.scrollLeft === 0) {
                        container.scrollTo({ left: 20, behavior: 'smooth' });
                        setTimeout(() => {
                            if (container) {
                                container.scrollTo({ left: 0, behavior: 'smooth' });
                            }
                        }, 600);
                    }
                }, 300);
                // Hide hint after animation
                setTimeout(() => setShowScrollHint(false), 2200);
            }
        }
    }, [showScrollHint]);

    // Mouse drag scrolling handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if not clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) {
            return;
        }
        
        setIsMouseDown(true);
        setStartX(e.pageX - (accordionContentRef.current?.offsetLeft || 0));
        setScrollLeft(accordionContentRef.current?.scrollLeft || 0);
        
        // Prevent text selection while dragging
        e.preventDefault();
    };

    const handleMouseLeave = () => {
        setIsMouseDown(false);
    };

    const handleMouseUp = () => {
        setIsMouseDown(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMouseDown || !accordionContentRef.current) return;
        
        e.preventDefault();
        const x = e.pageX - (accordionContentRef.current.offsetLeft || 0);
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        accordionContentRef.current.scrollLeft = scrollLeft - walk;
    };

    // Effects for scroll detection
    React.useEffect(() => {
        const container = accordionContentRef.current;
        if (container) {
            checkScrollCapability();
            
            const handleScroll = () => {
                checkScrollCapability();
            };
            
            const handleResize = () => {
                checkScrollCapability();
            };
            
            container.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', handleResize);
            
            return () => {
                container.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [checkScrollCapability]);

    // Cleanup mouse events
    React.useEffect(() => {
        const handleGlobalMouseUp = () => setIsMouseDown(false);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);
    const handleDelete = () => {
        if (onDelete) {
            onDelete(0); // Replace 0 with appropriate id if needed
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(rowData);
        }
    };

    return (
        <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 border-b border-base-300 flex-shrink-0">
                <h3 className="text-lg font-semibold text-base-content">{title}</h3>
            </div>
            <div 
                ref={accordionContentRef}
                className={cn(
                    "px-2 sm:px-3 lg:px-4 py-3 sm:py-4 space-y-3 overflow-y-auto overflow-x-auto flex-1 relative",
                    "scroll-smooth",
                    isMouseDown ? "cursor-grabbing select-none" : "cursor-auto"
                )}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
                    userSelect: isMouseDown ? 'none' : 'auto'
                }}
            >
                {/* Left scroll indicator - no background shadow */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 z-10 w-3 pointer-events-none flex items-center justify-center">
                        <div className="w-0.5 h-6 bg-base-content/40 rounded-full animate-fade-in"></div>
                    </div>
                )}
                
                {/* Right scroll indicator - no background shadow */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 z-10 w-3 pointer-events-none flex items-center justify-center">
                        <div className={cn(
                            "w-0.5 h-6 rounded-full transition-all duration-200",
                            showScrollHint ? "bg-blue-400 animate-smooth-pulse" : "bg-base-content/40 animate-fade-in"
                        )}></div>
                    </div>
                )}
                
                {/* Scroll hint overlay for mobile */}
                {showScrollHint && canScrollRight && (
                    <div className="absolute top-2 right-6 z-20 bg-blue-500/90 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none animate-fade-in">
                        Swipe →
                    </div>
                )}

                {/* If select mode is enabled, show a checkbox */}
                {select && (
                    <div className="mb-3 flex items-center">
                        <input type="checkbox" className="checkbox checkbox-xs" />
                        <span className="ml-2 text-xs sm:text-sm text-base-content/70">Select</span>
                    </div>
                )}
                {Object.entries(rowData).map(([key, value], index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-base-300 last:border-b-0 min-w-max">
                        <span className="text-xs sm:text-xs font-medium text-base-content/70 uppercase tracking-wider whitespace-nowrap mr-4">{key}</span>
                        <span className="text-xs sm:text-sm font-medium text-base-content whitespace-nowrap">
                            {typeof value === 'string' && value?.includes('<span class="badge') ? (
                                <div dangerouslySetInnerHTML={{ __html: value }} />
                            ) : (key === 'status' || key === 'type') && value ? (
                                <StatusBadge 
                                    value={getTextContent(value)} 
                                    type={key as 'status' | 'type'} 
                                />
                            ) : (
                                value
                            )}
                        </span>
                    </div>
                ))}
                {actions && (
                    <div className="flex w-full items-center justify-end pt-2 sm:pt-3 border-t border-base-300 flex-shrink-0">
                        {previewAction && (
                            <Button
                                color="ghost"
                                size="sm"
                                shape={"square"}
                                aria-label="Preview"
                                disabled={previewLoadingRowId === ((rowData as any).id || (rowData as any).contractId || (rowData as any).projectId || String(rowData))}
                                onClick={() => {
                                    if (onShow) onShow(rowData);
                                }}>
                                <Icon 
                                    icon={previewLoadingRowId === ((rowData as any).id || (rowData as any).contractId || (rowData as any).projectId || String(rowData)) ? "loader-2" : "eye"} 
                                    className={`text-base-content/70 ${previewLoadingRowId === ((rowData as any).id || (rowData as any).contractId || (rowData as any).projectId || String(rowData)) ? 'animate-spin' : ''}`} 
                                    fontSize={4} 
                                />
                            </Button>
                        )}
                        {editAction && (
                            <Button color="ghost" size="sm" shape={"square"} aria-label="Edit" onClick={handleEdit}>
                                <Icon icon={"pencil"} className="text-base-content/70" fontSize={4} />
                            </Button>
                        )}
                        {deleteAction && (
                            <Button
                                color="ghost"
                                className="text-error/70 hover:bg-error/20"
                                size="sm"
                                shape={"square"}
                                aria-label="Delete"
                                onClick={handleDelete}>
                                <Icon icon={"trash"} fontSize={4} />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AccordionComponent: React.FC<AccordionsProps> = ({
    actions,
    accordionData,
    inputFields,
    title,
    previewAction,
    deleteAction,
    editAction,
    addBtn,
    addBtnText,
    openStaticDialog,
    dynamicDialog = true,
    select, // destructured here as well
    previewLoadingRowId: externalPreviewLoadingRowId,
}) => {
    const { dialogRef, handleShow, handleHide } = useDialog();
    const [dialogType, setDialogType] = useState<"Add" | "Edit" | "Preview">("Add");
    const [currentRow, setCurrentRow] = useState<any | null>(null);
    const [internalPreviewLoadingRowId, setInternalPreviewLoadingRowId] = useState<string | null>(null);
    const previewLoadingRowId = externalPreviewLoadingRowId ?? internalPreviewLoadingRowId;

    const openCreateDialog = () => {
        setDialogType("Add");
        setCurrentRow(null);
        handleShow();
    };

    const openEditDialog = (data: any) => {
        setDialogType("Edit");
        setCurrentRow(data);
        handleShow();
    };

    const openPreviewDialog = async (data: any) => {
        setDialogType("Preview");
        setCurrentRow(data);
        
        // Set loading state for this specific row
        const rowId = data.id || data.contractId || data.projectId || String(data);
        setInternalPreviewLoadingRowId(rowId);
        
        if (dynamicDialog) {
            handleShow();
            // Clear loading state after dialog opens
            setInternalPreviewLoadingRowId(null);
        } else {
            if (openStaticDialog) {
                try {
                    await openStaticDialog("Preview", data);
                } finally {
                    // Clear loading state after preview is handled
                    setInternalPreviewLoadingRowId(null);
                }
            }
        }
    };

    const handleDelete = (id: number) => {
        console.log(`Delete row with ID: ${id}`);
    };

    const handleSuccess = () => {
        console.log("Dialog action completed!");
        handleHide();
    };

    return (
        <>
            {addBtn && (
                <Button
                    onClick={openCreateDialog}
                    className="btn btn-primary btn-sm rounded-xl table-new-btn px-4 text-sm transition-all duration-200 text-primary-content mb-4">
                    <Icon icon={addBtnText?.toLowerCase().includes('upload') ? "upload" : "plus"} fontSize={4} />
                    <span className="text-xs">{addBtnText || `New ${title}`}</span>
                </Button>
            )}
            <div className="w-full space-y-3">
                {/* Row count display for mobile */}
                {accordionData.length > 0 && (
                    <div className="text-sm text-base-content/60 px-2 mb-2">
                        Showing {accordionData.length} {accordionData.length === 1 ? 'entry' : 'entries'}
                    </div>
                )}
                {accordionData.length > 0 &&
                    accordionData.map((data, index) => (
                        <Accordion
                            rowData={data}
                            key={index}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                            onShow={openPreviewDialog}
                            title={"title"}
                            actions={actions}
                            previewAction={previewAction}
                            editAction={editAction}
                            deleteAction={deleteAction}
                            previewLoadingRowId={previewLoadingRowId}
                            select={select} // pass the prop to each Accordion
                        />
                    ))}
            </div>

            {(addBtn || actions) && (
                <DialogComponent
                    dialogRef={dialogRef}
                    handleHide={handleHide}
                    dialogType={dialogType}
                    current={currentRow}
                    onSuccess={handleSuccess}
                    inputFields={inputFields}
                    title={title}
                />
            )}
        </>
    );
};

export default AccordionComponent;
