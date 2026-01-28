import { ISidebarMenuItem } from "./components/SidebarMenuItem";

// Navigation item type with PORTAL-style categories
export type NavCategory = 'overview' | 'project' | 'finance' | 'operations' | 'admin';

export interface INavMenuItem extends Omit<ISidebarMenuItem, 'isTitle'> {
    category: NavCategory;
    activePaths: string[];
    status?: 'completed' | 'active' | 'upcoming';
}

export const dashboardMenuItems: INavMenuItem[] = [
    {
        id: "dashboard",
        icon: "lucide--monitor-dot",
        label: "Dashboard",
        url: "/dashboard",
        category: "overview",
        activePaths: ["/dashboard"],
    },
    {
        id: "dashboard-budget-BOQs",
        icon: "lucide--calculator",
        label: "Budget BOQs",
        url: "/dashboard/budget-BOQs",
        category: "project",
        activePaths: ["/dashboard/budget-BOQs"],
    },
    {
        id: "dashboard-contracts",
        icon: "lucide--file-signature",
        label: "Contracts",
        url: "/dashboard/contracts",
        category: "project",
        activePaths: ["/dashboard/contracts", "/dashboard/subcontractors-boqs", "/dashboard/contracts-database"],
    },
    {
        id: "dashboard-deductions-database",
        icon: "lucide--minus-circle",
        label: "Deductions",
        url: "/dashboard/deductions-database",
        category: "finance",
        activePaths: ["/dashboard/deductions-database"],
    },
    {
        id: "dashboard-IPCs-database",
        icon: "lucide--file-bar-chart",
        label: "IPCs",
        url: "/dashboard/IPCs-database",
        category: "finance",
        activePaths: ["/dashboard/IPCs-database"],
    },
    {
        id: "dashboard-reports",
        icon: "lucide--file-text",
        label: "Reports",
        url: "/dashboard/reports",
        category: "operations",
        activePaths: ["/dashboard/reports"],
    },
    {
        id: "dashboard-contract-analysis",
        icon: "lucide--shield-check",
        label: "Contract Analysis",
        url: "/dashboard/contract-analysis",
        category: "operations",
        activePaths: ["/dashboard/contract-analysis"],
    },
];

export const adminToolsMenuItems: INavMenuItem[] = [
    {
        id: "admin-tools",
        icon: "lucide--settings",
        label: "Admin Tools",
        url: "/admin-tools",
        category: "admin",
        activePaths: ["/admin-tools"],
    },
];

// Section order for PORTAL-style grouped navigation
export const sectionOrder: NavCategory[] = ['overview', 'project', 'finance', 'operations', 'admin'];

// Section display labels
export const sectionLabels: Record<NavCategory, string> = {
    overview: 'Overview',
    project: 'Projects',
    finance: 'Finance',
    operations: 'Operations',
    admin: 'Administration',
};

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
