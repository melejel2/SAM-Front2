import { ISidebarMenuItem } from "./components/SidebarMenuItem";

export const dashboardMenuItems: ISidebarMenuItem[] = [
    {
        id: "dashboard",
        icon: "lucide--monitor-dot",
        label: "Dashboard",
        url: "/dashboard",
    },
    {
        id: "dashboard-budget-BOQs",
        icon: "lucide--hard-drive",
        label: "Budget BOQs",
        url: "/dashboard/budget-BOQs",
    },
    {
        id: "dashboard-contracts-database",
        icon: "lucide--archive",
        label: "Contracts Database",
        url: "/dashboard/contracts-database",
    },
    {
        id: "dashboard-deductions-database",
        icon: "lucide--truck",
        label: "Deductions Database",
        url: "/dashboard/deductions-database",
    },
    {
        id: "dashboard-IPCs-database",
        icon: "lucide--database",
        label: "IPCs Database",
        url: "/dashboard/IPCs-database",
    },
    {
        id: "dashboard-reports",
        icon: "lucide--file-text",
        label: "Reports",
        url: "/dashboard/reports",
    },
];

export const adminToolsMenuItems: ISidebarMenuItem[] = [
    {
        id: "admin-tools",
        label: "Admin Tools",
        isTitle: true,
    },
    {
        id: "admin-tools-connection",
        icon: "lucide--server",
        label: "Connection",
        url: "/admin-tools/connection",
    },
    {
        id: "admin-tools-currencies",
        icon: "lucide--dollar-sign",
        label: "Currencies",
        url: "/admin-tools/currencies",
    },
    {
        id: "admin-tools-units",
        icon: "lucide--pencil-ruler",
        label: "Units",
        url: "/admin-tools/units",
    },
    {
        id: "admin-tools-users",
        icon: "lucide--users",
        label: "Users",
        url: "/admin-tools/users",
    },
    {
        id: "admin-tools-trades",
        icon: "lucide--list",
        label: "Trades",
        url: "/admin-tools/trades",
    },
    {
        id: "admin-tools-cost-codes",
        icon: "lucide--cloud-rain",
        label: "Cost Codes",
        url: "/admin-tools/cost-codes",
    },
    {
        id: "admin-tools-templates",
        label: "Templates",
        isTitle: true,
    },
    {
        id: "admin-tools-templates-contract",
        icon: "lucide--layout",
        label: "Contract",
        url: "/admin-tools/templates/contract",
    },
    {
        id: "admin-tools-templates-vo",
        icon: "lucide--layout",
        label: "VO",
        url: "/admin-tools/templates/VO",
    },
    {
        id: "admin-tools-templates-terminate",
        icon: "lucide--layout",
        label: "Terminate",
        url: "/admin-tools/templates/terminate",
    },
    {
        id: "admin-tools-templates-decharge",
        icon: "lucide--layout",
        label: "Decharge",
        url: "/admin-tools/templates/decharge",
    },
];

const findItem = (menuItems: ISidebarMenuItem[], url: string): ISidebarMenuItem | null => {
    for (const item of menuItems) {
        if (item.url == url) {
            return item;
        }
        if (item.children) {
            const fItem = findItem(item.children, url);
            if (fItem) {
                return fItem;
            }
        }
    }
    return null;
};

export const getActivatedItemParentKeys = (menuItems: ISidebarMenuItem[], url: string): string[] => {
    const menuItem = findItem(menuItems, url);

    if (!menuItem) return [];
    const list = [];

    for (const item of menuItems) {
        if (item.id == menuItem.id) {
            list.push(item.id);
        }
        if (item.children) {
            for (const iItem of item.children) {
                if (iItem.id == menuItem.id) {
                    list.push(item.id);
                    list.push(iItem.id);
                }
                if (iItem.children != null) {
                    for (const i2Item of iItem.children) {
                        if (i2Item.id == menuItem.id) {
                            list.push(item.id);
                            list.push(iItem.id);
                            list.push(i2Item.id);
                        }
                    }
                }
            }
        }
    }
    return list;
};
