import React, { useState, useEffect } from 'react'
import api from '../api'

export default function BlackoutDates() {
  const [blackoutDates, setBlackoutDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [newBlackout, setNewBlackout] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  })

  useEffect(() => {
    fetchBlackoutDates()
  }, [])

  async function fetchBlackoutDates() {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/blackout-dates')
      setBlackoutDates(response.data.data)
    } catch (err) {
      setError(`Failed to load blackout dates: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddBlackout() {
    if (!newBlackout.start_date || !newBlackout.end_date) {
      setError('Start date and end date are required')
      return
    }

    if (new Date(newBlackout.start_date) > new Date(newBlackout.end_date)) {
      setError('Start date must be before end date')
      return
    }

    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const response = await api.post('/blackout-dates', newBlackout)
      // response.data.data is an array of created dates
      const createdDates = response.data.data || []
      setBlackoutDates([...createdDates, ...blackoutDates])
      setNewBlackout({ start_date: '', end_date: '', reason: '' })
      setShowAddForm(false)
      setSuccess(`Blackout date(s) added (${createdDates.length} dates)`)
      setTimeout(() => setSuccess(null), 5000)
      // Refresh to get the latest
      await fetchBlackoutDates()
    } catch (err) {
      setError(`Failed to add blackout date: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleBlackout(id) {
    try {
      const response = await api.put(`/blackout-dates/${id}/toggle`, {})
      setBlackoutDates(blackoutDates.map(b => (b.id === id ? response.data.data : b)))
      setSuccess('Blackout date toggled')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to toggle blackout date: ${err.message}`)
    }
  }

  async function handleDeleteBlackout(id) {
    if (!confirm('Delete this blackout date?')) return

    try {
      await api.delete(`/blackout-dates/${id}`)
      setBlackoutDates(blackoutDates.filter(b => b.id !== id))
      setSuccess('Blackout date deleted')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to delete blackout date: ${err.message}`)
    }
  }

  const filteredBlackouts = blackoutDates.filter(b =>
    (b.reason && b.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
    b.start_date.includes(searchTerm) ||
    b.end_date.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="screen">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading blackout dates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Screen 4: Blackout Dates</h2>
        <p>Manage site-wide closure dates (applies to all regions)</p>
      </div>

      <div className="screen-body">
        {error && <div className="error-message">❌ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <div className="info-box">
          <strong>📌 Blackout Dates:</strong> Add closure periods (e.g., Christmas, maintenance). Customers won't be able to order for these dates.
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by reason, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        {filteredBlackouts.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredBlackouts.map(blackout => (
              <div
                key={blackout.id}
                style={{
                  background: blackout.enabled ? '#fff3cd' : '#f8f9fa',
                  border: blackout.enabled ? '1px solid #ffc107' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: blackout.enabled ? 1 : 0.6,
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '15px', color: blackout.enabled ? '#856404' : '#666' }}>
                    {blackout.start_date === blackout.end_date
                      ? blackout.start_date
                      : `${blackout.start_date} → ${blackout.end_date}`}
                  </strong>
                  {blackout.reason && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: blackout.enabled ? '#856404' : '#999' }}>
                      {blackout.reason}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    className={`toggle-switch ${blackout.enabled ? 'active' : ''}`}
                    onClick={() => handleToggleBlackout(blackout.id)}
                    title={blackout.enabled ? 'Disable' : 'Enable'}
                  />
                  <button
                    className="btn-icon"
                    onClick={() => handleDeleteBlackout(blackout.id)}
                    style={{ color: '#c33' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 20px' }}>
            {searchTerm ? 'No blackout dates found' : 'No blackout dates yet'}
          </p>
        )}

        {!showAddForm ? (
          <button
            className="add-button"
            onClick={() => setShowAddForm(true)}
            style={{ marginTop: '20px' }}
          >
            + Add Blackout Date
          </button>
        ) : (
          <div style={{ background: '#fffacd', border: '2px solid #ffd700', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
            <strong style={{ color: '#b8860b', fontSize: '14px' }}>🚫 Add Blackout Date</strong>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>Start Date</label>
                <input
                  type="date"
                  value={newBlackout.start_date}
                  onChange={(e) => setNewBlackout({ ...newBlackout, start_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>End Date</label>
                <input
                  type="date"
                  value={newBlackout.end_date}
                  onChange={(e) => setNewBlackout({ ...newBlackout, end_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>Reason (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Christmas closure"
                  value={newBlackout.reason}
                  onChange={(e) => setNewBlackout({ ...newBlackout, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-small" onClick={handleAddBlackout} disabled={isSaving}>
                ✓ Add
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => setShowAddForm(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
