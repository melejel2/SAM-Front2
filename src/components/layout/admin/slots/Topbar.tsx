import avatar1 from "@/assets/images/avatars/1.png";

import bellIcon from "@iconify/icons-lucide/bell";
import logoutIcon from "@iconify/icons-lucide/log-out";
import menuIcon from "@iconify/icons-lucide/menu";
import userIcon from "@iconify/icons-lucide/user";

import { useNavigate } from "react-router-dom";

import {
    Avatar,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Mask,
    Navbar,
    NavbarCenter,
    NavbarEnd,
    NavbarStart,
} from "@/components/daisyui";

import Icon from "@/components/Icon";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import routes from "@/services/routes";
import { useAuthContext } from "@/states/auth";
import { useLayoutContext } from "@/states/layout";

import NotificationButton from "../components/NotificationButton";
import SearchButton from "../components/SearchButton";

const Topbar = () => {
    const { toggleLeftbarDrawer, state } = useLayoutContext();
    const { logout } = useAuthContext();
    const navigate = useNavigate();

    const doLogout = () => {
        logout();
        navigate(routes.auth.login);
    };

    return (
        <Navbar className="z-10  border-b border-base-200 px-3">
            <NavbarStart className="gap-3">
                <Button
                    shape="square"
                    color="ghost"
                    size="sm"
                    onClick={() => toggleLeftbarDrawer(!state.leftbar.drawerOpen)}>
                    <Icon icon={menuIcon} className="inline-block" fontSize={20} />
                </Button>
                <SearchButton />
            </NavbarStart>
            <NavbarCenter></NavbarCenter>
            <NavbarEnd className="gap-1.5">
                <ThemeToggleButton shape="circle" color="ghost" size="sm" />

                <NotificationButton />
                <Dropdown vertical="bottom" end>
                    <DropdownToggle
                        className="btn btn-ghost rounded-btn px-1.5 hover:bg-base-content/20"
                        button={false}>
                        <div className="flex items-center gap-2">
                            <Avatar
                                src={avatar1}
                                size={30}
                                innerClassName={Mask.className({ variant: "squircle" })}></Avatar>
                            <div className="flex flex-col items-start">
                                <p className="text-sm/none">Denish</p>
                                <p className="mt-1 text-xs/none text-primary">Edit</p>
                            </div>
                        </div>
                    </DropdownToggle>
                    <DropdownMenu className="mt-4 w-52">
                        <DropdownItem>
                            <Icon icon={userIcon} fontSize={16} /> My Profile
                        </DropdownItem>
                        <DropdownItem>
                            <Icon icon={bellIcon} fontSize={16} /> Notification
                        </DropdownItem>
                        <hr className="-mx-2 my-1 border-base-content/10" />
                        <DropdownItem className="text-error" onClick={doLogout}>
                            <Icon icon={logoutIcon} fontSize={16} />
                            Logout
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </NavbarEnd>
        </Navbar>
    );
};

export default Topbar;
