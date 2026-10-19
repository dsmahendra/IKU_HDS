import React, { useState, useEffect } from 'react'
import api from '../api'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_MAP = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 }
const REVERSE_DAY_MAP = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' }

// Helper to convert day number to name
function getDayName(dayNum) {
  if (typeof dayNum === 'string') return dayNum; // Already a name
  return REVERSE_DAY_MAP[dayNum] || 'Monday';
}

// Helper to convert day name to number
function getDayNumber(dayName) {
  if (typeof dayName === 'number') return dayName; // Already a number
  return DAY_MAP[dayName] || 1;
}

export default function RegionDetail({ regionId, onBack }) {
  const [region, setRegion] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCutoffEdit, setShowCutoffEdit] = useState(false)
  const [showLocationEdit, setShowLocationEdit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cutoffEdit, setCutoffEdit] = useState({})
  const [locationEdit, setLocationEdit] = useState({})

  const [newSchedule, setNewSchedule] = useState({
    cutoff_day: 'Monday',
    pack_day: 'Tuesday',
    delivery_day: 'Friday',
    hours: '', // Empty until user selects
    enabled: true,
    is_default: false,
  })

  useEffect(() => {
    fetchRegionDetail()
  }, [regionId])

  async function fetchRegionDetail() {
    setLoading(true)
    setError(null)

    try {
      // Fetch region
      const regionRes = await api.get(`/regions/${regionId}`)
      setRegion(regionRes.data.data || regionRes.data)
      
      // Fetch schedules for this region
      const schedulesRes = await api.get(`/regions/${regionId}/schedules`)
      setSchedules(schedulesRes.data.data || [])
    } catch (err) {
      setError(`Failed to load region: ${err.message}`)
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSchedule() {
    if (!newSchedule.cutoff_day || !newSchedule.pack_day || !newSchedule.delivery_day || !newSchedule.hours || newSchedule.hours.trim() === '') {
      setError('Please select days and at least one delivery window')
      return
    }

    setIsSaving(true)

    try {
      const response = await api.post('/schedules', {
        region_id: regionId,
        cutoff_day: newSchedule.cutoff_day,
        pack_day: newSchedule.pack_day,
        delivery_day: newSchedule.delivery_day,
        hours: newSchedule.hours,
        enabled: newSchedule.enabled,
        is_default: newSchedule.is_default,
      })

      const newScheduleData = response.data.data || response.data
      setSchedules([...schedules, newScheduleData])
      setNewSchedule({
        cutoff_day: 'Monday',
        pack_day: 'Tuesday',
        delivery_day: 'Friday',
        hours: '',
        enabled: true,
        is_default: false,
      })
      setShowAddForm(false)
      setSuccess('✅ Schedule added!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to add schedule: ${err.message}`)
      console.error('Add schedule error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleSchedule(scheduleId) {
    try {
      const response = await api.put(`/schedules/${scheduleId}/toggle`)
      const updatedSchedule = response.data.data || response.data
      setSchedules(schedules.map(s => (s.id === scheduleId ? updatedSchedule : s)))
      setSuccess('Schedule toggled')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to toggle schedule: ${err.message}`)
    }
  }

  async function handleSetDefault(scheduleId) {
    setIsSaving(true)

    try {
      const response = await api.put(`/schedules/${regionId}/set-default/${scheduleId}`)
      // Update schedules to reflect default change
      setSchedules(
        schedules.map(s => ({
          ...s,
          is_default: s.id === scheduleId,
        }))
      )
      setSuccess('Default schedule updated')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to set default: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSchedule(scheduleId) {
    if (!confirm('Delete this schedule?')) return

    try {
      await api.delete(`/schedules/${scheduleId}`)
      setSchedules(schedules.filter(s => s.id !== scheduleId))
      setSuccess('Schedule deleted')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to delete schedule: ${err.message}`)
    }
  }

  async function handleSaveCutoff() {
    setIsSaving(true)

    try {
      await api.put(`/regions/${regionId}`, cutoffEdit)
      setRegion({ ...region, ...cutoffEdit })
      setShowCutoffEdit(false)
      setSuccess('Cutoff settings saved')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to save cutoff: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveLocation() {
    setIsSaving(true)

    try {
      await api.put(`/regions/${regionId}`, locationEdit)
      setRegion({ ...region, ...locationEdit })
      setShowLocationEdit(false)
      setSuccess('Location saved')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to save location: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  function handleScheduleUpdate(scheduleId, updates) {
    setIsSaving(true)

    try {
      const response = api.put(`/schedules/${scheduleId}`, updates)
      response.then(res => {
        const updatedSchedule = res.data.data || res.data
        setSchedules(schedules.map(s => (s.id === scheduleId ? updatedSchedule : s)))
        setSuccess('✅ Schedule updated!')
        setTimeout(() => setSuccess(null), 3000)
      }).catch(err => {
        setError(`Failed to update schedule: ${err.message}`)
        console.error('Update schedule error:', err)
      }).finally(() => {
        setIsSaving(false)
      })
    } catch (err) {
      setError(`Failed to update schedule: ${err.message}`)
      console.error('Update schedule error:', err)
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading region details...</p>
        </div>
      </div>
    )
  }

  if (!region) {
    return (
      <div className="screen">
        <div className="screen-body">
          <div className="error-message">Region not found</div>
          <button className="back-button" onClick={onBack}>
            ← Back to Regions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Screen 2: Region Configuration Detail</h2>
        <p>{region.name} • Edit delivery schedules</p>
      </div>

      <div className="screen-body">
        {error && <div className="error-message">❌ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <button className="back-button" onClick={onBack}>
          ← Back to Regions
        </button>

        <div style={{ marginBottom: '20px' }}>
          <strong>Region:</strong> {region.name}
        </div>

        {/* Cutoff Settings - At Top, Applies to All Schedules */}
        {!showCutoffEdit ? (
          <div style={{ background: '#e3f2fd', border: '2px solid #667eea', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#667eea', fontSize: '14px' }}>🔔 Order Cutoff Time</strong>
                <p style={{ margin: '6px 0 0 0', color: '#333', fontSize: '13px' }}>
                  <strong>{region.cutoff_time}</strong> applies to all delivery days below (cutoff day is per-schedule)
                </p>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  setCutoffEdit({
                    cutoff_time: region.cutoff_time,
                  })
                  setShowCutoffEdit(true)
                }}
                style={{ height: 'fit-content' }}
              >
                Edit Time
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fffacd', border: '2px solid #ffd700', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <strong style={{ color: '#b8860b', fontSize: '14px' }}>🔔 Edit Order Cutoff Time</strong>
            <div style={{ display: 'flex', gap: '15px', marginTop: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>Cutoff Time (applies to all delivery days)</label>
                <input
                  type="time"
                  value={cutoffEdit.cutoff_time}
                  onChange={(e) => setCutoffEdit({ ...cutoffEdit, cutoff_time: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-small" onClick={handleSaveCutoff} disabled={isSaving}>✓ Save</button>
              <button className="btn btn-secondary btn-small" onClick={() => setShowCutoffEdit(false)}>✕ Cancel</button>
            </div>
          </div>
        )}

        {/* Location Field - At Top, Applies to All Orders */}
        {!showLocationEdit ? (
          <div style={{ background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#4caf50', fontSize: '14px' }}>📍 Location</strong>
                <p style={{ margin: '6px 0 0 0', color: '#333', fontSize: '13px' }}>
                  <strong>{region.location || '(Not set)'}</strong> applies to all orders from this region
                </p>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => {
                  setLocationEdit({
                    location: region.location || '',
                  })
                  setShowLocationEdit(true)
                }}
                style={{ height: 'fit-content' }}
              >
                Edit Location
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fffacd', border: '2px solid #ffd700', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <strong style={{ color: '#b8860b', fontSize: '14px' }}>📍 Edit Location</strong>
            <div style={{ display: 'flex', gap: '15px', marginTop: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>Location (e.g., WOM, IKU)</label>
                <input
                  type="text"
                  value={locationEdit.location}
                  onChange={(e) => setLocationEdit({ ...locationEdit, location: e.target.value })}
                  placeholder="Enter location (WOM)"
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-small" onClick={handleSaveLocation} disabled={isSaving}>✓ Save</button>
              <button className="btn btn-secondary btn-small" onClick={() => setShowLocationEdit(false)}>✕ Cancel</button>
            </div>
          </div>
        )}

        <div className="info-box">
          <strong>📌 Delivery Schedules:</strong> Configure cutoff/pack/delivery days and select delivery windows.
        </div>

        {schedules && schedules.length > 0 ? (
          <div>
            {schedules.map(schedule => (
              <div key={schedule.id} className={`schedule-card ${schedule.is_default ? 'active' : ''}`}>
                <div className="schedule-flow">
                  <div className="flow-item">
                    <label>Cutoff Day</label>
                    <select value={getDayName(schedule.cutoff_day)} onChange={(e) => {
                      handleScheduleUpdate(schedule.id, { cutoff_day: e.target.value })
                    }}>
                      {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                    </select>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-item">
                    <label>Ship Day</label>
                    <select value={getDayName(schedule.pack_day)} onChange={(e) => {
                      handleScheduleUpdate(schedule.id, { pack_day: e.target.value })
                    }}>
                      {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                    </select>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-item">
                    <label>Delivery Day</label>
                    <select value={getDayName(schedule.delivery_day)} onChange={(e) => {
                      handleScheduleUpdate(schedule.id, { delivery_day: e.target.value })
                    }}>
                      {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                    </select>
                  </div>
                </div>
                <div className="schedule-footer">
                  <div className="schedule-hours" style={{ flex: 1 }}>
                    <label>Delivery Windows (select one or both)</label>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                        <input 
                          type="checkbox" 
                          checked={schedule.hours && (schedule.hours === 'AM' || schedule.hours.includes('AM'))} 
                          onChange={(e) => {
                            let newHours = schedule.hours || '';
                            const hasAM = newHours.includes('AM');
                            const hasBH = newHours.includes('Business Hours');
                            
                            if (e.target.checked && !hasAM) {
                              // Add AM
                              newHours = hasBH ? 'AM,Business Hours' : 'AM';
                            } else if (!e.target.checked && hasAM) {
                              // Remove AM
                              newHours = hasBH ? 'Business Hours' : '';
                            }
                            handleScheduleUpdate(schedule.id, { hours: newHours });
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                        />
                        AM (12:00 AM - 7:00 AM)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                        <input 
                          type="checkbox" 
                          checked={schedule.hours && (schedule.hours === 'Business Hours' || schedule.hours.includes('Business Hours'))} 
                          onChange={(e) => {
                            let newHours = schedule.hours || '';
                            const hasAM = newHours.includes('AM');
                            const hasBH = newHours.includes('Business Hours');
                            
                            if (e.target.checked && !hasBH) {
                              // Add Business Hours
                              newHours = hasAM ? 'AM,Business Hours' : 'Business Hours';
                            } else if (!e.target.checked && hasBH) {
                              // Remove Business Hours
                              newHours = hasAM ? 'AM' : '';
                            }
                            handleScheduleUpdate(schedule.id, { hours: newHours });
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                        />
                        Business Hours (8:00 AM - 6:00 PM)
                      </label>
                    </div>
                  </div>
                  <div className="schedule-actions">
                    <button className={`toggle-switch ${schedule.enabled ? 'active' : ''}`} onClick={() => handleToggleSchedule(schedule.id)} title={schedule.enabled ? 'Disable' : 'Enable'} />
                    <button className="btn-icon" onClick={() => handleSetDefault(schedule.id)} style={{ color: schedule.is_default ? '#667eea' : '#ccc' }}>★</button>
                    <button className="btn-icon" onClick={() => handleDeleteSchedule(schedule.id)} style={{ color: '#c33' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999' }}>No schedules configured</p>
        )}

        {!showAddForm ? (
          <button className="add-button" onClick={() => setShowAddForm(true)}>+ Add Schedule</button>
        ) : (
          <div className="schedule-card" style={{ backgroundColor: '#fffacd', borderColor: '#ffd700' }}>
            <div className="schedule-flow">
              <div className="flow-item"><label>Cutoff Day</label><select value={newSchedule.cutoff_day} onChange={(e) => setNewSchedule({ ...newSchedule, cutoff_day: e.target.value })}>{DAYS.map(day => (<option key={day} value={day}>{day}</option>))}</select></div>
              <div className="flow-arrow">→</div>
              <div className="flow-item"><label>Ship Day</label><select value={newSchedule.pack_day} onChange={(e) => setNewSchedule({ ...newSchedule, pack_day: e.target.value })}>{DAYS.map(day => (<option key={day} value={day}>{day}</option>))}</select></div>
              <div className="flow-arrow">→</div>
              <div className="flow-item"><label>Delivery Day</label><select value={newSchedule.delivery_day} onChange={(e) => setNewSchedule({ ...newSchedule, delivery_day: e.target.value })}>{DAYS.map(day => (<option key={day} value={day}>{day}</option>))}</select></div>
            </div>
            <div className="schedule-footer">
              <div className="schedule-hours" style={{ flex: 1 }}>
                <label>Delivery Windows (select one or both)</label>
                <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                    <input type="checkbox" checked={newSchedule.hours && newSchedule.hours.includes('AM')} onChange={(e) => {
                      let hours = newSchedule.hours || '';
                      if (e.target.checked) {
                        hours = hours ? 'AM,Business Hours' : 'AM';
                      } else {
                        hours = hours.replace('AM,', '').replace(',AM', '').replace('AM', '');
                      }
                      setNewSchedule({ ...newSchedule, hours })
                    }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    AM (12:00 AM - 7:00 AM)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 'normal' }}>
                    <input type="checkbox" checked={newSchedule.hours && newSchedule.hours.includes('Business Hours')} onChange={(e) => {
                      let hours = newSchedule.hours || '';
                      if (e.target.checked) {
                        hours = hours ? 'AM,Business Hours' : 'Business Hours';
                      } else {
                        hours = hours.replace('AM,', '').replace(',AM', '').replace('Business Hours', '');
                      }
                      setNewSchedule({ ...newSchedule, hours })
                    }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    Business Hours (8:00 AM - 6:00 PM)
                  </label>
                </div>
              </div>
              <div className="schedule-actions">
                <button className="btn btn-primary btn-small" onClick={handleAddSchedule} disabled={isSaving} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                  {isSaving ? 'Saving...' : '✓ Save Schedule'}
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => setShowAddForm(false)}>✕ Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button className="btn btn-secondary" onClick={onBack}>Done Editing</button>
        </div>
      </div>
    </div>
  )


}
