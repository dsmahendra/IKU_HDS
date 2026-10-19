import React, { useState, useEffect } from 'react'
import api from '../api'
import RegionCard from './RegionCard'
import AddRegionModal from './AddRegionModal'

export default function RegionsList({ onSelectRegion }) {
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'enabled', 'disabled'
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkActionsVisible, setBulkActionsVisible] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)


  // Fetch regions on mount
  useEffect(() => {
    fetchRegions()
  }, [])

  async function fetchRegions() {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/regions')
      setRegions(response.data.data || [])
    } catch (err) {
      setError(`Failed to load regions: ${err.message}`)
      console.error('Error fetching regions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle region toggle
  async function handleToggleRegion(regionId, currentStatus) {
    try {
      const endpoint = currentStatus ? 'disable' : 'enable'
      const response = await api.put(`/regions/${regionId}/${endpoint}`)

      // Update local state
      setRegions(
        regions.map((r) =>
          r.id === regionId ? { ...r, enabled: !currentStatus } : r
        )
      )

      setSuccess(`Region ${!currentStatus ? 'enabled' : 'disabled'}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to update region: ${err.message}`)
      console.error('Error toggling region:', err)
    }
  }

  // Handle bulk actions
  function handleSelectAll(e) {
    if (e.target.checked) {
      setSelectedIds(new Set(regions.map((r) => r.id)))
      setBulkActionsVisible(true)
    } else {
      setSelectedIds(new Set())
      setBulkActionsVisible(false)
    }
  }

  function handleSelectRegion(regionId, checked) {
    const newSelected = new Set(selectedIds)

    if (checked) {
      newSelected.add(regionId)
    } else {
      newSelected.delete(regionId)
    }

    setSelectedIds(newSelected)
    setBulkActionsVisible(newSelected.size > 0)
  }

  async function handleBulkEnable() {
    await performBulkAction('enable')
  }

  async function handleBulkDisable() {
    await performBulkAction('disable')
  }

  async function performBulkAction(action) {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setBulkLoading(true)

    try {
      const endpoint =
        action === 'enable' ? '/regions/bulk/enable' : '/regions/bulk/disable'
      await api.post(endpoint, { ids })

      // Update local state
      setRegions(
        regions.map((r) =>
          ids.includes(r.id) ? { ...r, enabled: action === 'enable' } : r
        )
      )

      setSuccess(`${ids.length} region(s) ${action === 'enable' ? 'enabled' : 'disabled'}`)
      setSelectedIds(new Set())
      setBulkActionsVisible(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Bulk action failed: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setBulkLoading(false)
    }
  }



  // Filter regions based on search and status
  const filteredRegions = regions.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || (statusFilter === 'enabled') === Boolean(r.enabled))
  )

  const allSelected = selectedIds.size === regions.length && regions.length > 0
  const indeterminate = selectedIds.size > 0 && !allSelected

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Screen 1: Delivery Regions</h2>
        <p>Manage HDS regions with quick toggles and bulk actions</p>
      </div>

      <div className="screen-body">
        {error && <div className="error-message">❌ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <div className="header-bar">
          <div className="search-filter">
            <input
              type="text"
              className="search-input"
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="search-input status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Region
          </button>
        </div>

        {showAddModal && (
          <AddRegionModal
            onClose={() => setShowAddModal(false)}
            onCreated={(region) => {
              setRegions([...regions, region])
              setShowAddModal(false)
              setSuccess(`Region "${region.name}" added`)
              setTimeout(() => setSuccess(null), 3000)
            }}
          />
        )}

        {bulkActionsVisible && (
          <div className="bulk-actions show">
            <input
              type="checkbox"
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={handleSelectAll}
            />
            <span>{selectedIds.size} region(s) selected</span>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleBulkEnable}
              disabled={bulkLoading}
            >
              Enable All
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleBulkDisable}
              disabled={bulkLoading}
            >
              Disable All
            </button>
          </div>
        )}

        <div className="info-box">
          <strong>💡 Quick tip:</strong> Click status to enable/disable. Checkbox for bulk actions.
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading regions...</p>
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="loading">
            <p>No regions found</p>
          </div>
        ) : (
          <div>
            {filteredRegions.map((region) => (
              <RegionCard
                key={region.id}
                region={region}
                selected={selectedIds.has(region.id)}
                onSelect={(checked) => handleSelectRegion(region.id, checked)}
                onToggle={() => handleToggleRegion(region.id, region.enabled)}
                onViewConfig={() => onSelectRegion(region.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
