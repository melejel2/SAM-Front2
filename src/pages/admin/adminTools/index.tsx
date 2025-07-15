import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/daisyui';

export interface AdminToolCardProps {
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
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-base-200 overflow-hidden">
      <span className={`iconify ${icon} w-7 h-7 text-base-content`} />
    </div>
  );
};

const AdminToolCard: React.FC<AdminToolCardProps> = ({
  title,
  icon,
  description,
  path,
  status,
  colorClass,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  handleClick
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
      className={`bg-base-100 rounded-lg border-2 transition-all duration-200
        cursor-pointer admin-tools-card ${isDisabled ? 'opacity-80' : ''}
        ${isHovered
          ? 'shadow-lg border-gray-400 dark:border-gray-600'
          : 'shadow-sm border-base-200'
        }`}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <IconContainer
              icon={icon}
              title={title}
            />
            <div>
              <h3 className="font-medium text-base text-base-content">{title}</h3>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs ${
              status === 'active'
                ? 'hidden'
                : status === 'upcoming'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-error/10 text-error'
            }`}
          >
            {status === 'upcoming' ? 'Coming Soon' : 'Restricted'}
          </span>
        </div>

        <p className="text-sm text-base-content/70 mt-1">{description}</p>

        <div className="mt-2 flex justify-end">
          <button
            className={`btn btn-sm ${colorClass} border-none text-white text-sm ${
              isDisabled ? 'btn-disabled opacity-60' : ''
            }`}
            disabled={isDisabled}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

AdminToolCard.displayName = 'AdminToolCard';

const AdminToolsPage = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const adminTools = [
    {
      title: 'Currencies',
      icon: 'lucide--dollar-sign',
      description: 'Manage currency settings and exchange rates',
      path: '/admin-tools/currencies',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Units',
      icon: 'lucide--pencil-ruler',
      description: 'Configure measurement units and conversions',
      path: '/admin-tools/units',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Users',
      icon: 'lucide--users',
      description: 'Manage user accounts and permissions',
      path: '/admin-tools/users',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Trades',
      icon: 'lucide--list',
      description: 'Define and manage trade categories',
      path: '/admin-tools/trades',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Cost Codes',
      icon: 'lucide--cloud-rain',
      description: 'Set up cost codes for project tracking',
      path: '/admin-tools/cost-codes',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Sheets',
      icon: 'lucide--file-spreadsheet',
      description: 'Manage spreadsheet templates and configurations',
      path: '/admin-tools/sheets',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Projects',
      icon: 'lucide--folder',
      description: 'Configure project settings and parameters',
      path: '/admin-tools/projects',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Buildings',
      icon: 'lucide--building',
      description: 'Manage building information and structures',
      path: '/admin-tools/buildings',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Subcontractors',
      icon: 'lucide--hard-hat',
      description: 'Manage subcontractor information and contacts',
      path: '/admin-tools/subcontractors',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    },
    {
      title: 'Templates',
      icon: 'lucide--file-text',
      description: 'Manage all document templates (Contract, VO, and Other)',
      path: '/admin-tools/templates',
      status: 'active' as const,
      colorClass: 'bg-blue-600',
    }
  ];

  return (
    <div className="overflow-x-hidden relative">
      <div className="relative flex justify-between items-center mb-6 px-0">
        <h1 className="text-3xl font-bold text-base-content">Admin Tools</h1>
      </div>

      <div className="relative mb-6 px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminTools.map((tool) => (
            <AdminToolCard
              key={tool.title}
              {...tool}
              isHovered={hoveredCard === tool.title}
              onMouseEnter={() => setHoveredCard(tool.title)}
              onMouseLeave={() => setHoveredCard(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminToolsPage;
export { AdminToolCard }; 