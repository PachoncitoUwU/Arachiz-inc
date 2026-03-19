import React from 'react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="empty-icon bg-gray-100 text-gray-400">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
