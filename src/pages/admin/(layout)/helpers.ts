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
        icon: "lucide--calculator",
        label: "Budget BOQs",
        url: "/dashboard/budget-BOQs",
    },
    {
        id: "dashboard-subcontractors-BOQs",
        icon: "lucide--hard-hat",
        label: "Subcontractors BOQs",
        url: "/dashboard/subcontractors-boqs",
    },
    {
        id: "dashboard-contracts-database",
        icon: "lucide--file-signature",
        label: "Contracts Database",
        url: "/dashboard/contracts-database",
    },
    {
        id: "dashboard-deductions-database",
        icon: "lucide--minus-circle",
        label: "Deductions Database",
        url: "/dashboard/deductions-database",
    },
    {
        id: "dashboard-IPCs-database",
        icon: "lucide--file-bar-chart",
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
        icon: "lucide--settings",
        label: "Admin Tools",
        url: "/admin-tools",
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
