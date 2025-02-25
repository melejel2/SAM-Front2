import { Link } from "react-router";

import { ThemeToggleDropdown } from "@/components/ThemeToggleDropdown";
import { ConfigProvider, useConfig } from "@/contexts/config";

import { TopbarNotificationButton } from "./TopbarNotificationButton";
import { TopbarToggleDashboardButton } from "./TopbarToggleDashboardButton";

export const Topbar = () => {
    return (
        <div
            role="navigation"
            aria-label="Navbar"
            className="flex items-center justify-between px-3"
            id="layout-topbar">
            <div className="inline-flex items-center gap-3">
                <label
                    className="btn btn-square btn-ghost btn-sm"
                    aria-label="Leftmenu toggle"
                    htmlFor="layout-sidebar-toggle-trigger">
                    <span className="iconify lucide--menu size-5" />
                </label>
                {/* <TopbarSearchButton /> */}
            </div>
            <div className="inline-flex items-center gap-1.5">
                <ThemeToggleDropdown
                    triggerClass="btn btn-sm btn-circle btn-ghost"
                    dropdownClass="dropdown-center"
                    dropdownContentClass="mt-2"
                    iconClass="size-4.5"
                />
                {/* <label htmlFor="layout-rightbar-drawer" className="btn btn-circle btn-ghost btn-sm drawer-button">
                    <span className="iconify lucide--settings-2 size-4.5" />
                </label> */}
                <TopbarToggleDashboardButton />
                <TopbarNotificationButton />

                <div className="dropdown dropdown-bottom dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost rounded-btn px-1.5">
                        <p className="text-sm">username</p>
                    </div>
                    <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box mt-4 w-44 shadow">
                        <ul className="menu w-full p-2">
                            <li className="py-1">
                                <Link className="text-error hover:bg-error/10" to="/auth/login">
                                    <span className="iconify lucide--log-out size-4" />
                                    <span>Delete Account</span>
                                </Link>
                            </li>
                            <hr className="border-base-300" />

                            <li className="py-1">
                                <Link className="text-error hover:bg-error/10" to="/auth/login">
                                    <span className="iconify lucide--log-out size-4" />
                                    <span>Logout</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
