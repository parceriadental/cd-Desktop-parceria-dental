import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  subtitle?: string;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function StatCard({ title, value, icon, color = 'blue', subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-light font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-light mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
