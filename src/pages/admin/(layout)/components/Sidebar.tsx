import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router";
import SimpleBarCore from "simplebar-core";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import { Logo } from "@/components/Logo";
import { useConfig } from "@/contexts/config";

import { getActivatedItemParentKeys } from "../helpers";
import { ISidebarMenuItem, SidebarMenuItem } from "./SidebarMenuItem";

export const Sidebar = ({ menuItems }: { menuItems: ISidebarMenuItem[] }) => {
    const { pathname } = useLocation();
    const { config } = useConfig();
    const scrollRef = useRef<SimpleBarCore | null>(null);
    const hasMounted = useRef(false);

    const activatedParents = useMemo(
        () => new Set(getActivatedItemParentKeys(menuItems, pathname)),
        [menuItems, pathname],
    );

    useEffect(() => {
        setTimeout(() => {
            const contentElement = scrollRef.current?.getContentElement();
            const scrollElement = scrollRef.current?.getScrollElement();
            if (contentElement) {
                const activatedItem = contentElement.querySelector<HTMLElement>(".active");
                const top = activatedItem?.getBoundingClientRect().top;
                if (activatedItem && scrollElement && top && top !== 0) {
                    scrollElement.scrollTo({ top: scrollElement.scrollTop + top - 300, behavior: "smooth" });
                }
            }
        }, 100);
    }, [activatedParents, scrollRef]);

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }
        if (window.innerWidth <= 64 * 16) {
            const sidebarTrigger = document.querySelector<HTMLInputElement>("#layout-sidebar-toggle-trigger");
            if (sidebarTrigger) {
                sidebarTrigger.checked = false;
            }
        }
    }, [pathname]);

    return (
        <>
            <input
                type="checkbox"
                id="layout-sidebar-toggle-trigger"
                className="hidden"
                aria-label="Toggle layout sidebar"
            />

            <div
                id="layout-sidebar"
                data-theme={
                    config.sidebarTheme == "dark" && ["light", "contrast"].includes(config.theme) ? "dark" : undefined
                }>
                <div className="flex min-h-16 items-center justify-center">
                    <Logo />
                </div>
                <div className="relative min-h-0 grow">
                    <SimpleBar ref={scrollRef} className="size-full">
                        <div id="sidebar-menu">
                            {menuItems.map((item, index) => (
                                <SidebarMenuItem {...item} key={index} activated={activatedParents} />
                            ))}
                        </div>
                    </SimpleBar>
                    <div className="from-base-100/60 absolute start-0 end-0 bottom-0 h-7 bg-linear-to-t to-transparent"></div>
                </div>
            </div>
        </>
    );
};
