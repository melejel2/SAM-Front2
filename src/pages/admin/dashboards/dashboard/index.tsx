import React, { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';

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

export interface DashboardCardProps extends DashboardPageMeta {
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  handleClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
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

interface ActivityItem {
  title: string;
  meta: string;
  time: string;
  icon: string;
  status: string;
  statusClass: string;
  iconClass: string;
}

interface PipelineStat {
  title: string;
  value: number;
  meta: string;
  icon: string;
  barClass: string;
  badgeClass: string;
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

const DashboardCard = memo<DashboardCardProps>(({
  title,
  icon,
  description,
  path,
  status,
  colorClass,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  handleClick,
  count,
  summary,
  trend,
  trendDirection,
  trendLabel,
  accent,
  style,
  className,
}) => {
  const navigate = useNavigate();
  const isDisabled = useMemo(() => status === 'upcoming' || status === 'restricted', [status]);
  const statusLabel = status === 'active' ? 'Live' : status === 'upcoming' ? 'Coming Soon' : 'Restricted';
  const statusClass =
    status === 'active'
      ? accent.badge
      : status === 'upcoming'
        ? 'bg-warning/10 text-warning border border-warning/20'
        : 'bg-error/10 text-error border border-error/20';
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

  const handleCardClick = useCallback(() => {
    if (isDisabled) return;
    if (handleClick) {
      handleClick();
      return;
    }
    navigate(path);
  }, [isDisabled, handleClick, navigate, path]);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-base-200 bg-base-100/90 transition-all duration-300
        cursor-pointer ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}
        ${isHovered
          ? 'shadow-xl border-base-300'
          : 'shadow-md hover:-translate-y-1 hover:border-base-300'
        } ${className || ''}`}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
    >
      <div className={`pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-gradient-to-br ${accent.glow} blur-3xl`} />
      <div className="relative z-10 p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-4">
            <IconContainer icon={icon} title={title} accent={accent} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-base-content truncate">{title}</h3>
              <p className="text-xs text-base-content/50 mt-0.5">{summary}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}>{statusLabel}</span>
        </div>

        <p className="text-sm text-base-content/70 leading-relaxed min-h-[3rem]">{description}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-base-content">{count}</p>
            <div className={`flex items-center gap-2 text-xs ${trendColor}`}>
              <span className={`iconify ${trendIcon} size-3.5`} />
              <span>{trend}</span>
              <span className="text-base-content/40">{trendLabel}</span>
            </div>
          </div>
          <button
            className={`btn btn-sm ${colorClass} border-none text-white text-sm font-medium px-5 transition-all duration-200 ${
              isDisabled ? 'btn-disabled opacity-60' : 'hover:shadow-md'
            }`}
            disabled={isDisabled}
          >
            <span className="iconify lucide--arrow-right size-4 transition-transform duration-200 group-hover:translate-x-1"></span>
            Open
          </button>
        </div>
      </div>
    </div>
  );
});

DashboardCard.displayName = 'DashboardCard';

const dashboardPages: DashboardPageMeta[] = [
  {
    title: 'Budget BOQs',
    shortTitle: 'Budget',
    icon: 'lucide--calculator',
    description: 'Create, update, and audit bills of quantities with multi-building breakdowns, cost centers, and granular line items.',
    path: '/dashboard/budget-BOQs',
    status: 'active',
    colorClass: 'bg-emerald-600',
    count: 3,
    summary: 'Active projects',
    trend: '+12%',
    trendDirection: 'up',
    trendLabel: 'vs last 30 days',
    sparkline: [6, 8, 7, 9, 10, 9, 12],
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
    count: 12,
    summary: 'Active agreements',
    trend: '+4',
    trendDirection: 'up',
    trendLabel: 'vs last month',
    sparkline: [8, 10, 9, 12, 11, 13, 15],
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
    title: 'Deductions',
    shortTitle: 'Deductions',
    icon: 'lucide--minus-circle',
    description: 'Track labor, materials, and equipment deductions with penalties, transfers, and stock movements in one ledger.',
    path: '/dashboard/deductions-database',
    status: 'active',
    colorClass: 'bg-amber-600',
    count: 0,
    summary: 'Open items',
    trend: 'Stable',
    trendDirection: 'flat',
    trendLabel: 'vs last 30 days',
    sparkline: [4, 3, 3, 2, 2, 1, 1],
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
    title: 'IPCs',
    shortTitle: 'IPCs',
    icon: 'lucide--file-bar-chart',
    description: 'Monitor interim payment certificates, VAT calculations, approvals, and document exports in one flow.',
    path: '/dashboard/IPCs-database',
    status: 'active',
    colorClass: 'bg-teal-600',
    count: 8,
    summary: 'Issued IPCs',
    trend: '+2',
    trendDirection: 'up',
    trendLabel: 'vs last month',
    sparkline: [5, 6, 6, 7, 7, 8, 9],
    accent: {
      text: 'text-teal-600',
      bg: 'bg-teal-500/10',
      ring: 'ring-teal-500/20',
      glow: 'from-teal-500/25 via-teal-500/0',
      badge: 'bg-teal-500/10 text-teal-700 border-teal-200',
      bar: 'bg-teal-500',
    },
  },
  {
    title: 'Reports',
    shortTitle: 'Reports',
    icon: 'lucide--file-text',
    description: 'Generate budget analysis, contract summaries, IPC tracking, and performance insights with exportable outputs.',
    path: '/dashboard/reports',
    status: 'active',
    colorClass: 'bg-rose-600',
    count: 3,
    summary: 'Generated packs',
    trend: '+1',
    trendDirection: 'up',
    trendLabel: 'vs last month',
    sparkline: [2, 3, 2, 4, 3, 4, 5],
    accent: {
      text: 'text-rose-600',
      bg: 'bg-rose-500/10',
      ring: 'ring-rose-500/20',
      glow: 'from-rose-500/25 via-rose-500/0',
      badge: 'bg-rose-500/10 text-rose-700 border-rose-200',
      bar: 'bg-rose-500',
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
    title: 'Run Report',
    description: 'Export performance pack',
    icon: 'lucide--file-text',
    path: '/dashboard/reports',
    tone: 'text-rose-700',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
];

const activityItems: ActivityItem[] = [
  {
    title: 'IPC #2043 issued',
    meta: 'Cedar Residence • $128k',
    time: '2h ago',
    icon: 'lucide--check-circle',
    status: 'Issued',
    statusClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    iconClass: 'text-emerald-600',
  },
  {
    title: 'Contract CN-128 ready for signature',
    meta: 'Summit Tower • Legal review complete',
    time: '6h ago',
    icon: 'lucide--file-check',
    status: 'Awaiting sign-off',
    statusClass: 'bg-sky-500/10 text-sky-700 border-sky-200',
    iconClass: 'text-sky-600',
  },
  {
    title: 'Budget BOQ update submitted',
    meta: 'Northbridge Phase 2 • 18 line items',
    time: '1d ago',
    icon: 'lucide--calculator',
    status: 'Reviewing',
    statusClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    iconClass: 'text-emerald-600',
  },
  {
    title: 'Deductions batch resolved',
    meta: 'Equipment • 6 entries closed',
    time: '3d ago',
    icon: 'lucide--minus-circle',
    status: 'Closed',
    statusClass: 'bg-amber-500/10 text-amber-700 border-amber-200',
    iconClass: 'text-amber-600',
  },
  {
    title: 'Monthly performance report exported',
    meta: 'Portfolio overview • PDF + Excel',
    time: '5d ago',
    icon: 'lucide--file-text',
    status: 'Delivered',
    statusClass: 'bg-rose-500/10 text-rose-700 border-rose-200',
    iconClass: 'text-rose-600',
  },
];

const pipelineStats: PipelineStat[] = [
  {
    title: 'Contracts signed',
    value: 72,
    meta: '9 pending review',
    icon: 'lucide--file-signature',
    barClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  },
  {
    title: 'IPCs approved',
    value: 58,
    meta: '4 awaiting approval',
    icon: 'lucide--stamp',
    barClass: 'bg-teal-500',
    badgeClass: 'bg-teal-500/10 text-teal-700 border-teal-200',
  },
  {
    title: 'Deductions resolved',
    value: 46,
    meta: '3 escalations',
    icon: 'lucide--shield-alert',
    barClass: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-200',
  },
];

const DashboardPage = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleMouseEnter = useCallback((title: string) => {
    setHoveredCard(title);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCard(null);
  }, []);

  const overviewCards = useMemo(() => {
    return dashboardPages.map((page, index) => (
      <OverviewCard
        key={page.title}
        {...page}
        onClick={() => navigate(page.path)}
        style={{ animationDelay: `${index * 80}ms` }}
        className="animate-fade-up"
      />
    ));
  }, [navigate]);

  const workstreamPulse = useMemo(() => {
    const maxCount = Math.max(...dashboardPages.map((page) => page.count), 1);

    return dashboardPages.map((page) => ({
      title: page.shortTitle,
      value: page.count,
      percent: Math.round((page.count / maxCount) * 100),
      accent: page.accent,
    }));
  }, []);

  const renderedCards = useMemo(() => {
    return dashboardPages.map((page, index) => (
      <DashboardCard
        key={page.title}
        {...page}
        isHovered={hoveredCard === page.title}
        onMouseEnter={() => handleMouseEnter(page.title)}
        onMouseLeave={handleMouseLeave}
        style={{ animationDelay: `${index * 90}ms` }}
        className="animate-fade-up"
      />
    ));
  }, [hoveredCard, handleMouseEnter, handleMouseLeave]);

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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {overviewCards}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-base-200 bg-base-100/90 p-5 shadow-sm animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-base-content">Workstream pulse</h2>
              <p className="text-xs text-base-content/60">Active volume by module</p>
            </div>
            <span className="badge badge-sm bg-base-200 text-base-content/60">Last 30 days</span>
          </div>
          <div className="mt-5 space-y-4">
            {workstreamPulse.map((item) => (
              <div key={item.title} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-base-content">{item.title}</span>
                  <span className="text-xs text-base-content/60">{item.value} items</span>
                </div>
                <div className="h-2 w-full rounded-full bg-base-200">
                  <div
                    className={`h-2 rounded-full ${item.accent.bar} transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-base-200 bg-base-100/90 p-5 shadow-sm animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-base-content">Approval pipeline</h2>
              <p className="text-xs text-base-content/60">Completion by workflow</p>
            </div>
            <span className="badge badge-sm bg-base-200 text-base-content/60">This month</span>
          </div>
          <div className="mt-5 space-y-4">
            {pipelineStats.map((stat) => (
              <div key={stat.title} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`iconify ${stat.icon} size-4 text-base-content/60`} />
                    <span className="font-medium text-base-content">{stat.title}</span>
                  </div>
                  <span className={`badge badge-sm border ${stat.badgeClass}`}>{stat.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-base-200">
                  <div
                    className={`h-2 rounded-full ${stat.barClass}`}
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
                <p className="text-xs text-base-content/50">{stat.meta}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-base-200 bg-base-100/90 p-5 shadow-sm animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-base-content">Recent activity</h2>
              <p className="text-xs text-base-content/60">Latest updates across modules</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/reports')}
              className="btn btn-xs btn-ghost text-base-content/60 hover:text-base-content"
            >
              View all
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {activityItems.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl border border-base-200/70 bg-base-100/70 p-3">
                <span className={`iconify ${item.icon} size-5 ${item.iconClass}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-base-content">{item.title}</p>
                    <span className="text-xs text-base-content/50">{item.time}</span>
                  </div>
                  <p className="text-xs text-base-content/60">{item.meta}</p>
                  <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${item.statusClass}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-base-content">Modules</h2>
            <p className="text-sm text-base-content/60">Jump into each workspace with live context and highlights.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {renderedCards}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
export { DashboardCard };
