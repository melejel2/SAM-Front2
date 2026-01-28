import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Spreadsheet } from '@/components/Spreadsheet';
import type { SpreadsheetColumn } from '@/components/Spreadsheet';
import { useTopbarContent } from '@/contexts/topbar-content';
import useToast from '@/hooks/use-toast';
import {
  getTemplatesWithAnalysisStatus,
  getContractsWithAnalysisStatus,
  analyzeTemplate,
  analyzeContract,
  analyzeAllTemplates,
  scanDocument,
} from '@/api/services/contract-analysis-api';
import type {
  TemplateAnalysisSummary,
  ContractAnalysisSummary,
  DocumentScanResult,
} from '@/types/contract-analysis';
import { getHealthStatus, RiskLevelColors } from '@/types/contract-analysis';

// Icons
import arrowLeftIcon from '@iconify/icons-lucide/arrow-left';
import fileTextIcon from '@iconify/icons-lucide/file-text';
import fileCheckIcon from '@iconify/icons-lucide/file-check';
import scanIcon from '@iconify/icons-lucide/scan';
import eyeIcon from '@iconify/icons-lucide/eye';
import refreshCwIcon from '@iconify/icons-lucide/refresh-cw';
import playIcon from '@iconify/icons-lucide/play';
import uploadCloudIcon from '@iconify/icons-lucide/upload-cloud';

type TabType = 'templates' | 'contracts';

// Score Badge Component
const ScoreBadge = memo(({ score }: { score?: number }) => {
  if (score === undefined) return <span className="text-base-content/50">-</span>;
  const status = getHealthStatus(score);
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: status.color + '20', color: status.color }}
    >
      {Math.round(score)}
    </span>
  );
});
ScoreBadge.displayName = 'ScoreBadge';

// Risk Count Badge
const RiskCountBadge = memo(({ count, level }: { count?: number; level: 'critical' | 'high' }) => {
  if (!count) return <span className="text-base-content/50">0</span>;
  const color = level === 'critical' ? '#7f1d1d' : '#ef4444';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {count}
    </span>
  );
});
RiskCountBadge.displayName = 'RiskCountBadge';

// Document Scanner Modal
const DocumentScannerModal = memo(({
  isOpen,
  onClose,
  onScanComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (result: DocumentScanResult) => void;
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toaster } = useToast();

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toaster.error('Unsupported format. Please use a Word file (.docx)');
      return;
    }

    setIsScanning(true);
    try {
      const result = await scanDocument(file);
      onScanComplete(result);
      toaster.success('Analysis complete');
      onClose();
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Scan Document</h3>
        <p className="text-sm text-base-content/60 mb-4">
          Upload a Word document to analyze for risk clauses
        </p>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-base-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {isScanning ? (
            <div className="flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/70">Analyzing...</p>
            </div>
          ) : (
            <>
              <Icon icon={uploadCloudIcon} className="size-12 text-base-content/30 mx-auto" />
              <p className="mt-2 text-sm text-base-content/70">
                Drag a Word file here or
              </p>
              <label className="btn btn-primary btn-sm mt-2">
                Browse
                <input
                  type="file"
                  className="hidden"
                  accept=".doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              <p className="text-xs text-base-content/50 mt-2">
                Supported formats: .docx, .doc
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
DocumentScannerModal.displayName = 'DocumentScannerModal';

// Scan Result Modal
const ScanResultModal = memo(({
  result,
  onClose,
}: {
  result: DocumentScanResult | null;
  onClose: () => void;
}) => {
  if (!result) return null;

  const status = getHealthStatus(result.overallScore);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Analysis Results</h3>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: status.color }}
            >
              {Math.round(result.overallScore)}
            </div>
            <span className="text-sm mt-1">{status.label}</span>
          </div>
          <div className="flex-1">
            <p className="text-base-content/80">{result.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <span className="text-2xl font-bold text-error">{result.criticalCount}</span>
            <p className="text-xs text-base-content/60">Critical</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-warning">{result.highCount}</span>
            <p className="text-xs text-base-content/60">High</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-info">{result.mediumCount}</span>
            <p className="text-xs text-base-content/60">Medium</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-success">{result.lowCount}</span>
            <p className="text-xs text-base-content/60">Low</p>
          </div>
        </div>

        {result.recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
              {result.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {result.topRisks.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Top Risks</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.topRisks.slice(0, 5).map((risk, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-base-300 bg-base-200/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: RiskLevelColors[risk.level as keyof typeof RiskLevelColors] || '#6b7280' }}
                    >
                      {risk.level}
                    </span>
                    <span className="text-xs text-base-content/60">
                      {risk.category}
                    </span>
                  </div>
                  <p className="text-sm">{risk.riskDescription}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
ScanResultModal.displayName = 'ScanResultModal';

// Main Component
const ContractAnalysisDashboard = memo(() => {
  const navigate = useNavigate();
  const { setLeftContent, setCenterContent, clearContent } = useTopbarContent();
  const { toaster } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<TemplateAnalysisSummary[]>([]);
  const [contracts, setContracts] = useState<ContractAnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'templates') {
        const data = await getTemplatesWithAnalysisStatus();
        setTemplates(data);
      } else {
        const data = await getContractsWithAnalysisStatus();
        setContracts(data);
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toaster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Topbar setup
  useEffect(() => {
    setLeftContent(
      <button
        onClick={handleBackToDashboard}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
        title="Back to Dashboard"
      >
        <Icon icon={arrowLeftIcon} className="size-5" />
      </button>
    );

    setCenterContent(
      <div className="flex items-center gap-2">
        <button
          className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
            activeTab === 'templates'
              ? 'btn-primary'
              : 'btn-ghost border border-base-300 hover:border-primary/50'
          }`}
          onClick={() => handleTabChange('templates')}
        >
          <Icon icon={fileTextIcon} className="size-4" />
          <span>Templates ({templates.length})</span>
        </button>

        <button
          className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
            activeTab === 'contracts'
              ? 'btn-primary'
              : 'btn-ghost border border-base-300 hover:border-primary/50'
          }`}
          onClick={() => handleTabChange('contracts')}
        >
          <Icon icon={fileCheckIcon} className="size-4" />
          <span>Contracts ({contracts.length})</span>
        </button>
      </div>
    );

    return () => {
      clearContent();
    };
  }, [activeTab, templates.length, contracts.length, handleBackToDashboard, handleTabChange, setLeftContent, setCenterContent, clearContent]);

  // Template actions
  const handleAnalyzeTemplate = useCallback(async (templateId: number) => {
    setAnalyzingId(templateId);
    try {
      const result = await analyzeTemplate(templateId);
      if (result.success) {
        toaster.success('Analysis completed');
        loadData();
      } else {
        toaster.error(result.errorMessage || 'Error during analysis');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingId(null);
    }
  }, [loadData, toaster]);

  const handleAnalyzeAllTemplates = useCallback(async () => {
    setIsAnalyzingAll(true);
    try {
      await analyzeAllTemplates();
      toaster.success('All templates analyzed');
      loadData();
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setIsAnalyzingAll(false);
    }
  }, [loadData, toaster]);

  const handleViewTemplateDetails = useCallback((templateId: number) => {
    navigate(`/dashboard/contract-analysis/template/${templateId}`);
  }, [navigate]);

  // Contract actions
  const handleAnalyzeContract = useCallback(async (contractId: number) => {
    setAnalyzingId(contractId);
    try {
      const result = await analyzeContract(contractId);
      if (result.success) {
        toaster.success('Analysis completed');
        loadData();
      } else {
        toaster.error(result.errorMessage || 'Error during analysis');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingId(null);
    }
  }, [loadData, toaster]);

  const handleViewContractDetails = useCallback((contractId: number) => {
    navigate(`/dashboard/contract-analysis/contract/${contractId}`);
  }, [navigate]);

  // Template columns
  const templateColumns = useMemo((): SpreadsheetColumn<TemplateAnalysisSummary>[] => [
    {
      key: 'templateName',
      label: 'Template Name',
      width: 250,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'templateType',
      label: 'Type',
      width: 120,
      align: 'center',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'overallScore',
      label: 'Score',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <ScoreBadge score={value} />,
    },
    {
      key: 'criticalRiskCount',
      label: 'Critical',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="critical" />,
    },
    {
      key: 'highRiskCount',
      label: 'High',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="high" />,
    },
    {
      key: 'isAnalyzed',
      label: 'Status',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => (
        <span className={`badge badge-sm ${value ? 'badge-success' : 'badge-ghost'}`}>
          {value ? 'Analyzed' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'lastAnalyzedAt',
      label: 'Last Analyzed',
      width: 130,
      align: 'center',
      editable: false,
      sortable: true,
      formatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ], []);

  // Contract columns
  const contractColumns = useMemo((): SpreadsheetColumn<ContractAnalysisSummary>[] => [
    {
      key: 'contractNumber',
      label: 'Contract #',
      width: 130,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'projectName',
      label: 'Project',
      width: 180,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'subcontractorName',
      label: 'Subcontractor',
      width: 180,
      align: 'left',
      editable: false,
      sortable: true,
      filterable: true,
    },
    {
      key: 'overallScore',
      label: 'Score',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <ScoreBadge score={value} />,
    },
    {
      key: 'criticalRiskCount',
      label: 'Critical',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="critical" />,
    },
    {
      key: 'highRiskCount',
      label: 'High',
      width: 80,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => <RiskCountBadge count={value} level="high" />,
    },
    {
      key: 'isAnalyzed',
      label: 'Status',
      width: 100,
      align: 'center',
      editable: false,
      sortable: true,
      render: (value) => (
        <span className={`badge badge-sm ${value ? 'badge-success' : 'badge-ghost'}`}>
          {value ? 'Analyzed' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'lastAnalyzedAt',
      label: 'Last Analyzed',
      width: 130,
      align: 'center',
      editable: false,
      sortable: true,
      formatter: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ], []);

  // Render actions for templates
  const renderTemplateActions = useCallback((row: TemplateAnalysisSummary) => (
    <div className="flex items-center gap-1">
      {row.isAnalyzed && (
        <button
          className="btn btn-ghost btn-xs text-info hover:bg-info/20"
          onClick={(e) => {
            e.stopPropagation();
            handleViewTemplateDetails(row.contractTemplateId);
          }}
          title="View Details"
        >
          <Icon icon={eyeIcon} className="w-4 h-4" />
        </button>
      )}
      <button
        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          handleAnalyzeTemplate(row.contractTemplateId);
        }}
        disabled={analyzingId === row.contractTemplateId}
        title={row.isAnalyzed ? 'Re-analyze' : 'Analyze'}
      >
        {analyzingId === row.contractTemplateId ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Icon icon={row.isAnalyzed ? refreshCwIcon : playIcon} className="w-4 h-4" />
        )}
      </button>
    </div>
  ), [analyzingId, handleAnalyzeTemplate, handleViewTemplateDetails]);

  // Render actions for contracts
  const renderContractActions = useCallback((row: ContractAnalysisSummary) => (
    <div className="flex items-center gap-1">
      {row.isAnalyzed && (
        <button
          className="btn btn-ghost btn-xs text-info hover:bg-info/20"
          onClick={(e) => {
            e.stopPropagation();
            handleViewContractDetails(row.contractDatasetId);
          }}
          title="View Details"
        >
          <Icon icon={eyeIcon} className="w-4 h-4" />
        </button>
      )}
      <button
        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          handleAnalyzeContract(row.contractDatasetId);
        }}
        disabled={analyzingId === row.contractDatasetId}
        title={row.isAnalyzed ? 'Re-analyze' : 'Analyze'}
      >
        {analyzingId === row.contractDatasetId ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <Icon icon={row.isAnalyzed ? refreshCwIcon : playIcon} className="w-4 h-4" />
        )}
      </button>
    </div>
  ), [analyzingId, handleAnalyzeContract, handleViewContractDetails]);

  // Toolbar
  const toolbar = useMemo(() => (
    <div className="flex items-center justify-end gap-2 w-full px-4 py-2">
      <button
        className="btn btn-sm btn-outline"
        onClick={() => setShowScanModal(true)}
      >
        <Icon icon={scanIcon} className="size-4" />
        Scan Document
      </button>
      {activeTab === 'templates' && (
        <button
          className="btn btn-sm btn-primary"
          onClick={handleAnalyzeAllTemplates}
          disabled={isAnalyzingAll}
        >
          {isAnalyzingAll ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Icon icon={playIcon} className="size-4" />
          )}
          Analyze All
        </button>
      )}
    </div>
  ), [activeTab, handleAnalyzeAllTemplates, isAnalyzingAll]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        {activeTab === 'templates' ? (
          <Spreadsheet<TemplateAnalysisSummary>
            data={templates}
            columns={templateColumns}
            mode="view"
            loading={isLoading}
            emptyMessage="No templates found"
            persistKey="contract-analysis-templates"
            rowHeight={40}
            actionsRender={renderTemplateActions}
            actionsColumnWidth={100}
            onRowDoubleClick={(row) => row.isAnalyzed && handleViewTemplateDetails(row.contractTemplateId)}
            getRowId={(row) => row.contractTemplateId}
            toolbar={toolbar}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
          />
        ) : (
          <Spreadsheet<ContractAnalysisSummary>
            data={contracts}
            columns={contractColumns}
            mode="view"
            loading={isLoading}
            emptyMessage="No contracts found"
            persistKey="contract-analysis-contracts"
            rowHeight={40}
            actionsRender={renderContractActions}
            actionsColumnWidth={100}
            onRowDoubleClick={(row) => row.isAnalyzed && handleViewContractDetails(row.contractDatasetId)}
            getRowId={(row) => row.contractDatasetId}
            toolbar={toolbar}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
          />
        )}
      </div>

      <DocumentScannerModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onScanComplete={setScanResult}
      />

      <ScanResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
      />
    </div>
  );
});

ContractAnalysisDashboard.displayName = 'ContractAnalysisDashboard';

export default ContractAnalysisDashboard;
