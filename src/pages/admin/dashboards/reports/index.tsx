import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";

import apiRequest from "@/api/api";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";
import { useAuth } from "@/contexts/auth";

import useTrades from "../../adminTools/trades/use-trades";

interface Project {
    id: number;
    code: string;
    name: string;
}

const Reports = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const { getToken } = useAuth();
    const { sheets, getTrades, loading: tradesLoading } = useTrades();
    const [selectedTrade, setSelectedTrade] = useState("");
    const [selectedRow, setSelectedRow] = useState<Project | null>(null);

    const { setLeftContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    useEffect(() => {
        getTrades();
    }, [getTrades]);

    const getProjectsList = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const data = await apiRequest({
                endpoint: "Project/GetProjectsList",
                method: "GET",
                token: token || undefined,
            });
            setProjects(Array.isArray(data) ? data : []);
        } catch (err) {
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        getProjectsList();
    }, [getProjectsList]);

    const handleBackToDashboard = useCallback(() => {
        tryNavigate("/dashboard");
    }, [tryNavigate]);

    // Set topbar content - back button on left
    useEffect(() => {
        setLeftContent(
            <button
                onClick={handleBackToDashboard}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to Dashboard"
            >
                <Icon icon={arrowLeftIcon} className="w-5 h-5" />
            </button>
        );

        return () => {
            clearContent();
        };
    }, [handleBackToDashboard, setLeftContent, clearContent]);

    const handleExport = async (project: Project) => {
        setExportingId(`kpi_${project.id}`);
        try {
            const token = getToken();
            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const res = await fetch(`https://localhost:7055/api/Reports/ExportKPIReport?projectId=${project.id}`, {
                method: "GET",
                credentials: "include",
                headers,
            });
            if (!res.ok) throw new Error("Failed to export");
            const blob = await res.blob();
            let filename = `KPI-Report-${project.name}.xlsx`;
            const disp = res.headers.get("content-disposition");
            if (disp && disp.indexOf("filename=") !== -1) {
                filename = disp.split("filename=")[1].replace(/['"]/g, "").split(";")[0];
            }
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Export failed");
        } finally {
            setExportingId(null);
        }
    };

    const handleExportComp = async (project: Project) => {
        setExportingId(`comp_${project.id}`);
        try {
            const token = getToken();
            const trade = sheets.find((sheet: any) => sheet.id === parseInt(selectedTrade, 10));
            const tradeName = trade ? trade.name : "";
            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const res = await fetch(
                `https://localhost:7055/api/Reports/ExportReportsComp?projectId=${project.id}&tradeName=${tradeName}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers,
                },
            );
            if (!res.ok) throw new Error("Failed to export");
            const blob = await res.blob();
            let filename = `Report-Comp-${project.name}.xlsx`;
            const disp = res.headers.get("content-disposition");
            if (disp && disp.indexOf("filename=") !== -1) {
                filename = disp.split("filename=")[1].replace(/['"]/g, "").split(";")[0];
            }
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Export failed");
        } finally {
            setExportingId(null);
        }
    };

    const handleExportProgress = async (project: Project) => {
        setExportingId(`progress_${project.id}`);
        try {
            const token = getToken();
            const trade = sheets.find((sheet: any) => sheet.id === parseInt(selectedTrade, 10));
            const tradeName = trade ? trade.name : "";
            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const res = await fetch(
                `https://localhost:7055/api/Reports/ExportReportsCompProgress?projectId=${project.id}&tradeName=${tradeName}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers,
                },
            );
            if (!res.ok) throw new Error("Failed to export");
            const blob = await res.blob();
            let filename = `Report-Progress-${project.name}.xlsx`;
            const disp = res.headers.get("content-disposition");
            if (disp && disp.indexOf("filename=") !== -1) {
                filename = disp.split("filename=")[1].replace(/['"]/g, "").split(";")[0];
            }
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Export failed");
        } finally {
            setExportingId(null);
        }
    };

    // Handle row selection from Spreadsheet
    const handleSelectionChange = useCallback((_cell: any, row?: Project | null) => {
        setSelectedRow(row ?? null);
    }, []);

    // Define spreadsheet columns
    const spreadsheetColumns = useMemo((): SpreadsheetColumn<Project>[] => [
        {
            key: "code",
            label: "Code",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "name",
            label: "Project Name",
            width: 400,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Toolbar with trade selector and export buttons
    const toolbar = useMemo(() => (
        <div className="flex items-center gap-3">
            {/* Trade selector */}
            <select
                className="select select-bordered select-sm max-w-xs"
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                disabled={tradesLoading}
            >
                <option disabled value="">
                    {tradesLoading ? "Loading trades..." : "Select a trade"}
                </option>
                {sheets.map((sheet: any) => (
                    <option key={sheet.id} value={sheet.id}>
                        {sheet.name}
                    </option>
                ))}
            </select>

            {/* Export buttons */}
            <button
                className="btn btn-sm btn-primary"
                onClick={() => selectedRow && handleExport(selectedRow)}
                disabled={!selectedRow || !!exportingId}
            >
                {exportingId === `kpi_${selectedRow?.id}` ? "Exporting..." : "KPI"}
            </button>
            <button
                className="btn btn-sm btn-primary"
                onClick={() => selectedRow && handleExportComp(selectedRow)}
                disabled={!selectedRow || !selectedTrade || !!exportingId}
            >
                {exportingId === `comp_${selectedRow?.id}` ? "Exporting..." : "Budget Vs Contract"}
            </button>
            <button
                className="btn btn-sm btn-primary"
                onClick={() => selectedRow && handleExportProgress(selectedRow)}
                disabled={!selectedRow || !selectedTrade || !!exportingId}
            >
                {exportingId === `progress_${selectedRow?.id}` ? "Exporting..." : "Budget Vs Progress"}
            </button>
        </div>
    ), [selectedTrade, tradesLoading, sheets, selectedRow, exportingId]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
                <Spreadsheet<Project>
                    data={projects}
                    columns={spreadsheetColumns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No projects found"
                    persistKey="reports-spreadsheet"
                    rowHeight={40}
                    toolbar={toolbar}
                    onSelectionChange={handleSelectionChange}
                    getRowId={(row) => row.id}
                    allowKeyboardNavigation
                    allowColumnResize
                    allowSorting
                    allowFilters
                />
            </div>
        </div>
    );
};

export default Reports;
