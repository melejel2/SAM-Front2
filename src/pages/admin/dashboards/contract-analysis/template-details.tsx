import { useEffect, useState, useCallback } from 'react';
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
  RiskCategory,
} from '@/types/contract-analysis';

// Icons
import arrowLeftIcon from '@iconify/icons-lucide/arrow-left';
import refreshCwIcon from '@iconify/icons-lucide/refresh-cw';

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
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-base-300"
        />
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

// Category Score Bar
const CategoryScoreBar = ({
  category,
  score,
}: {
  category: string;
  score: number;
  categoryKey: RiskCategory;
}) => {
  const status = getHealthStatus(score);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{category}</span>
        <span className="font-semibold" style={{ color: status.color }}>
          {Math.round(score)}/100
        </span>
      </div>
      <div className="w-full bg-base-300 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: status.color,
          }}
        />
      </div>
    </div>
  );
};

// Clause Risk Card
const ClauseRiskCard = ({
  clause,
  isExpanded,
  onToggle,
}: {
  clause: ContractClause;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const hasRisks = clause.riskAssessments.length > 0;
  const highestRisk = hasRisks
    ? clause.riskAssessments.reduce((max, r) =>
        r.score > max.score ? r : max
      )
    : null;

  return (
    <div
      className={`card bg-base-100 border ${
        hasRisks ? 'border-warning/50' : 'border-base-300'
      }`}
    >
      <div
        className="card-body p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{clause.clauseNumber || `Clause ${clause.clauseOrder}`}</span>
              {hasRisks && (
                <span
                  className="badge badge-sm text-white"
                  style={{
                    backgroundColor:
                      RiskLevelColors[highestRisk!.level as keyof typeof RiskLevelColors] ||
                      '#6b7280',
                  }}
                >
                  {clause.riskAssessments.length} risk(s)
                </span>
              )}
            </div>
            {clause.clauseTitle && (
              <p className="text-sm text-base-content/60">{clause.clauseTitle}</p>
            )}
          </div>
          <span
            className={`transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Clause Content Preview */}
            <div className="p-3 bg-base-200 rounded-lg text-sm max-h-40 overflow-y-auto">
              {clause.clauseContent?.substring(0, 500)}
              {(clause.clauseContent?.length || 0) > 500 && '...'}
            </div>

            {/* Risk Assessments */}
            {hasRisks && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Identified Risks</h4>
                {clause.riskAssessments.map((risk, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-base-300 bg-base-200/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{
                          backgroundColor:
                            RiskLevelColors[risk.level as keyof typeof RiskLevelColors] ||
                            '#6b7280',
                        }}
                      >
                        {risk.level}
                      </span>
                      <span className="text-xs font-medium text-primary">
                        {risk.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{risk.riskDescription}</p>
                    {risk.matchedText && (
                      <div className="p-2 bg-warning/10 rounded text-xs italic border-l-2 border-warning">
                        "{risk.matchedText}"
                      </div>
                    )}
                    {risk.recommendation && (
                      <p className="text-xs text-primary mt-2">
                        {risk.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Template Details Component
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
      <button
        onClick={handleBack}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
        title="Back to Contract Analysis"
      >
        <Icon icon={arrowLeftIcon} className="size-5" />
      </button>
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

    return () => {
      clearContent();
    };
  }, [handleBack, handleReanalyze, isReanalyzing, setLeftContent, setRightContent, clearContent]);

  // Filter clauses by risk level
  const filteredClauses = clauses.filter((clause) => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'risky') return clause.riskAssessments.length > 0;
    return clause.riskAssessments.some((r) => r.level === filterLevel);
  });

  if (isLoading) {
    return <Loader />;
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-base-content/60">Profile not found</p>
        <button
          className="btn btn-primary mt-4"
          onClick={() => navigate('/dashboard/contract-analysis')}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold">{profile.templateName}</h1>
          <p className="text-sm text-base-content/60">
            Analyzed on {new Date(profile.generatedAt).toLocaleDateString('en-US')} •
            Version {profile.analysisVersion}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card */}
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body items-center py-4">
            <ScoreGauge score={profile.overallScore} size={120} label="Overall Score" />
            <p className="text-center text-sm text-base-content/60 mt-2">
              {profile.summary}
            </p>
          </div>
        </div>

        {/* Risk Counts */}
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body py-4">
            <h3 className="card-title text-base">Risk Distribution</h3>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Critical</span>
                <span className="badge badge-error text-white">{profile.criticalRiskCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">High</span>
                <span className="badge badge-warning">{profile.highRiskCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medium</span>
                <span className="badge badge-info">{profile.mediumRiskCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Low</span>
                <span className="badge badge-success">{profile.lowRiskCount}</span>
              </div>
            </div>
            <div className="divider my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Total Clauses</span>
              <span className="font-bold">{profile.totalClauses}</span>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body py-4">
            <h3 className="card-title text-base">Category Scores</h3>
            <div className="space-y-2 mt-2">
              <CategoryScoreBar
                category="Payment"
                score={profile.categoryScores.payment}
                categoryKey={RiskCategory.Payment}
              />
              <CategoryScoreBar
                category="Role/Responsibility"
                score={profile.categoryScores.roleResponsibility}
                categoryKey={RiskCategory.RoleResponsibility}
              />
              <CategoryScoreBar
                category="Safety"
                score={profile.categoryScores.safety}
                categoryKey={RiskCategory.Safety}
              />
              <CategoryScoreBar
                category="Timeline"
                score={profile.categoryScores.temporal}
                categoryKey={RiskCategory.Temporal}
              />
              <CategoryScoreBar
                category="Procedures"
                score={profile.categoryScores.procedure}
                categoryKey={RiskCategory.Procedure}
              />
              <CategoryScoreBar
                category="Definitions"
                score={profile.categoryScores.definition}
                categoryKey={RiskCategory.Definition}
              />
              <CategoryScoreBar
                category="References"
                score={profile.categoryScores.reference}
                categoryKey={RiskCategory.Reference}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {profile.topRecommendations.length > 0 && (
        <div className="card bg-primary/5 border border-primary/20">
          <div className="card-body py-4">
            <h3 className="card-title text-base text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Top Recommendations
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {profile.topRecommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Clauses Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Analyzed Clauses</h2>
          <select
            className="select select-bordered select-sm"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="all">All clauses</option>
            <option value="risky">With risks only</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredClauses.map((clause) => (
            <ClauseRiskCard
              key={clause.id}
              clause={clause}
              isExpanded={expandedClause === clause.id}
              onToggle={() =>
                setExpandedClause(expandedClause === clause.id ? null : clause.id)
              }
            />
          ))}
        </div>

        {filteredClauses.length === 0 && (
          <p className="text-center text-base-content/60 py-8">
            No clauses match the criteria
          </p>
        )}
      </div>
    </div>
  );
}
