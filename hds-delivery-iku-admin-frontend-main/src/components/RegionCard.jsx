import React from 'react'

export default function RegionCard({
  region,
  selected,
  onSelect,
  onToggle,
  onViewConfig,
}) {
  const syncDate = region.synced_at
    ? new Date(region.synced_at).toLocaleDateString()
    : 'Never'

  return (
    <div className="region-card">
      <div className="region-info">
        <h3>{region.name}</h3>
        <p>{region.delivery_hours || 'Standard hours'}</p>
      </div>

      <div className="region-meta">
        Last synced<br/>
        {syncDate}
      </div>

      <div className="checkbox-col">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          aria-label={`Select ${region.name}`}
        />
      </div>

      <button
        className={`toggle-switch ${region.enabled ? 'active' : ''}`}
        onClick={onToggle}
        aria-label={`Toggle ${region.name}`}
        title={region.enabled ? 'Disable region' : 'Enable region'}
      />

      <div className="region-actions">
        <button className="btn-icon" onClick={onViewConfig}>
          View Config
        </button>
      </div>
    </div>
  )
}
