import React from 'react';
import { formatCurrency } from '../utils/helpers';
import { TrendingUp, DollarSign, CreditCard, UserCheck, UserX, Info } from 'lucide-react';

interface StatisticsProps {
  statistics: {
    totalEntries: number;
    workedMonths: number;
    notWorkedMonths: number;
    totalSalary: number;
    totalSwilePayments: number;
    averageSalary: number;
    paidTransportCount: number;
    unpaidTransportCount: number;
  };
}

export const Statistics: React.FC<StatisticsProps> = ({ statistics }) => {
  const stats = [
    {
      name: 'Total Entries',
      value: statistics.totalEntries.toString(),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Salary',
      value: formatCurrency(statistics.totalSalary),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Swile Payments',
      value: formatCurrency(statistics.totalSwilePayments),
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const additionalStats = [
    {
      name: 'Average Salary (Worked)',
      value: formatCurrency(statistics.averageSalary),
      subtitle: `Based on ${statistics.workedMonths} worked months`
    },
    {
      name: 'Worked Months',
      value: `${statistics.workedMonths}`,
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      name: 'Not Worked',
      value: `${statistics.notWorkedMonths}`,
      icon: UserX,
      color: 'text-gray-600'
    },
    {
      name: 'Transport Paid',
      value: `${statistics.paidTransportCount} / ${statistics.workedMonths}`,
      subtitle: 'Of worked months'
    }
  ];

  return (
    <div className="mb-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Statistics */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {additionalStats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="text-center">
                <dt className="text-sm font-medium text-gray-500 flex items-center justify-center">
                  {IconComponent && (
                    <IconComponent className={`w-4 h-4 mr-1 ${stat.color || 'text-gray-500'}`} />
                  )}
                  {stat.name}
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {stat.value}
                </dd>
                {stat.subtitle && (
                  <div className="text-xs text-gray-500 mt-1">
                    {stat.subtitle}
                  </div>
                )}
              </div>
            );
          })}
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">
              Transport Paid Rate
            </dt>
            <dd className="text-lg font-semibold text-gray-900">
              {statistics.workedMonths > 0 
                ? `${Math.round((statistics.paidTransportCount / statistics.workedMonths) * 100)}%`
                : '0%'
              }
            </dd>
            <div className="text-xs text-gray-500 mt-1">
              Of worked months
            </div>
          </div>
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">
              Average per Worked Month
            </dt>
            <dd className="text-lg font-semibold text-gray-900">
              {statistics.workedMonths > 0 
                ? formatCurrency((statistics.totalSalary + statistics.totalSwilePayments) / statistics.workedMonths)
                : formatCurrency(0)
              }
            </dd>
            <div className="text-xs text-gray-500 mt-1">
              Salary + Swile only
            </div>
          </div>
        </div>
        
        {/* Info note about average calculation */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <strong>Note:</strong> Average salary is calculated only from months you worked, excluding "not worked" months. 
              Transport is included in the salary amount when paid.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};