import activity from "@iconify/icons-lucide/activity";
import mapPin from "@iconify/icons-lucide/map-pin";
import briefcase from "@iconify/icons-lucide/briefcase";
import usersIcon from "@iconify/icons-lucide/users";
import routes from "@/services/routes";
import { IMenuItem } from "@/types/layout/admin";

export const dashboardMenuItems: IMenuItem[] = [
  {
    key: "dashboard",
    icon: activity,
    label: "Dashboard",
    url: routes.dashboard.index,
  },
];

export const adminToolsMenuItems: IMenuItem[] = [
  {
    key: "administration",
    label: "Administration",
    icon: briefcase,
    isTitle: true,
  },

  {
    key: "users",
    icon: usersIcon,
    label: "Users",
    url: routes.adminTools.users.index,
  },
];

export const mobileDashboardMenuItems: IMenuItem[] = [
  {
    key: "dashboard",
    icon: activity,
    label: "Dashboard",
    url: routes.dashboard.index,
  },
  {
    key: "transactions",
    label: "Transactions",
    icon: briefcase,
    isTitle: true,
    children: [],
  },
];

export const mobileAdminToolsMenuItems: IMenuItem[] = [
  {
    key: "administration",
    label: "Administration",
    icon: briefcase,
    isTitle: true,
    children: [],
  },
  {
    key: "branch-management",
    icon: mapPin,
    label: "Branch Management",
    isTitle: true,
    children: [
      {
        key: "users",
        icon: usersIcon,
        label: "Users",
        url: routes.adminTools.users.index,
      },
    ],
  },
];
