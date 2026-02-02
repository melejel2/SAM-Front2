import apiRequest from "../api";

export interface StatusCount {
    status: string;
    count: number;
}

export interface ProjectIpcTotal {
    projectName: string;
    totalAmount: number;
}

export interface DashboardSummary {
    activeProjects: number;
    activeContracts: number;
    openDeductions: number;
    issuedIpcs: number;
    contractsByStatus: StatusCount[];
    topProjectsByIpcValue: ProjectIpcTotal[];
}

export async function getDashboardSummary(token: string): Promise<DashboardSummary | null> {
    try {
        const response = await apiRequest<DashboardSummary>({
            endpoint: "Dashboard/GetDashboardSummary",
            method: "GET",
            token,
        });

        console.log('[dashboard-api] raw response:', response);
        console.log('[dashboard-api] response type:', typeof response);
        console.log('[dashboard-api] response keys:', response ? Object.keys(response) : 'null');

        if (response && typeof response === "object" && "activeProjects" in response) {
            return response;
        }

        console.warn('[dashboard-api] Response did not match expected shape, returning null');
        return null;
    } catch (error) {
        console.error("[dashboard-api] Error fetching dashboard summary:", error);
        return null;
    }
}
