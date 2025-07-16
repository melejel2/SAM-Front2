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

interface AdminToolCategory {
  title: string;
  description: string;
  tools: Omit<AdminToolCardProps, 'isHovered' | 'onMouseEnter' | 'onMouseLeave'>[];
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

  const adminToolCategories: AdminToolCategory[] = [
    {
      title: 'System Settings',
      description: '',
      tools: [
        {
          title: 'Currencies',
          icon: 'lucide--dollar-sign',
          description: 'Manage currencies and exchange rates',
          path: '/admin-tools/currencies',
          status: 'active' as const,
          colorClass: 'bg-emerald-600',
        },
        {
          title: 'Units',
          icon: 'lucide--pencil-ruler',
          description: 'Configure measurement units',
          path: '/admin-tools/units',
          status: 'active' as const,
          colorClass: 'bg-emerald-600',
        }
      ]
    },
    {
      title: 'Personnel',
      description: '',
      tools: [
        {
          title: 'Users',
          icon: 'lucide--users',
          description: 'Manage user accounts and permissions',
          path: '/admin-tools/users',
          status: 'active' as const,
          colorClass: 'bg-blue-600',
        },
        {
          title: 'Subcontractors',
          icon: 'lucide--hard-hat',
          description: 'Manage subcontractor contacts',
          path: '/admin-tools/subcontractors',
          status: 'active' as const,
          colorClass: 'bg-blue-600',
        }
      ]
    },
    {
      title: 'Project Setup',
      description: '',
      tools: [
        {
          title: 'Templates',
          icon: 'lucide--file-text',
          description: 'Manage document templates',
          path: '/admin-tools/templates',
          status: 'active' as const,
          colorClass: 'bg-purple-600',
        },
        {
          title: 'Cost Codes',
          icon: 'lucide--cloud-rain',
          description: 'Set up cost codes for tracking',
          path: '/admin-tools/cost-codes',
          status: 'active' as const,
          colorClass: 'bg-purple-600',
        },
        {
          title: 'Trades',
          icon: 'lucide--list',
          description: 'Define trade categories',
          path: '/admin-tools/trades',
          status: 'active' as const,
          colorClass: 'bg-purple-600',
        }
      ]
    }
  ];

  return (
    <div className="overflow-x-hidden relative">


      <div className="space-y-8">
        {adminToolCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h2 className="text-xl font-semibold text-base-content">{category.title}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.tools.map((tool) => (
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
        ))}
      </div>
    </div>
  );
};

export default AdminToolsPage;
export { AdminToolCard }; 