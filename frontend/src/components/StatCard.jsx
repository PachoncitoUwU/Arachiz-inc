import React from 'react';

export default function StatCard({ icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue:   'bg-blue-50 text-[#4285F4]',
    green:  'bg-green-50 text-[#34A853]',
    red:    'bg-red-50 text-[#EA4335]',
    yellow: 'bg-yellow-50 text-[#FBBC05]',
    gray:   'bg-gray-100 text-gray-500',
  };
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colors[color] || colors.blue}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
