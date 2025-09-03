import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';

const StatsCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color = 'primary',
  loading = false
}) => {
  const colors = {
    primary: {
      bg: 'from-primary-500/20 to-primary-600/20',
      text: 'text-primary-400',
      icon: 'text-primary-400',
      border: 'border-primary-500/30'
    },
    secondary: {
      bg: 'from-secondary-500/20 to-secondary-600/20',
      text: 'text-secondary-400',
      icon: 'text-secondary-400',
      border: 'border-secondary-500/30'
    },
    success: {
      bg: 'from-green-500/20 to-green-600/20',
      text: 'text-green-400',
      icon: 'text-green-400',
      border: 'border-green-500/30'
    },
    warning: {
      bg: 'from-yellow-500/20 to-yellow-600/20',
      text: 'text-yellow-400',
      icon: 'text-yellow-400',
      border: 'border-yellow-500/30'
    },
    danger: {
      bg: 'from-red-500/20 to-red-600/20',
      text: 'text-red-400',
      icon: 'text-red-400',
      border: 'border-red-500/30'
    }
  };

  const colorConfig = colors[color];
  const TrendIcon = changeType === 'increase' ? TrendingUp : TrendingDown;

  return (
    <Card 
      className={`border bg-gradient-to-br ${colorConfig.bg} ${colorConfig.border} hover:scale-105 transition-transform duration-200`}
      padding="p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 bg-gray-700 rounded animate-pulse mb-2" />
          ) : (
            <p className={`text-2xl font-bold ${colorConfig.text} mb-2`}>
              {value}
            </p>
          )}
          {change && (
            <div className="flex items-center gap-1">
              <TrendIcon className={`w-4 h-4 ${
                changeType === 'increase' ? 'text-green-400' : 'text-red-400'
              }`} />
              <span className={`text-sm font-medium ${
                changeType === 'increase' ? 'text-green-400' : 'text-red-400'
              }`}>
                {change}
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorConfig.bg} border ${colorConfig.border}`}>
            <Icon className={`w-6 h-6 ${colorConfig.icon}`} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;