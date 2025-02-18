import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import logoutIcon from "@iconify/icons-lucide/log-out";
import userIcon from "@iconify/icons-lucide/user-circle";
import menuIcon from "@iconify/icons-lucide/menu";
import deleteIcon from "@iconify/icons-lucide/trash-2";
import adminToolsIcon from "@iconify/icons-lucide/user-cog";
import dashboardIcon from "@iconify/icons-lucide/airplay";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Navbar,
  NavbarCenter,
  NavbarEnd,
  NavbarStart,
  Tooltip,
} from "@/components/daisyui";
import Icon from "@/components/Icon";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import Logo from "@/components/Logo";
import routes from "@/services/routes";
import { useAuthContext } from "@/states/auth";
import { useLayoutContext } from "@/states/layout";
import { IMenuItem } from "@/types/layout/admin";
import { useState } from "react";
import { cn } from "@/helpers/utils/cn";
import NotificationButton from "../components/NotificationButton";
import bellIcon from "@iconify/icons-lucide/bell";

const Topbar = ({ menuItems }: { menuItems: IMenuItem[] }) => {
  const { toggleLeftbarDrawer, state, toggleDashboard, resetDashboard } =
    useLayoutContext();
  const { logout, isLoggedIn, authState } = useAuthContext();
  const navigate = useNavigate();

  const [selectedDropdown, setSelectedDropdown] = useState<string | null>(null);
  const [selectedAccountDropdown, setSelectedAccountDropdown] =
    useState<boolean>(false);

  const isActive = (url?: string) => location.pathname === url;

  const doLogout = () => {
    resetDashboard();
    logout();
    navigate(routes.auth.login);
  };

  const deleteAccount = () => {
    // Dummy "deleteAccount" handler
    doLogout();
  };

  const handleSpanClick = () => {
    const toggleButton = document.getElementById("themeToggleButton");
    if (toggleButton) {
      toggleButton.click();
    }
  };

  const handleToggleDashboard = () => {
    toggleDashboard();
  };

  const renderMenuItems = (items: IMenuItem[]) => {
    return items.map((item) => {
      if (item.children && item.children.length === 1) {
        // If the parent has only one child, render the child as a link
        const child = item.children[0];
        return (
          <Link
            key={child.key}
            to={child.url || "#"}
            className={`hover:bg-blue-100 hover:text-blue-900 flex flex-col justify-center items-center h-full w-full  rounded-full ${
              isActive(child.url)
                ? "bg-blue-200 hover:bg-blue-200 text-blue-900"
                : ""
            }`}
          >
            <Icon icon={child.icon || item.icon || ""} fontSize={24} />
          </Link>
        );
      } else if (item.children && item.children.length > 1) {
        // Check if any child is active
        const isChildActive = item.children.some((child) =>
          isActive(child.url)
        );

        // Render Dropdown for items with more than one child
        return (
          <Dropdown
            key={item.key}
            vertical="top"
            onFocus={() => setSelectedDropdown(item.key)}
            onBlur={() => setSelectedDropdown(null)}
          >
            <DropdownToggle
              button={false}
              className={`relative  hover:bg-blue-100 hover:text-blue-900  flex flex-col justify-center items-center h-full w-full rounded-full hover:cursor-pointer ${
                isChildActive
                  ? "bg-blue-200 hover:bg-blue-200 text-blue-900 dark:bg-blue-500 dark:hover:bg-blue-500 dark:text-base-content"
                  : "text-base-content hover:text-base-content/80 "
              }`}
            >
              {selectedDropdown === item.key && (
                <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 w-6 h-8 rotate-180 z-50">
                  <div className="absolute inset-0 bg-transparent [clip-path:polygon(0_0,100%_0,50%_50%)]"></div>
                  <div className="absolute inset-0 bg-base-100 [clip-path:polygon(50%_50%,0_100%,100%_100%)]"></div>
                </div>
              )}

              <Icon icon={item.icon || ""} fontSize={24} />
            </DropdownToggle>
            <DropdownMenu className="mb-8 w-52">
              {item.children.map((child) => (
                <DropdownItem
                  key={child.key}
                  onClick={() => navigate(child.url || "")}
                  className={`text-sm/none h-full w-full flex items-center space-x-2 z-100 ${
                    isActive(child.url)
                      ? "bg-blue-200 text-blue-900 hover:bg-blue-200 dark:bg-blue-500 dark:hover:bg-blue-500 dark:text-base-content"
                      : "text-base-content hover:text-base-content/80 "
                  }`}
                >
                  <Icon icon={child.icon || ""} fontSize={24} />
                  <span>{child.label}</span>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        );
      } else {
        // Render Link for items without children
        return (
          <Link
            key={item.key}
            to={item.url || "#"}
            className={`flex flex-col justify-center items-center h-full w-full rounded-full cursor-pointer ${
              isActive(item.url)
                ? "bg-blue-300 hover:bg-blue-300 text-blue-900 dark:bg-blue-500 dark:hover:bg-blue-500 dark:text-base-content"
                : "text-base-content hover:text-base-content/80 "
            }`}
          >
            <Icon icon={item.icon || ""} fontSize={24} />
          </Link>
        );
      }
    });
  };

  return (
    <>
      {/* sm screen */}
      {isLoggedIn() && menuItems.length !== 0 && (
        <>
          <div className="md:hidden fixed top-1 w-full">
            <div className="flex justify-between items-center pl-2 pr-6">
              <Button
                className="btn btn-xs btn-primary"
                onClick={handleToggleDashboard}
              >
                <Icon
                  icon={
                    state.leftbar.dashboard ? adminToolsIcon : dashboardIcon
                  }
                  fontSize={18}
                />
              </Button>
            </div>
          </div>

          <div className="md:hidden btm-nav z-50 flex w-full shadow-xl p-2 mx-auto space-x-1 fixed bottom-4 max-w-[90%] rounded-full border border-base-300">
            {renderMenuItems(menuItems)}

            {/* Account Dropdown */}
            <Dropdown vertical="top" end>
              <DropdownToggle
                button={false}
                className="relative rounded-full hover:cursor-pointer flex flex-col justify-center items-center h-full w-full text-base-content hover:text-base-content/80"
                onFocus={() => setSelectedAccountDropdown(true)}
                onBlur={() => setSelectedAccountDropdown(false)}
              >
                {selectedAccountDropdown && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 bg-base-100 z-50" />
                )}
                <Icon icon={userIcon} fontSize={24} className="mb-0.5" />
              </DropdownToggle>
              <DropdownMenu className="mb-8 w-52">
                <DropdownItem>
                  <p className="text-sm/none">{authState.user?.username}</p>
                </DropdownItem>
                <hr className="-mx-2 my-1 border-base-content/10" />
                <DropdownItem>
                  <Icon icon={bellIcon} fontSize={16} /> Notification
                </DropdownItem>
                <hr className="-mx-2 my-1 border-base-content/10" />
                <DropdownItem onClick={handleSpanClick}>
                  <ThemeToggleButton
                    id="themeToggleButton"
                    shape="circle"
                    color="ghost"
                    size="xs"
                  />
                  <span className="hidden dark:inline">Light mode</span>
                  <span className="dark:hidden">Dark mode</span>
                </DropdownItem>
                <hr className="-mx-2 my-1 border-base-content/10" />

                {/* FIXED: Wrap Icon + text in the same DropdownItem */}
                <DropdownItem className="text-error" onClick={deleteAccount}>
                  {" "}
                  {/* <-- FIXED */}
                  <Icon icon={deleteIcon} fontSize={24} />
                  Delete Account
                </DropdownItem>
                <hr className="-mx-2 my-1 border-base-content/10" />
                <DropdownItem className="text-error" onClick={doLogout}>
                  <Icon icon={logoutIcon} fontSize={24} />
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </>
      )}

      {/* md screen */}
      {isLoggedIn() && menuItems.length !== 0 ? (
        <Navbar className="z-10 border-b border-base-200 px-3 hidden md:flex items-center">
          <NavbarStart className="">
            <Button
              shape="square"
              color="ghost"
              size="sm"
              onClick={() => toggleLeftbarDrawer(!state.leftbar.drawerOpen)}
            >
              <Icon icon={menuIcon} className="inline-block" fontSize={24} />
            </Button>
          </NavbarStart>
          {/* <NavbarCenter></NavbarCenter> */}
          <NavbarEnd className="gap-1.5">
            {/* Dashboard controller */}
            <Tooltip
              message={state.leftbar.dashboard ? "Admin Tools" : "Dashboard"}
              position="bottom"
            >
              <Button
                className="btn btn-circle btn-ghost btn-sm"
                onClick={handleToggleDashboard}
              >
                <Icon
                  icon={
                    state.leftbar.dashboard ? adminToolsIcon : dashboardIcon
                  }
                  fontSize={20}
                />
              </Button>
            </Tooltip>

            {/* Theme controller */}
            <ThemeToggleButton shape="circle" color="ghost" size="sm" />

            {/* Notifications Btn */}
            <NotificationButton />

            {/* Account Menu */}
            <Dropdown vertical="bottom" end>
              <DropdownToggle
                className="btn btn-ghost rounded-btn px-1.5 hover:bg-base-content/20"
                button={false}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm/none">{authState.user?.username}</p>
                  </div>
                </div>
              </DropdownToggle>
              <DropdownMenu className="mb-8 w-52">
                <hr className="-mx-2 my-1 border-base-content/10" />

                {/* FIXED: Wrap Icon + text in the same DropdownItem */}
                <DropdownItem className="text-error" onClick={deleteAccount}>
                  {" "}
                  {/* <-- FIXED */}
                  <Icon icon={deleteIcon} fontSize={24} />
                  Delete Account
                </DropdownItem>

                <hr className="-mx-2 my-1 border-base-content/10" />
                <DropdownItem className="text-error" onClick={doLogout}>
                  <Icon icon={logoutIcon} fontSize={24} />
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarEnd>
        </Navbar>
      ) : (
        <Navbar className={cn("z-10 border-b border-base-200 px-3", {})}>
          <NavbarStart className="gap-3">
            <Logo />
          </NavbarStart>
          <NavbarCenter></NavbarCenter>
          <NavbarEnd className="gap-1.5">
            <ThemeToggleButton shape="circle" color="ghost" size="sm" />
            <Dropdown vertical="bottom" end>
              <DropdownToggle
                button={false}
                className="hover:bg-base-content/15 w-full h-full btn btn-ghost"
              >
                Account
              </DropdownToggle>
              <DropdownMenu className="mb-8 w-52">
                <DropdownItem onClick={() => navigate(routes.auth.login)}>
                  <p className="text-sm/none my-1 border-base-content/10">
                    Login
                  </p>
                </DropdownItem>
                <hr className="-mx-2 my-1 border-base-content/10" />

                {/* FIXED: Wrap text in the same DropdownItem */}
                <DropdownItem onClick={() => navigate(routes.auth.register)}>
                  {" "}
                  {/* <-- FIXED */}
                  <p className="text-sm/none my-1 border-base-content/10">
                    Create Account
                  </p>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarEnd>
        </Navbar>
      )}
    </>
  );
};

export default Topbar;
