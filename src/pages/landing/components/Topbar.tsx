import menuIcon from "@iconify/icons-lucide/menu";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button, Drawer, Menu, MenuItem, Navbar, NavbarEnd, NavbarStart } from "@/components/daisyui";

import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { cn } from "@/helpers/utils/cn";
import routes from "@/services/routes";

const Topbar = () => {
    const [drawerOpened, setDrawerOpened] = useState(false);
    const [atTop, setAtTop] = useState(true);

    useEffect(() => {
        const onWindowScroll = () => {
            setAtTop(window.scrollY < 30);
        };
        window.addEventListener("scroll", onWindowScroll);
        onWindowScroll();
    }, []);

    return (
        <>
            <div
                className={cn("fixed inset-x-0 top-0 z-[60] backdrop-blur-sm transition-all duration-500", {
                    "z-20 border-b border-base-content/10 bg-base-100 lg:bg-opacity-90 dark:lg:bg-opacity-95": !atTop,
                    "border-transparent": atTop,
                })}>
                <div className="container">
                    <Navbar className="px-0">
                        <NavbarStart className="gap-2">
                            <div className="flex-none lg:hidden">
                                <Drawer
                                    open={drawerOpened}
                                    onClickOverlay={() => setDrawerOpened(!drawerOpened)}
                                    side={
                                        <Menu className="min-h-full w-80 gap-2 bg-base-100 p-4 text-base-content">
                                            <MenuItem className="font-medium">
                                                <Logo />
                                            </MenuItem>

                                            <MenuItem className="font-medium">
                                                <p>Home</p>
                                            </MenuItem>
                                            <MenuItem className="font-medium">
                                                <Link to={routes.dashboards.ecommerce}>Dashboard</Link>
                                            </MenuItem>
                                            <MenuItem className="font-medium">
                                                <Link to={routes.ui.components.accordion}>Components</Link>
                                            </MenuItem>
                                        </Menu>
                                    }>
                                    <Button shape="square" color="ghost" onClick={() => setDrawerOpened(true)}>
                                        <Icon icon={menuIcon} className="inline-block text-xl" />
                                    </Button>
                                </Drawer>
                            </div>

                            <Logo />
                        </NavbarStart>

                        <NavbarEnd className="gap-3">
                            <Menu horizontal size="sm" className="hidden gap-2 px-1 lg:inline-flex">
                                <MenuItem className="font-medium">
                                    <p>Home</p>
                                </MenuItem>
                                <MenuItem className="font-medium">
                                    <Link to={routes.dashboards.ecommerce}>Dashboard</Link>
                                </MenuItem>
                                <MenuItem className="font-medium">
                                    <Link to={routes.ui.components.accordion}>Components</Link>
                                </MenuItem>
                            </Menu>
                            <Button size={"sm"} color="primary" onClick={() => setDrawerOpened(true)}>
                                Purchase Now
                            </Button>
                        </NavbarEnd>
                    </Navbar>
                </div>
            </div>
        </>
    );
};

export default Topbar;
