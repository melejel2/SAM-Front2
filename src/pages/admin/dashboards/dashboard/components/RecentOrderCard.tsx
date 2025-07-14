import React, { useState } from "react";
import { cn } from "@/helpers/utils/cn";
import { PageScrollTracker } from "@/utils/pageScrollTracker";
import { IRecentOrderTableRow, RecentOrderTableRow } from "./RecentOrderTableRow";

const recentOrders: IRecentOrderTableRow[] = [
    {
        image: "/images/apps/ecommerce/products/1.jpg",
        name: "Men's tracking shoes",
        price: 99,
        date: "25 Jun 2024",
        status: "delivered",
    },
    {
        image: "/images/apps/ecommerce/products/2.jpg",
        name: "Cocooil body oil",
        price: 75,
        date: "22 Jun 2024",
        status: "on_going",
    },
    {
        image: "/images/apps/ecommerce/products/3.jpg",
        name: "Freeze Air",
        price: 47,
        date: "17 Jun 2024",
        status: "confirmed",
    },
    {
        image: "/images/apps/ecommerce/products/4.jpg",
        name: "Ladies's shoes",
        price: 52,
        date: "23 Jun 2024",
        status: "canceled",
    },
    {
        image: "/images/apps/ecommerce/products/10.jpg",
        name: "Choco's cookie",
        price: 24,
        date: "21 Jun 2024",
        status: "waiting",
    },
];

export const RecentOrderCard = () => {
    // Scroll indicator states
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    // Check scroll capabilities
    const checkScrollCapability = React.useCallback(() => {
        const container = tableContainerRef.current;
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
                        container.scrollTo({ left: 25, behavior: 'smooth' });
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
        setStartX(e.pageX - (tableContainerRef.current?.offsetLeft || 0));
        setScrollLeft(tableContainerRef.current?.scrollLeft || 0);
        
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
        if (!isMouseDown || !tableContainerRef.current) return;
        
        e.preventDefault();
        const x = e.pageX - (tableContainerRef.current.offsetLeft || 0);
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        tableContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    // Effects for scroll detection
    React.useEffect(() => {
        const container = tableContainerRef.current;
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

    return (
        <div aria-label="Card" className="bg-base-100 rounded-xl border border-base-300 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-base-300 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="iconify lucide--shopping-bag size-4.5" />
                    <h3 className="text-lg font-semibold text-base-content">Recent Orders</h3>
                    <button className="btn btn-outline border-base-300 btn-sm ms-auto">
                        <span className="iconify lucide--download size-3.5" />
                        Report
                    </button>
                </div>
            </div>
            <div 
                ref={tableContainerRef}
                className={cn(
                    "overflow-x-auto overflow-y-auto flex-1 relative",
                    "scroll-smooth",
                    isMouseDown ? "cursor-grabbing select-none" : "cursor-auto"
                )}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                }}
            >
                {/* Left scroll indicator - no background shadow */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 z-10 w-4 pointer-events-none flex items-center justify-center">
                        <div className="w-0.5 h-6 bg-base-content/40 rounded-full animate-fade-in"></div>
                    </div>
                )}
                
                {/* Right scroll indicator - no background shadow */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 z-10 w-4 pointer-events-none flex items-center justify-center">
                        <div className={cn(
                            "w-0.5 h-6 rounded-full transition-all duration-200",
                            showScrollHint ? "bg-blue-400 animate-smooth-pulse" : "bg-base-content/40 animate-fade-in"
                        )}></div>
                    </div>
                )}
                
                {/* Scroll hint overlay */}
                {showScrollHint && canScrollRight && (
                    <div className="absolute top-2 right-8 z-20 bg-blue-500/90 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none animate-fade-in">
                        Scroll →
                    </div>
                )}
                
                <table className="w-full min-w-max"
                    style={{
                        userSelect: isMouseDown ? 'none' : 'auto'
                    }}>
                    <thead className="bg-base-200">
                        <tr>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">
                                <input
                                    aria-label="checked-all-order"
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                />
                            </th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Product</th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Price</th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Date</th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Status</th>
                            <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-300">
                        {recentOrders.map((recentOrder, index) => (
                            <RecentOrderTableRow {...recentOrder} key={index} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
