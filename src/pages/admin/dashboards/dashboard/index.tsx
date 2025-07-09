import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface DashboardCardProps {
  title: string;
  icon: string;
  description: string;
  path: string;
  status: 'active' | 'upcoming' | 'restricted';
  colorClass: string;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  handleClick?: () => void;
  count?: number;
}

interface IconContainerProps {
  icon: string;
  title: string;
}

const IconContainer: React.FC<IconContainerProps> = ({
  icon,
  title,
}) => {
  return (
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden transition-all duration-200 group-hover:bg-gray-200 dark:group-hover:bg-gray-700">
      <span className={`iconify ${icon} w-7 h-7 text-gray-600 dark:text-gray-400 transition-all duration-200`} />
    </div>
  );
};

const DashboardCard: React.FC<DashboardCardProps> = ({
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
  count
}) => {
  const navigate = useNavigate();
  const isDisabled = status === 'upcoming' || status === 'restricted';

  const handleCardClick = () => {
    if (isDisabled) return;
    if (handleClick) {
      handleClick();
      return;
    }
    navigate(path);
  };

  return (
    <div
      className={`group bg-base-100 rounded-xl border-2 transition-all duration-300
        cursor-pointer ${isDisabled ? 'opacity-60' : ''}
        ${isHovered
          ? 'shadow-lg border-gray-400 dark:border-gray-600'
          : 'shadow-md border-base-200 hover:border-gray-300 dark:hover:border-gray-700'
        }`}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <IconContainer
              icon={icon}
              title={title}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-base-content truncate transition-colors duration-200">{title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {count !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{count}</span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === 'active'
                  ? 'hidden'
                  : status === 'upcoming'
                    ? 'bg-warning/10 text-warning border border-warning/20'
                    : 'bg-error/10 text-error border border-error/20'
              }`}
            >
              {status === 'upcoming' ? 'Coming Soon' : 'Restricted'}
            </span>
          </div>
        </div>

        <p className="text-base text-base-content/70 leading-relaxed min-h-[3rem] flex items-center">{description}</p>

        <div className="flex justify-end pt-2">
          <button
            className={`btn btn-sm ${colorClass} border-none text-white text-sm font-medium px-6 transition-all duration-200 ${
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
};

DashboardCard.displayName = 'DashboardCard';

const DashboardPage = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const dashboardPages = [
    {
      title: 'Budget BOQs',
      icon: 'lucide--calculator',
      description: 'Create and manage project budget bills of quantities. Track cost centers, project details, quantities, unit prices, and total costs across multiple buildings and trades.',
      path: '/dashboard/budget-BOQs',
      status: 'active' as const,
      colorClass: 'bg-primary',
      count: 3,
    },
    {
      title: 'Subcontractors BOQs',
      icon: 'lucide--hard-hat',
      description: 'Manage subcontractor-specific BOQs and contracts. Handle contract numbers, amounts, trade assignments, and project allocations with detailed quantity breakdowns.',
      path: '/dashboard/subcontractors-BOQs',
      status: 'active' as const,
      colorClass: 'bg-primary',
      count: 3,
    },
    {
      title: 'Contracts Database',
      icon: 'lucide--file-signature',
      description: 'Comprehensive contract management system. View active contracts, variation orders (VOs), and terminated agreements with amounts, dates, and subcontractor details.',
      path: '/dashboard/contracts-database',
      status: 'active' as const,
      colorClass: 'bg-primary',
      count: 12,
    },
    {
      title: 'Deductions Database',
      icon: 'lucide--minus-circle',
      description: 'Track and manage project deductions across labor, materials, and machines. Monitor penalties, transferred quantities, and stock levels with detailed reporting.',
      path: '/dashboard/deductions-database',
      status: 'active' as const,
      colorClass: 'bg-primary',
      count: 0,
    },
    {
      title: 'IPCs Database',
      icon: 'lucide--file-bar-chart',
      description: 'Monitor interim payment certificates and project progress. Handle IPC references, payment amounts, VAT calculations, and approval workflows with PDF export.',
      path: '/dashboard/IPCs-database',
      status: 'active' as const,
      colorClass: 'bg-primary',
      count: 8,
    },
    {
      title: 'Reports',
      icon: 'lucide--file-text',
      description: 'Generate comprehensive project reports and analytics. Create custom reports for budget analysis, contract summaries, payment tracking, and performance metrics.',
      path: '/dashboard/reports',
      status: 'active' as const,
      colorClass: 'bg-primary',
      count: 3,
    },
  ];

  return (
    <div className="overflow-x-hidden relative">
      <div className="relative flex justify-between items-center mb-6 px-0">
        <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
      </div>

      <div className="relative mb-6 px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboardPages.map((page) => (
            <DashboardCard
              key={page.title}
              {...page}
              isHovered={hoveredCard === page.title}
              onMouseEnter={() => setHoveredCard(page.title)}
              onMouseLeave={() => setHoveredCard(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
export { DashboardCard };
