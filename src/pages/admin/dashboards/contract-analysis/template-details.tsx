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
import ContractAiChat from './ContractAiChat';

// Icons
import arrowLeftIcon from '@iconify/icons-lucide/arrow-left';
import refreshCwIcon from '@iconify/icons-lucide/refresh-cw';
import alertTriangleIcon from '@iconify/icons-lucide/alert-triangle';
import checkCircleIcon from '@iconify/icons-lucide/check-circle';
import messageSquareIcon from '@iconify/icons-lucide/message-square';
import xIcon from '@iconify/icons-lucide/x';

// Risk level filter options
const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'risky', label: 'With Risks' },
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

// Score Ring Component - compact circular progress
// Renders CLIENT / SUBCONTRACTOR dual-perspective recommendations
const DualPerspective = ({ text }: { text: string }) => {
  const clientMatch = text.match(/CLIENT:\s*(.*?)(?=\s*SUBCONTRACTOR:|$)/is);
  const subMatch = text.match(/SUBCONTRACTOR:\s*(.*?)$/is);

  if (!clientMatch && !subMatch) {
    return <p className="mt-2 text-xs text-base-content/70">{text}</p>;
  }

  return (
    <div className="mt-2 space-y-1.5">
      {clientMatch?.[1]?.trim() && (
        <div className="flex gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium flex-shrink-0 h-fit">
            Client
          </span>
          <span className="text-base-content/70">{clientMatch[1].trim()}</span>
        </div>
      )}
      {subMatch?.[1]?.trim() && (
        <div className="flex gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium flex-shrink-0 h-fit">
            Subcontractor
          </span>
          <span className="text-base-content/70">{subMatch[1].trim()}</span>
        </div>
      )}
    </div>
  );
};

const ScoreRing = ({ score, size = 120 }: { score: number; size?: number }) => {
  const status = getHealthStatus(score);
  const strokeWidth = size > 100 ? 10 : 8;
  const radius = (size - strokeWidth) / 2;
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
          strokeWidth={strokeWidth}
          className="text-base-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={status.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(score)}</span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: status.color + '15', color: status.color }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
};

// Compact Stat Card Component
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
  <div className="flex items-center gap-2 px-2 py-1.5">
    {icon && (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '20' }}
      >
        {icon}
      </div>
    )}
    <div>
      <div className="text-xl font-bold leading-tight" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-base-content/60 leading-tight">{label}</div>
    </div>
  </div>
);

// Compact Category Progress Component
const CategoryProgress = ({
  label,
  score,
}: {
  label: string;
  score: number;
}) => {
  const status = getHealthStatus(score);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-28 truncate text-base-content/70">{label}</span>
      <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: status.color }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right" style={{ color: status.color }}>
        {Math.round(score)}
      </span>
    </div>
  );
};

// Clause Card Component - compact card that opens dialog on click
const ClauseCard = ({
  clause,
  onClick,
}: {
  clause: ContractClause;
  onClick: () => void;
}) => {
  const hasRisks = clause.riskAssessments.length > 0;
  const riskCount = clause.riskAssessments.length;
  const highestRisk = hasRisks
    ? clause.riskAssessments.reduce((max, r) => (r.score > max.score ? r : max))
    : null;

  return (
    <button
      className={`border rounded-lg transition-all text-left px-3 py-2 w-full hover:shadow-sm ${hasRisks ? 'border-base-300 bg-base-200/30 hover:border-base-content/30' : 'border-base-200 hover:border-base-300'}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {hasRisks ? (
          <Icon icon={alertTriangleIcon} className="size-5 text-base-content/50 flex-shrink-0" />
        ) : (
          <Icon icon={checkCircleIcon} className="size-5 text-base-content/40 flex-shrink-0" />
        )}
        <span className="font-semibold text-base truncate flex-1">
          {clause.clauseNumber || `Clause ${clause.clauseOrder}`}
        </span>
        {hasRisks && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
            style={{
              backgroundColor: RiskLevelColors[highestRisk!.level as keyof typeof RiskLevelColors] || '#6b7280',
            }}
          >
            {riskCount}
          </span>
        )}
      </div>
      {clause.clauseTitle && (
        <p className="text-sm text-base-content/60 truncate mt-0.5 ml-7">
          {clause.clauseTitle}
        </p>
      )}
    </button>
  );
};

// Clause Detail Dialog
const ClauseDetailDialog = ({
  clause,
  onClose,
}: {
  clause: ContractClause;
  onClose: () => void;
}) => {
  const hasRisks = clause.riskAssessments.length > 0;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl max-h-[80vh]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {hasRisks ? (
              <Icon icon={alertTriangleIcon} className="size-5 text-base-content/50" />
            ) : (
              <Icon icon={checkCircleIcon} className="size-5 text-base-content/40" />
            )}
            <h3 className="font-bold text-lg">
              {clause.clauseNumber || `Clause ${clause.clauseOrder}`}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <Icon icon={xIcon} className="size-5" />
          </button>
        </div>

        {clause.clauseTitle && (
          <p className="text-sm text-base-content/70 mb-3">{clause.clauseTitle}</p>
        )}

        <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Content */}
          {clause.clauseContent && (
            <div className="p-3 bg-base-200/50 rounded-lg text-sm text-base-content/80 whitespace-pre-wrap">
              {clause.clauseContent}
            </div>
          )}

          {/* Risks */}
          {hasRisks && (
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Risk Assessments ({clause.riskAssessments.length})
              </h4>
              <div className="space-y-2">
                {clause.riskAssessments.map((risk, i) => (
                  <div key={i} className="p-3 bg-base-100 rounded-lg border border-base-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{
                          backgroundColor: RiskLevelColors[risk.level as keyof typeof RiskLevelColors] || '#6b7280',
                        }}
                      >
                        {risk.level}
                      </span>
                      <span className="text-xs text-base-content/60">{risk.categoryEn || risk.category}</span>
                    </div>
                    {(risk.riskDescriptionEn || risk.riskDescription) && (
                      <p className="text-sm mb-1">{risk.riskDescriptionEn || risk.riskDescription}</p>
                    )}
                    {risk.matchedText && (
                      <div className="mt-2 p-2 bg-base-200/50 rounded text-xs italic border-l-2 border-base-300">
                        "{risk.matchedText}"
                      </div>
                    )}
                    {(risk.recommendationEn || risk.recommendation) && (
                      <DualPerspective text={risk.recommendationEn || risk.recommendation || ''} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

// Main Component
export default function TemplateDetailsPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { setAllContent, clearContent } = useTopbarContent();
  const { toaster } = useToast();

  const [profile, setProfile] = useState<TemplateRiskProfile | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [selectedClause, setSelectedClause] = useState<ContractClause | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isChatOpen, setIsChatOpen] = useState(true);

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
    const leftContent = (
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

    const rightContent = (
      <div className="flex items-center gap-2">
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
        <button
          className={`btn btn-sm ${isChatOpen ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
        >
          <Icon icon={messageSquareIcon} className="size-4" />
          <span className="hidden sm:inline">AI Chat</span>
        </button>
      </div>
    );

    setAllContent(leftContent, null, rightContent);

    return () => clearContent();
  }, [handleBack, handleReanalyze, isReanalyzing, profile?.templateName, isChatOpen, setAllContent, clearContent]);

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
    <div className="h-full overflow-hidden flex">
      {/* Left Panel - Analysis Data */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <div className="p-4 space-y-4 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Top Section - Score and Stats - Compact Layout */}
          <div className="flex gap-4 items-stretch flex-shrink-0">
            {/* Score Ring - Compact */}
            <div className="flex flex-col items-center justify-center p-4 bg-base-100 rounded-xl border border-base-200 min-w-[160px]">
              <ScoreRing score={profile.overallScore} size={100} />
              <p className="mt-2 text-xs text-center text-base-content/50 leading-tight">
                Based on {profile.totalClauses} clauses
              </p>
            </div>

            {/* Stats and Categories - Compact */}
            <div className="flex-1 space-y-3 min-w-0">
              {/* Risk Stats - Horizontal */}
              <div className="flex items-center gap-1 p-2 bg-base-100 rounded-xl border border-base-200">
                <StatCard
                  label="Critical"
                  value={profile.criticalRiskCount}
                  color="#4a1d1d"
                  icon={<span className="text-sm font-bold" style={{ color: '#4a1d1d' }}>!</span>}
                />
                <StatCard
                  label="High"
                  value={profile.highRiskCount}
                  color="#b91c1c"
                  icon={<span className="text-sm font-bold" style={{ color: '#b91c1c' }}>!</span>}
                />
                <StatCard
                  label="Medium"
                  value={profile.mediumRiskCount}
                  color="#a16207"
                  icon={<span className="text-sm font-bold" style={{ color: '#a16207' }}>-</span>}
                />
                <StatCard
                  label="Low"
                  value={profile.lowRiskCount}
                  color="#6b7280"
                  icon={<Icon icon={checkCircleIcon} className="size-4" style={{ color: '#6b7280' }} />}
                />
              </div>

              {/* Category Scores - Compact */}
              <div className="p-3 bg-base-100 rounded-xl border border-base-200">
                <h3 className="text-sm font-semibold mb-2.5 text-base-content/70">Risk Categories</h3>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
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
          <div className="bg-base-100 rounded-xl border border-base-200 overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="px-3 py-2 border-b border-base-200 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-base">Clauses</h3>
                <span className="text-sm text-base-content/60">
                  {clausesWithRisks} of {clauses.length} have risks ({totalRisks} total)
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterLevel(opt.value)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
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
            <div className="flex-1 p-3 overflow-y-auto">
              {filteredClauses.length === 0 ? (
                <p className="text-center text-base-content/60 py-8 text-sm">
                  No clauses match the selected filter
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredClauses.map((clause) => (
                    <ClauseCard
                      key={clause.id}
                      clause={clause}
                      onClick={() => setSelectedClause(clause)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - AI Chat */}
      {isChatOpen && (
        <div className="w-[380px] xl:w-[420px] flex-shrink-0 border-l border-base-200 p-3 hidden lg:block">
          <ContractAiChat
            templateName={profile.templateName}
            templateId={parseInt(templateId || '0')}
            overallScore={profile.overallScore}
            criticalCount={profile.criticalRiskCount}
            highCount={profile.highRiskCount}
            mediumCount={profile.mediumRiskCount}
            lowCount={profile.lowRiskCount}
            totalClauses={profile.totalClauses}
            categoryScores={profile.categoryScores}
            topRisks={clauses
              .flatMap(c => c.riskAssessments)
              .filter(r => r.level === 'Critical' || r.level === 'High')
              .slice(0, 5)}
          />
        </div>
      )}

      {/* Mobile Chat Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsChatOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[400px] bg-base-100 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-base-200">
              <span className="font-semibold text-sm">AI Chat Assistant</span>
              <button
                className="btn btn-sm btn-ghost btn-circle"
                onClick={() => setIsChatOpen(false)}
              >
                <Icon icon={xIcon} className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <ContractAiChat
                templateName={profile.templateName}
                templateId={parseInt(templateId || '0')}
                overallScore={profile.overallScore}
                criticalCount={profile.criticalRiskCount}
                highCount={profile.highRiskCount}
                mediumCount={profile.mediumRiskCount}
                lowCount={profile.lowRiskCount}
                totalClauses={profile.totalClauses}
                categoryScores={profile.categoryScores}
                topRisks={clauses
                  .flatMap(c => c.riskAssessments)
                  .filter(r => r.level === 'Critical' || r.level === 'High')
                  .slice(0, 5)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Clause Detail Dialog */}
      {selectedClause && (
        <ClauseDetailDialog
          clause={selectedClause}
          onClose={() => setSelectedClause(null)}
        />
      )}
    </div>
  );
}
