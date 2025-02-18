import { Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { Drawer } from "@/components/daisyui";

import Leftbar from "@/components/layout/admin/slots/Leftbar";
import Topbar from "@/components/layout/admin/slots/Topbar";
import {
  adminToolsMenuItems,
  dashboardMenuItems,
  mobileAdminToolsMenuItems,
  mobileDashboardMenuItems,
} from "@/data/layout/admin";
import { useLayoutContext } from "@/states/layout";
import { IMenuItem } from "@/types/layout/admin";

const AdminLayout = ({ children }: { children: any }) => {
  const {
    state: { leftbar },
    toggleLeftbarDrawer,
  } = useLayoutContext();

  const [activeMenuItems, setActiveMenuItems] = useState<IMenuItem[]>([]);
  const [mobileActiveMenuItems, setMobileActiveMenuItems] = useState<
    IMenuItem[]
  >([]);

  const { pathname } = useLocation();

  useEffect(() => {
    toggleLeftbarDrawer(false);
    setActiveMenuItems(
      leftbar.dashboard ? dashboardMenuItems : adminToolsMenuItems
    );

    setMobileActiveMenuItems(
      leftbar.dashboard ? mobileDashboardMenuItems : mobileAdminToolsMenuItems
    );
  }, [pathname, leftbar.dashboard]);

  return (
    <>
      {
        <div className="size-full">
          <div className="flex overflow-hidden">
            <div className="block lg:hidden">
              <Drawer
                open={leftbar.drawerOpen}
                onClickOverlay={() => toggleLeftbarDrawer(false)}
                className={`z-20 `}
                side={<Leftbar menuItems={activeMenuItems} />}
              ></Drawer>
            </div>
            <div className="hidden lg:block">
              <Leftbar menuItems={activeMenuItems} hide={leftbar.hide} />
            </div>
            <div className="main-wrapper overflow-auto">
              <div className="flex h-full flex-col ">
                <Topbar menuItems={mobileActiveMenuItems} />
                <div className="content-wrapper">
                  <Suspense>{children}</Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </>
  );
};

export default AdminLayout;
