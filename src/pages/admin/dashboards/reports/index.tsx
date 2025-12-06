import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import SAMTable from "@/components/Table";

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
  const [exportingRowId, setExportingRowId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();

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
    setExportingRowId(String(project.id));
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`https://localhost:7055/api/Reports/ExportKPIReport?projectId=${project.id}`, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      let filename = `KPI-Report-${project.name}.xlsx`;
      const disp = res.headers.get('content-disposition');
      if (disp && disp.indexOf('filename=') !== -1) {
        filename = disp.split('filename=')[1].replace(/['\"]/g, '').split(';')[0];
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    } finally {
      setExportingRowId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToDashboard}
            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
          >
            <span className="iconify lucide--arrow-left size-4"></span>
            <span>Back</span>
          </button>
        </div>
      </div>
      <div>
        <SAMTable
          columns={columns}
          tableData={projects}
          title={"Projects"}
          loading={loading}
          exportingRowId={exportingRowId}
          rowActions={() => ({ exportAction: true })}
          openStaticDialog={(type, row) => {
            if (type === 'Export') handleExport(row);
          }}
          exportAction={true}
          onSuccess={() => {}}
        />
      </div>
    </div>
  );
};

export default Reports;
