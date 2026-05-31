import React from 'react';

export default function StatCard({ icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-[#4285F4] dark:text-blue-400',
    green:  'bg-green-50 dark:bg-green-900/20 text-[#34A853] dark:text-green-400',
    red:    'bg-red-50 dark:bg-red-900/20 text-[#EA4335] dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-[#FBBC05] dark:text-yellow-400',
    gray:   'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400',
  };
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colors[color] || colors.blue}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
