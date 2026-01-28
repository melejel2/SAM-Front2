import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Loader } from '@/components/Loader';
import { useTopbarContent } from '@/contexts/topbar-content';
import useToast from '@/hooks/use-toast';
import {
  getTemplateProfile,
  getTemplateClauses,
  analyzeTemplate,
} from '@/api/services/contract-analysis-api';
import type {
  TemplateRiskProfile,
  ContractClause,
} from '@/types/contract-analysis';
import {
  getHealthStatus,
  RiskLevelColors,
} from '@/types/contract-analysis';

// Icons
import arrowLeftIcon from '@iconify/icons-lucide/arrow-left';
import refreshCwIcon from '@iconify/icons-lucide/refresh-cw';
import alertTriangleIcon from '@iconify/icons-lucide/alert-triangle';
import checkCircleIcon from '@iconify/icons-lucide/check-circle';
import chevronDownIcon from '@iconify/icons-lucide/chevron-down';

// Risk level filter options
const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'risky', label: 'With Risks' },
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

// Score Ring Component - cleaner circular progress
const ScoreRing = ({ score, size = 160 }: { score: number; size?: number }) => {
  const status = getHealthStatus(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-base-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={status.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{Math.round(score)}</span>
        <span
          className="text-sm font-medium px-2 py-0.5 rounded-full mt-1"
          style={{ backgroundColor: status.color + '15', color: status.color }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
    {icon && (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color + '20' }}
      >
        {icon}
      </div>
    )}
    <div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-base-content/60">{label}</div>
    </div>
  </div>
);

// Category Progress Component
const CategoryProgress = ({
  label,
  score,
}: {
  label: string;
  score: number;
}) => {
  const status = getHealthStatus(score);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: status.color }}
        />
      </div>
      <span className="text-sm font-medium w-12 text-right" style={{ color: status.color }}>
        {Math.round(score)}
      </span>
    </div>
  );
};

// Clause Item Component - simpler design
const ClauseItem = ({
  clause,
  isExpanded,
  onToggle,
}: {
  clause: ContractClause;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const hasRisks = clause.riskAssessments.length > 0;
  const riskCount = clause.riskAssessments.length;
  const highestRisk = hasRisks
    ? clause.riskAssessments.reduce((max, r) => (r.score > max.score ? r : max))
    : null;

  return (
    <div className={`border rounded-lg transition-all ${hasRisks ? 'border-warning/40 bg-warning/5' : 'border-base-200'}`}>
      <button
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {hasRisks ? (
            <Icon icon={alertTriangleIcon} className="size-5 text-warning" />
          ) : (
            <Icon icon={checkCircleIcon} className="size-5 text-success" />
          )}
          <div>
            <span className="font-medium">
              {clause.clauseNumber || `Clause ${clause.clauseOrder}`}
            </span>
            {clause.clauseTitle && (
              <span className="text-base-content/60 ml-2 text-sm">
                {clause.clauseTitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRisks && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{
                backgroundColor: RiskLevelColors[highestRisk!.level as keyof typeof RiskLevelColors] || '#6b7280',
              }}
            >
              {riskCount} {riskCount === 1 ? 'risk' : 'risks'}
            </span>
          )}
          <Icon
            icon={chevronDownIcon}
            className={`size-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Content Preview */}
          {clause.clauseContent && (
            <div className="p-3 bg-base-100 rounded-lg text-sm text-base-content/80 max-h-32 overflow-y-auto">
              {clause.clauseContent.substring(0, 400)}
              {clause.clauseContent.length > 400 && '...'}
            </div>
          )}

          {/* Risks */}
          {hasRisks && (
            <div className="space-y-2">
              {clause.riskAssessments.map((risk, i) => (
                <div key={i} className="p-3 bg-base-100 rounded-lg border border-base-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{
                        backgroundColor: RiskLevelColors[risk.level as keyof typeof RiskLevelColors] || '#6b7280',
                      }}
                    >
                      {risk.level}
                    </span>
                    <span className="text-xs text-base-content/60">{risk.category}</span>
                  </div>
                  {risk.riskDescription && (
                    <p className="text-sm">{risk.riskDescription}</p>
                  )}
                  {risk.matchedText && (
                    <div className="mt-2 p-2 bg-warning/10 rounded text-xs italic border-l-2 border-warning">
                      "{risk.matchedText}"
                    </div>
                  )}
                  {risk.recommendation && (
                    <p className="mt-2 text-xs text-primary">{risk.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function TemplateDetailsPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { setLeftContent, setRightContent, clearContent } = useTopbarContent();
  const { toaster } = useToast();

  const [profile, setProfile] = useState<TemplateRiskProfile | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [expandedClause, setExpandedClause] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!templateId) return;
    try {
      const [profileData, clausesData] = await Promise.all([
        getTemplateProfile(parseInt(templateId)),
        getTemplateClauses(parseInt(templateId)),
      ]);
      setProfile(profileData);
      setClauses(clausesData);
    } catch (error: any) {
      toaster.error(error.message || 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [templateId, toaster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReanalyze = useCallback(async () => {
    if (!templateId) return;
    setIsReanalyzing(true);
    try {
      const result = await analyzeTemplate(parseInt(templateId));
      if (result.success) {
        toaster.success('Analysis complete');
        loadData();
      } else {
        toaster.error(result.errorMessage || 'Error');
      }
    } catch (error: any) {
      toaster.error(error.message || 'Error');
    } finally {
      setIsReanalyzing(false);
    }
  }, [templateId, loadData, toaster]);

  const handleBack = useCallback(() => {
    navigate('/dashboard/contract-analysis');
  }, [navigate]);

  // Topbar setup
  useEffect(() => {
    setLeftContent(
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
        >
          <Icon icon={arrowLeftIcon} className="size-5" />
        </button>
        <span className="font-semibold text-lg">
          {profile?.templateName || 'Template Analysis'}
        </span>
      </div>
    );

    setRightContent(
      <button
        className="btn btn-sm btn-outline"
        onClick={handleReanalyze}
        disabled={isReanalyzing}
      >
        {isReanalyzing ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <Icon icon={refreshCwIcon} className="size-4" />
        )}
        Re-analyze
      </button>
    );

    return () => clearContent();
  }, [handleBack, handleReanalyze, isReanalyzing, profile?.templateName, setLeftContent, setRightContent, clearContent]);

  // Filter clauses
  const filteredClauses = useMemo(() => {
    return clauses.filter((clause) => {
      if (filterLevel === 'all') return true;
      if (filterLevel === 'risky') return clause.riskAssessments.length > 0;
      return clause.riskAssessments.some((r) => r.level === filterLevel);
    });
  }, [clauses, filterLevel]);

  // Stats
  const totalRisks = useMemo(() => {
    return clauses.reduce((sum, c) => sum + c.riskAssessments.length, 0);
  }, [clauses]);

  const clausesWithRisks = useMemo(() => {
    return clauses.filter((c) => c.riskAssessments.length > 0).length;
  }, [clauses]);

  if (isLoading) return <Loader />;

  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-base-content/60 mb-4">Profile not found</p>
          <button className="btn btn-primary" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Top Section - Score and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-base-100 rounded-xl border border-base-200">
            <ScoreRing score={profile.overallScore} />
            <p className="mt-4 text-sm text-center text-base-content/60 max-w-xs">
              Health score based on {profile.totalClauses} clauses analyzed
            </p>
          </div>

          {/* Risk Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Critical"
                value={profile.criticalRiskCount}
                color="#7f1d1d"
                icon={<span className="text-lg">!</span>}
              />
              <StatCard
                label="High"
                value={profile.highRiskCount}
                color="#ef4444"
                icon={<span className="text-lg">!</span>}
              />
              <StatCard
                label="Medium"
                value={profile.mediumRiskCount}
                color="#f59e0b"
                icon={<span className="text-lg">-</span>}
              />
              <StatCard
                label="Low"
                value={profile.lowRiskCount}
                color="#22c55e"
                icon={<Icon icon={checkCircleIcon} className="size-5 text-success" />}
              />
            </div>

            {/* Category Scores */}
            <div className="p-4 bg-base-100 rounded-xl border border-base-200">
              <h3 className="text-sm font-semibold mb-4">Risk Categories</h3>
              <div className="space-y-3">
                <CategoryProgress label="Payment" score={profile.categoryScores.payment} />
                <CategoryProgress label="Responsibility" score={profile.categoryScores.roleResponsibility} />
                <CategoryProgress label="Safety" score={profile.categoryScores.safety} />
                <CategoryProgress label="Timeline" score={profile.categoryScores.temporal} />
                <CategoryProgress label="Procedures" score={profile.categoryScores.procedure} />
                <CategoryProgress label="Definitions" score={profile.categoryScores.definition} />
                <CategoryProgress label="References" score={profile.categoryScores.reference} />
              </div>
            </div>
          </div>
        </div>

        {/* Clauses Section */}
        <div className="bg-base-100 rounded-xl border border-base-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-base-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold">Clauses</h3>
              <span className="text-sm text-base-content/60">
                {clausesWithRisks} of {clauses.length} have risks ({totalRisks} total)
              </span>
            </div>
            <div className="flex items-center gap-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterLevel(opt.value)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filterLevel === opt.value
                      ? 'bg-primary text-primary-content'
                      : 'hover:bg-base-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clauses List */}
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {filteredClauses.length === 0 ? (
              <p className="text-center text-base-content/60 py-8">
                No clauses match the selected filter
              </p>
            ) : (
              filteredClauses.map((clause) => (
                <ClauseItem
                  key={clause.id}
                  clause={clause}
                  isExpanded={expandedClause === clause.id}
                  onToggle={() =>
                    setExpandedClause(expandedClause === clause.id ? null : clause.id)
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
