import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@/components/Loader';
import useToast from '@/hooks/use-toast';
import {
  getTemplatesWithAnalysisStatus,
  analyzeTemplate,
  analyzeAllTemplates,
  scanDocument,
} from '@/api/services/contract-analysis-api';
import type {
  TemplateAnalysisSummary,
  DocumentScanResult,
} from '@/types/contract-analysis';
import { getHealthStatus, RiskLevelColors } from '@/types/contract-analysis';

// Score Gauge Component
const ScoreGauge = ({
  score,
  size = 120,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) => {
  const status = getHealthStatus(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-base-300"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={status.color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Score text */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold"
          fill="currentColor"
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && <span className="text-sm text-base-content/70 mt-1">{label}</span>}
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded mt-1"
        style={{ backgroundColor: status.color + '20', color: status.color }}
      >
        {status.label}
      </span>
    </div>
  );
};

// Risk Count Badge
const RiskBadge = ({
  count,
  level,
  label,
}: {
  count: number;
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  label: string;
}) => {
  const colors: Record<string, string> = {
    Critical: '#7f1d1d',
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#22c55e',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: colors[level] }}
      >
        {count}
      </span>
      <span className="text-sm text-base-content/70">{label}</span>
    </div>
  );
};

// Template Card Component
const TemplateCard = ({
  template,
  onAnalyze,
  onViewDetails,
  isAnalyzing,
}: {
  template: TemplateAnalysisSummary;
  onAnalyze: () => void;
  onViewDetails: () => void;
  isAnalyzing: boolean;
}) => {
  const status = template.overallScore !== undefined
    ? getHealthStatus(template.overallScore)
    : null;

  return (
    <div className="card bg-base-100 shadow-md border border-base-300">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-base">{template.templateName}</h3>
            <p className="text-xs text-base-content/60">{template.templateType}</p>
          </div>
          {template.isAnalyzed && status && (
            <ScoreGauge score={template.overallScore!} size={60} />
          )}
        </div>

        {template.isAnalyzed ? (
          <div className="mt-3 space-y-2">
            <div className="flex gap-3 flex-wrap">
              {template.criticalRiskCount! > 0 && (
                <RiskBadge count={template.criticalRiskCount!} level="Critical" label="Critical" />
              )}
              {template.highRiskCount! > 0 && (
                <RiskBadge count={template.highRiskCount!} level="High" label="High" />
              )}
            </div>
            <p className="text-xs text-base-content/50">
              Analyzed on {new Date(template.lastAnalyzedAt!).toLocaleDateString('en-US')}
            </p>
          </div>
        ) : (
          <p className="text-sm text-base-content/60 mt-2">Not analyzed</p>
        )}

        <div className="card-actions justify-end mt-3">
          {template.isAnalyzed && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onViewDetails}
            >
              <span className="iconify lucide--eye size-4"></span>
              Details
            </button>
          )}
          <button
            className={`btn btn-sm ${template.isAnalyzed ? 'btn-outline' : 'btn-primary'}`}
            onClick={onAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <span className="iconify lucide--scan size-4"></span>
            )}
            {template.isAnalyzed ? 'Re-analyze' : 'Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Document Scanner Component
const DocumentScanner = ({
  onScanComplete,
}: {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
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
          <span className="iconify lucide--upload-cloud size-12 text-base-content/30 mx-auto"></span>
          <p className="mt-2 text-sm text-base-content/70">
            Drag a Word file here or
          </p>
          <label className="btn btn-primary btn-sm mt-2">
            <span className="iconify lucide--file-up size-4"></span>
            Browse
            <input
              type="file"
              className="hidden"
              accept=".doc,.docx"
              onChange={handleChange}
            />
          </label>
          <p className="text-xs text-base-content/50 mt-2">
            Supported formats: .docx, .doc
          </p>
        </>
      )}
    </div>
  );
};

// Scan Result Modal
const ScanResultModal = ({
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
          <ScoreGauge score={result.overallScore} size={100} label="Overall Score" />
          <div className="flex-1">
            <p className="text-base-content/80">{result.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <RiskBadge count={result.criticalCount} level="Critical" label="Critical" />
          <RiskBadge count={result.highCount} level="High" label="High" />
          <RiskBadge count={result.mediumCount} level="Medium" label="Medium" />
          <RiskBadge count={result.lowCount} level="Low" label="Low" />
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
            <div className="space-y-2">
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
                  {risk.recommendation && (
                    <p className="text-xs text-primary mt-1">
                      {risk.recommendation}
                    </p>
                  )}
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
};

// Main Dashboard Component
export default function ContractAnalysisDashboard() {
  const navigate = useNavigate();
  const { toaster } = useToast();

  const [templates, setTemplates] = useState<TemplateAnalysisSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingTemplateId, setAnalyzingTemplateId] = useState<number | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await getTemplatesWithAnalysisStatus();
      setTemplates(data);
    } catch (error: any) {
      toaster.error(error.message || 'Error loading templates');
    } finally {
      setIsLoading(false);
    }
  }, [toaster]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleAnalyzeTemplate = async (templateId: number) => {
    setAnalyzingTemplateId(templateId);
    try {
      const result = await analyzeTemplate(templateId);
      if (result.success) {
        toaster.success('Analysis completed successfully');
        loadTemplates();
      } else {
        toaster.error(result.errorMessage || 'Error during analysis');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setAnalyzingTemplateId(null);
    }
  };

  const handleAnalyzeAll = async () => {
    setIsAnalyzingAll(true);
    try {
      await analyzeAllTemplates();
      toaster.success('All templates have been analyzed');
      loadTemplates();
    } catch (error: any) {
      toaster.error(error.message || 'Error during analysis');
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const handleViewDetails = (templateId: number) => {
    navigate(`/dashboard/contract-analysis/template/${templateId}`);
  };

  // Calculate summary stats
  const analyzedCount = templates.filter((t) => t.isAnalyzed).length;
  const avgScore =
    analyzedCount > 0
      ? templates
          .filter((t) => t.isAnalyzed)
          .reduce((sum, t) => sum + (t.overallScore || 0), 0) / analyzedCount
      : 0;
  const totalCritical = templates.reduce((sum, t) => sum + (t.criticalRiskCount || 0), 0);
  const totalHigh = templates.reduce((sum, t) => sum + (t.highRiskCount || 0), 0);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Contract Risk Analysis</h1>
          <p className="text-base-content/60">
            Based on Moon et al. (2022) - Toxic Clauses Classification
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAnalyzeAll}
          disabled={isAnalyzingAll}
        >
          {isAnalyzingAll ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <span className="iconify lucide--scan-search size-5"></span>
          )}
          Analyze All Templates
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Templates Analyzed</p>
                <p className="text-2xl font-bold">
                  {analyzedCount}/{templates.length}
                </p>
              </div>
              <span className="iconify lucide--file-search size-8 text-primary/50"></span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Average Score</p>
                <p className="text-2xl font-bold">{Math.round(avgScore)}/100</p>
              </div>
              <ScoreGauge score={avgScore} size={50} />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">Critical Risks</p>
                <p className="text-2xl font-bold text-error">{totalCritical}</p>
              </div>
              <span className="iconify lucide--alert-octagon size-8 text-error/50"></span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/60">High Risks</p>
                <p className="text-2xl font-bold text-warning">{totalHigh}</p>
              </div>
              <span className="iconify lucide--alert-triangle size-8 text-warning/50"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Scanner */}
      <div className="card bg-base-100 shadow border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">
            <span className="iconify lucide--file-scan size-5"></span>
            Scan a Document
          </h2>
          <p className="text-sm text-base-content/60 mb-4">
            Analyze an external contract (Word file) to identify risk clauses
          </p>
          <DocumentScanner onScanComplete={setScanResult} />
        </div>
      </div>

      {/* Templates Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Contract Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.contractTemplateId}
              template={template}
              onAnalyze={() => handleAnalyzeTemplate(template.contractTemplateId)}
              onViewDetails={() => handleViewDetails(template.contractTemplateId)}
              isAnalyzing={analyzingTemplateId === template.contractTemplateId}
            />
          ))}
        </div>
      </div>

      {/* Risk Categories Legend */}
      <div className="card bg-base-100 shadow border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">
            <span className="iconify lucide--info size-5"></span>
            Risk Categories (Moon et al. 2022)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Payment', desc: 'Payment delays, excessive retentions' },
              { name: 'Role/Responsibility', desc: 'Ambiguous scope, unclear obligations' },
              { name: 'Safety', desc: 'Liability transfer, insurance issues' },
              { name: 'Timeline', desc: 'Unrealistic deadlines, penalties' },
              { name: 'Procedures', desc: 'Complex processes, short deadlines' },
              { name: 'Definitions', desc: 'Vague terms, ambiguities' },
              { name: 'References', desc: 'External documents not provided' },
            ].map((cat) => (
              <div key={cat.name} className="p-3 rounded-lg bg-base-200/50">
                <p className="font-semibold text-sm">{cat.name}</p>
                <p className="text-xs text-base-content/60">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Result Modal */}
      <ScanResultModal result={scanResult} onClose={() => setScanResult(null)} />
    </div>
  );
}
