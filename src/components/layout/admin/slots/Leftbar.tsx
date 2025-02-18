import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.css";

import { Menu, MenuDetails, MenuItem, MenuTitle } from "@/components/daisyui";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { getActivatedLeftbarParentKeys } from "@/helpers/layout/admin/leftbar";
import { cn } from "@/helpers/utils/cn";
import { IMenuItem } from "@/types/layout/admin";

const LeftMenuItem = ({
  menuItem,
  activated,
  isAdmin,
}: {
  menuItem: IMenuItem;
  activated: Set<string>;
  isAdmin: boolean;
}) => {
  const { icon, isTitle, label, children, url } = menuItem;

  const selected = activated.has(menuItem.key);

  if (isTitle) {
    return <MenuTitle className="font-semibold">{label}</MenuTitle>;
  }

  if (!children) {
    return (
      <MenuItem className="mb-0.5">
        <Link
          to={url ?? ""}
          className={cn("hover:bg-base-content/15", {
            "bg-base-content/10": selected,
          })}
        >
          <div className="flex items-center gap-2">
            {icon && <Icon icon={icon} fontSize={18} />}
            {label}
          </div>
        </Link>
      </MenuItem>
    );
  }

  return (
    <MenuItem className="mb-0.5">
      <MenuDetails
        open={true}
        label={
          <div className="flex items-center gap-2">
            {icon && <Icon icon={icon} fontSize={18} />}
            {label}
          </div>
        }
      >
        {children.map((item) => (
          <LeftMenuItem
            menuItem={item}
            key={item.key}
            activated={activated}
            isAdmin={isAdmin}
          />
        ))}
      </MenuDetails>
    </MenuItem>
  );
};

const Leftbar = ({
  hide,
  menuItems,
}: {
  hide?: boolean;
  menuItems: IMenuItem[];
}) => {
  const { pathname } = useLocation();
  const isAdmin = true;

  const activatedParents = useMemo(
    () => new Set(getActivatedLeftbarParentKeys(menuItems, pathname)),
    [pathname, menuItems]
  );

  return (
    <div
      className={cn("leftmenu-wrapper", {
        hide: hide,
      })}
    >
      <div className="flex h-16 items-center justify-center">
        <Logo />
      </div>
      <SimpleBar className="h-full">
        <Menu className="mb-6">
          {menuItems.map((item) => (
            <LeftMenuItem
              menuItem={item}
              key={item.key}
              activated={activatedParents}
              isAdmin={isAdmin}
            />
          ))}
        </Menu>
      </SimpleBar>
    </div>
  );
};

export default Leftbar;
