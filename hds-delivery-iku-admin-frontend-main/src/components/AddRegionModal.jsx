import React, { useState } from 'react'
import api from '../api'

export default function AddRegionModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [deliveryHours, setDeliveryHours] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Region name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await api.post('/regions', {
        name: name.trim(),
        delivery_hours: deliveryHours.trim() || null,
        enabled,
      })
      onCreated(response.data.data || response.data)
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'The backend does not support creating regions yet (POST /api/regions not found)'
          : `Failed to add region: ${err.response?.data?.error || err.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Add Region</h3>

        {error && <div className="error-message">❌ {error}</div>}

        <label htmlFor="region-name">Region name</label>
        <input
          id="region-name"
          className="search-input"
          type="text"
          placeholder="e.g. NSW Wollongong"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <label htmlFor="region-hours">Delivery hours (optional)</label>
        <input
          id="region-hours"
          className="search-input"
          type="text"
          placeholder="Standard hours"
          value={deliveryHours}
          onChange={(e) => setDeliveryHours(e.target.value)}
        />

        <label className="modal-checkbox">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Add Region'}
          </button>
        </div>
      </form>
    </div>
  )
}
