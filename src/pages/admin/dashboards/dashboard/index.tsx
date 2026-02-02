import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { getDashboardSummary, type DashboardSummary } from '@/api/services/dashboard-api';
import type { ApexOptions } from 'apexcharts';

const ApexCharts = lazy(() => import('react-apexcharts'));

type TrendDirection = 'up' | 'down' | 'flat';

interface DashboardAccent {
  text: string;
  bg: string;
  ring: string;
  glow: string;
  badge: string;
  bar: string;
}

interface DashboardPageMeta {
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  path: string;
  status: 'active' | 'upcoming' | 'restricted';
  colorClass: string;
  count: number;
  summary: string;
  trend: string;
  trendDirection: TrendDirection;
  trendLabel: string;
  sparkline: number[];
  accent: DashboardAccent;
}

interface OverviewCardProps extends DashboardPageMeta {
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  path: string;
  tone: string;
  bg: string;
  border: string;
}

interface IconContainerProps {
  icon: string;
  title: string;
  accent: DashboardAccent;
  size?: 'sm' | 'md' | 'lg';
}

const IconContainer = memo<IconContainerProps>(({
  icon,
  title,
  accent,
  size = 'md',
}) => {
  const sizeClasses =
    size === 'lg'
      ? 'w-12 h-12'
      : size === 'sm'
        ? 'w-9 h-9'
        : 'w-10 h-10';
  const iconClasses =
    size === 'lg'
      ? 'w-6 h-6'
      : size === 'sm'
        ? 'w-4 h-4'
        : 'w-5 h-5';

  return (
    <div
      className={`flex-shrink-0 ${sizeClasses} flex items-center justify-center rounded-xl ${accent.bg} transition-all duration-200`}
      aria-label={title}
    >
      <span className={`iconify ${icon} ${iconClasses} ${accent.text}`} />
    </div>
  );
});

IconContainer.displayName = 'IconContainer';

const Sparkline = memo(({ data, className }: { data: number[]; className?: string }) => {
  const { linePoints, areaPoints } = useMemo(() => {
    if (!data.length) {
      return { linePoints: '', areaPoints: '' };
    }

    const height = 40;
    const width = 100;
    const padding = 6;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

    const points = data.map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return {
      linePoints: points.join(' '),
      areaPoints: `${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`,
    };
  }, [data]);

  if (!linePoints) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className={`h-10 w-full ${className || ''}`}
    >
      <polygon points={areaPoints} fill="currentColor" opacity="0.12" />
      <polyline
        points={linePoints}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';

const OverviewCard = memo<OverviewCardProps>(({
  title,
  icon,
  status,
  count,
  summary,
  trend,
  trendDirection,
  trendLabel,
  sparkline,
  accent,
  onClick,
  style,
  className,
}) => {
  const isDisabled = status === 'upcoming' || status === 'restricted';
  const trendColor =
    trendDirection === 'up'
      ? 'text-emerald-600'
      : trendDirection === 'down'
        ? 'text-rose-600'
        : 'text-base-content/50';
  const trendIcon =
    trendDirection === 'up'
      ? 'lucide--trending-up'
      : trendDirection === 'down'
        ? 'lucide--trending-down'
        : 'lucide--minus';

  return (
    <button
      type="button"
      className={`group relative overflow-hidden rounded-2xl border border-base-200 bg-base-100/80 p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${accent.ring} ring-1 ring-inset ${isDisabled ? 'cursor-not-allowed opacity-60' : ''} ${className || ''}`}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={style}
    >
      <div className={`pointer-events-none absolute -top-12 right-0 h-24 w-24 rounded-full bg-gradient-to-br ${accent.glow} blur-2xl`} />
      <div className="relative z-10 flex items-center justify-between">
        <IconContainer icon={icon} title={title} accent={accent} size="sm" />
        <span className={`badge badge-sm border ${accent.badge}`}>{trend}</span>
      </div>
      <div className="relative z-10 mt-4 space-y-1">
        <p className="text-sm text-base-content/60">{summary}</p>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-base-content/50">{title}</p>
            <p className="text-2xl font-semibold text-base-content">{count}</p>
          </div>
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <span className={`iconify ${trendIcon} size-3.5`} />
            <span>{trendLabel}</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-4">
        <Sparkline data={sparkline} className={accent.text} />
      </div>
    </button>
  );
});

OverviewCard.displayName = 'OverviewCard';

const dashboardPages: DashboardPageMeta[] = [
  {
    title: 'Budget BOQs',
    shortTitle: 'Budget',
    icon: 'lucide--calculator',
    description: 'Create, update, and audit bills of quantities with multi-building breakdowns, cost centers, and granular line items.',
    path: '/dashboard/budget-BOQs',
    status: 'active',
    colorClass: 'bg-emerald-600',
    count: 0,
    summary: 'Active projects',
    trend: '',
    trendDirection: 'flat',
    trendLabel: '',
    sparkline: [],
    accent: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
      glow: 'from-emerald-500/25 via-emerald-500/0',
      badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      bar: 'bg-emerald-500',
    },
  },
  {
    title: 'Contracts',
    shortTitle: 'Contracts',
    icon: 'lucide--file-signature',
    description: 'Manage drafts, active contracts, variation orders, and termination workflows with unified document generation.',
    path: '/dashboard/contracts',
    status: 'active',
    colorClass: 'bg-sky-600',
    count: 0,
    summary: 'Active agreements',
    trend: '',
    trendDirection: 'flat',
    trendLabel: '',
    sparkline: [],
    accent: {
      text: 'text-sky-600',
      bg: 'bg-sky-500/10',
      ring: 'ring-sky-500/20',
      glow: 'from-sky-500/25 via-sky-500/0',
      badge: 'bg-sky-500/10 text-sky-700 border-sky-200',
      bar: 'bg-sky-500',
    },
  },
  {
    title: 'IPCs',
    shortTitle: 'IPCs',
    icon: 'lucide--file-bar-chart',
    description: 'Monitor interim payment certificates, VAT calculations, approvals, and document exports in one flow.',
    path: '/dashboard/IPCs-database',
    status: 'active',
    colorClass: 'bg-teal-600',
    count: 0,
    summary: 'Issued IPCs',
    trend: '',
    trendDirection: 'flat',
    trendLabel: '',
    sparkline: [],
    accent: {
      text: 'text-teal-600',
      bg: 'bg-teal-500/10',
      ring: 'ring-teal-500/20',
      glow: 'from-teal-500/25 via-teal-500/0',
      badge: 'bg-teal-500/10 text-teal-700 border-teal-200',
      bar: 'bg-teal-500',
    },
  },
];

const quickActions: QuickAction[] = [
  {
    title: 'New Contract',
    description: 'Draft & route for approval',
    icon: 'lucide--file-plus-2',
    path: '/dashboard/contracts/new',
    tone: 'text-sky-700',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  {
    title: 'Create IPC',
    description: 'Issue payment certificate',
    icon: 'lucide--file-check-2',
    path: '/dashboard/IPCs-database/new',
    tone: 'text-teal-700',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  {
    title: 'Budget BOQs',
    description: 'Update quantities & costs',
    icon: 'lucide--layers',
    path: '/dashboard/budget-BOQs',
    tone: 'text-emerald-700',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    title: 'Analyze Contract',
    description: 'AI-powered contract review',
    icon: 'lucide--scan-search',
    path: '/dashboard/contract-analysis',
    tone: 'text-violet-700',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
];

interface ModuleLink {
  title: string;
  description: string;
  icon: string;
  path: string;
  accent: DashboardAccent;
}

const moduleLinks: ModuleLink[] = [
  {
    title: 'Deductions',
    description: 'Track labor, materials, and equipment deductions with penalties, transfers, and stock movements.',
    icon: 'lucide--minus-circle',
    path: '/dashboard/deductions-database',
    accent: {
      text: 'text-amber-600',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/20',
      glow: 'from-amber-500/25 via-amber-500/0',
      badge: 'bg-amber-500/10 text-amber-700 border-amber-200',
      bar: 'bg-amber-500',
    },
  },
  {
    title: 'Reports',
    description: 'Generate budget analysis, contract summaries, IPC tracking, and performance insights.',
    icon: 'lucide--file-text',
    path: '/dashboard/reports',
    accent: {
      text: 'text-rose-600',
      bg: 'bg-rose-500/10',
      ring: 'ring-rose-500/20',
      glow: 'from-rose-500/25 via-rose-500/0',
      badge: 'bg-rose-500/10 text-rose-700 border-rose-200',
      bar: 'bg-rose-500',
    },
  },
  {
    title: 'Contract Analysis',
    description: 'AI-powered contract review, clause extraction, and risk assessment across your portfolio.',
    icon: 'lucide--scan-search',
    path: '/dashboard/contract-analysis',
    accent: {
      text: 'text-violet-600',
      bg: 'bg-violet-500/10',
      ring: 'ring-violet-500/20',
      glow: 'from-violet-500/25 via-violet-500/0',
      badge: 'bg-violet-500/10 text-violet-700 border-violet-200',
      bar: 'bg-violet-500',
    },
  },
  {
    title: 'Admin Tools',
    description: 'Manage users, projects, subcontractors, cost codes, currencies, units, and templates.',
    icon: 'lucide--settings',
    path: '/admin-tools',
    accent: {
      text: 'text-slate-600',
      bg: 'bg-slate-500/10',
      ring: 'ring-slate-500/20',
      glow: 'from-slate-500/25 via-slate-500/0',
      badge: 'bg-slate-500/10 text-slate-700 border-slate-200',
      bar: 'bg-slate-500',
    },
  },
];


const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchSummary = async () => {
      const token = getToken();
      console.log('[Dashboard] token present:', !!token);
      if (!token) return;
      const data = await getDashboardSummary(token);
      console.log('[Dashboard] API response:', data);
      if (data) {
        console.log('[Dashboard] Setting summary:', data);
        setSummary(data);
      } else {
        console.warn('[Dashboard] No data returned from getDashboardSummary');
      }
    };
    fetchSummary();
  }, [getToken]);

  const pages = useMemo(() => {
    const countMap = [
      summary?.activeProjects ?? 0,
      summary?.activeContracts ?? 0,
      summary?.issuedIpcs ?? 0,
    ];
    return dashboardPages.map((p, i) => ({ ...p, count: countMap[i] }));
  }, [summary]);

  const overviewCards = useMemo(() => {
    return pages.map((page, index) => (
      <OverviewCard
        key={page.title}
        {...page}
        onClick={() => navigate(page.path)}
        style={{ animationDelay: `${index * 80}ms` }}
        className="animate-fade-up"
      />
    ));
  }, [pages, navigate]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-base-300/70 bg-base-100/80 p-6 md:p-8 shadow-sm animate-fade-up">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-base-200/70 px-3 py-1 text-xs font-medium text-base-content/60">
                <span className="iconify lucide--sparkles size-3.5"></span>
                Portfolio overview
              </div>
              <h1 className="text-3xl font-semibold text-base-content">Dashboard</h1>
              <p className="max-w-2xl text-sm text-base-content/70">
                Track budgets, contracts, deductions, IPCs, and reporting activity in one place. Jump straight to the tasks that
                need attention this week.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className={`group rounded-2xl border ${action.border} ${action.bg} p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`iconify ${action.icon} size-4 ${action.tone}`} />
                    <span className="text-sm font-semibold text-base-content">{action.title}</span>
                  </div>
                  <p className="mt-2 text-xs text-base-content/60">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overviewCards}
          </div>
        </div>
      </section>

      {summary && (summary.contractsByStatus.length > 0 || summary.topProjectsByIpcValue.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2 animate-fade-up">
          {summary.contractsByStatus.length > 0 && (
            <div className="rounded-2xl border border-base-200 bg-base-100/90 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-base-content">Contracts by Status</h3>
              <p className="text-xs text-base-content/60 mb-2">Distribution across lifecycle stages</p>
              <Suspense fallback={<div className="h-[280px] flex items-center justify-center"><span className="loading loading-spinner loading-md"></span></div>}>
                <ApexCharts
                  type="donut"
                  height={280}
                  series={summary.contractsByStatus.map(s => s.count)}
                  options={{
                    chart: { background: 'transparent' },
                    labels: summary.contractsByStatus.map(s => s.status),
                    colors: ['#38bdf8', '#6ee7b7', '#fbbf24', '#fb7185'],
                    legend: { position: 'bottom', fontSize: '13px' },
                    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(0)}%` },
                    plotOptions: { pie: { donut: { size: '55%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '14px', fontWeight: '600' } } } } },
                    stroke: { width: 0 },
                  } satisfies ApexOptions}
                />
              </Suspense>
            </div>
          )}

          {summary.topProjectsByIpcValue.length > 0 && (
            <div className="rounded-2xl border border-base-200 bg-base-100/90 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-base-content">Top Projects by IPC Value</h3>
              <p className="text-xs text-base-content/60 mb-2">Total certified amounts per project</p>
              <Suspense fallback={<div className="h-[280px] flex items-center justify-center"><span className="loading loading-spinner loading-md"></span></div>}>
                <ApexCharts
                  type="bar"
                  height={280}
                  series={[{ name: 'IPC Value', data: summary.topProjectsByIpcValue.map(p => Math.round(p.totalAmount)) }]}
                  options={{
                    chart: { background: 'transparent', toolbar: { show: false } },
                    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
                    colors: ['#14b8a6'],
                    xaxis: {
                      categories: summary.topProjectsByIpcValue.map(p => p.projectName),
                      labels: { formatter: (val: string) => {
                        const n = Number(val);
                        return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : val;
                      }},
                    },
                    yaxis: { labels: { maxWidth: 160 } },
                    dataLabels: { enabled: false },
                    grid: { borderColor: 'rgba(150,150,150,0.1)' },
                    tooltip: { y: { formatter: (val: number) => val.toLocaleString() } },
                  } satisfies ApexOptions}
                />
              </Suspense>
            </div>
          )}
        </section>
      )}

      <section className="animate-fade-up">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-base-content">Modules</h2>
          <p className="text-sm text-base-content/60">Navigate to other workspaces</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {moduleLinks.map((mod) => (
            <button
              key={mod.title}
              type="button"
              onClick={() => navigate(mod.path)}
              className={`group relative overflow-hidden rounded-2xl border border-base-200 bg-base-100/80 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${mod.accent.ring} ring-1 ring-inset`}
            >
              <div className={`pointer-events-none absolute -top-10 right-0 h-20 w-20 rounded-full bg-gradient-to-br ${mod.accent.glow} blur-2xl`} />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl ${mod.accent.bg}`}>
                  <span className={`iconify ${mod.icon} w-5 h-5 ${mod.accent.text}`} />
                </div>
                <h3 className="font-semibold text-base-content">{mod.title}</h3>
              </div>
              <p className="relative z-10 mt-3 text-xs text-base-content/60 leading-relaxed">{mod.description}</p>
              <div className="relative z-10 mt-3 flex items-center gap-1 text-xs font-medium ${mod.accent.text}">
                <span className={`${mod.accent.text}`}>Open</span>
                <span className={`iconify lucide--arrow-right size-3.5 ${mod.accent.text} transition-transform duration-200 group-hover:translate-x-1`} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
