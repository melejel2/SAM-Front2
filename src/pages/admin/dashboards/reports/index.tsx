import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import apiRequest from "@/api/api";
import SAMTable from "@/components/Table";
import { useAuth } from "@/contexts/auth";

import useTrades from "../../adminTools/trades/use-trades";

const columns = {
    code: "Code",
    name: "Project Name",
};

interface Project {
    id: number;
    code: string;
    name: string;
}

const Reports = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { sheets, getTrades, loading: tradesLoading } = useTrades();
    const [selectedTrade, setSelectedTrade] = useState("");
    const [selectedRow, setSelectedRow] = useState<Project | null>(null);

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
        navigate("/dashboard");
    }, [navigate]);

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

    const tableHeaderContent = (
        <div className="flex items-center gap-3 flex-1">
            {/* Back button on far left */}
            <button
                onClick={handleBackToDashboard}
                className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                <span className="iconify lucide--arrow-left size-4"></span>
                <span>Back</span>
            </button>

            {/* Trade filter CENTERED */}
            <div className="flex-1 flex justify-center">
                <select
                    className="select select-bordered select-sm max-w-xs"
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    disabled={tradesLoading}>
                    <option disabled value="">
                        {tradesLoading ? "Loading trades..." : "Select a trade"}
                    </option>
                    {sheets.map((sheet: any) => (
                        <option key={sheet.id} value={sheet.id}>
                            {sheet.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Export buttons on far right */}
            <div className="flex items-center gap-2">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => selectedRow && handleExport(selectedRow)}
                    disabled={!selectedRow || !!exportingId}>
                    {exportingId === `kpi_${selectedRow?.id}` ? "Exporting..." : "KPI"}
                </button>
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => selectedRow && handleExportComp(selectedRow)}
                    disabled={!selectedRow || !selectedTrade || !!exportingId}>
                    {exportingId === `comp_${selectedRow?.id}` ? "Exporting..." : "Budget Vs Contract"}
                </button>
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => selectedRow && handleExportProgress(selectedRow)}
                    disabled={!selectedRow || !selectedTrade || !!exportingId}>
                    {exportingId === `progress_${selectedRow?.id}` ? "Exporting..." : "Budget Vs Progress"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden -mt-6">
            <div className="flex-1 min-h-0">
                <SAMTable
                    columns={columns}
                    tableData={projects}
                    title={"Projects"}
                    loading={loading}
                    exportingRowId={exportingId}
                    customHeaderContent={tableHeaderContent}
                    rowActions={() => ({ exportAction: false })}
                    onRowSelect={setSelectedRow}
                    selectedRowId={selectedRow?.id}
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default Reports;
