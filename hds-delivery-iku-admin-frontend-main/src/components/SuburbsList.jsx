import React, { useState, useEffect } from 'react'
import api from '../api'

export default function SuburbsList({ regions }) {
  const [suburbs, setSuburbs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkRegionId, setBulkRegionId] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const itemsPerPage = 50

  // Fetch suburbs on mount and when filters change
  useEffect(() => {
    fetchSuburbs()
  }, [searchTerm, selectedRegionFilter, page])

  async function fetchSuburbs() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page,
        limit: itemsPerPage,
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedRegionFilter) params.append('regionId', selectedRegionFilter)

      const response = await api.get(`/suburbs?${params}`)
      setSuburbs(response.data.data || [])
      setPagination(response.data.pagination || {})
    } catch (err) {
      setError(`Failed to load suburbs: ${err.message}`)
      console.error('Error fetching suburbs:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectSuburb(suburbId, checked) {
    const newSelected = new Set(selectedIds)

    if (checked) {
      newSelected.add(suburbId)
    } else {
      newSelected.delete(suburbId)
    }

    setSelectedIds(newSelected)
  }

  async function handleBulkAssignRegion() {
    if (selectedIds.size === 0) {
      setError('Please select suburbs first')
      return
    }

    if (!bulkRegionId) {
      setError('Please select a region')
      return
    }

    setBulkLoading(true)

    try {
      const ids = Array.from(selectedIds)
      await api.post('/suburbs/bulk/assign-region', {
        ids,
        region_id: parseInt(bulkRegionId),
      })

      setSuccess(`${ids.length} suburb(s) assigned to region`)
      setSelectedIds(new Set())
      setBulkRegionId('')
      await fetchSuburbs()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Bulk assign failed: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleDeleteSuburb(suburbId) {
    if (!confirm('Are you sure you want to delete this suburb?')) return

    try {
      await api.delete(`/suburbs/${suburbId}`)
      setSuccess('Suburb deleted')
      await fetchSuburbs()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to delete suburb: ${err.message}`)
    }
  }

  async function handleImportCSV(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result
        const lines = csv.split('\n')
        const suburbs = []

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const [name, postcode, state, region_id] = line.split(',').map(v => v.trim())
          if (name && postcode && state) {
            suburbs.push({
              name,
              postcode: parseInt(postcode),
              state,
              region_id: region_id ? parseInt(region_id) : null,
            })
          }
        }

        const response = await api.post('/suburbs/import', { suburbs })
        setSuccess(
          `Imported ${response.data.inserted} suburbs, skipped ${response.data.skipped}`
        )
        await fetchSuburbs()
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(`Import failed: ${err.message}`)
      }
    }

    reader.readAsText(file)
  }

  const getRegionName = (regionId) => {
    if (!regionId) return 'Unassigned'
    const region = regions.find(r => r.id === regionId)
    return region?.name || 'Unknown'
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Screen 3: Suburbs & Postcodes Mapping</h2>
        <p>Manage suburb to region assignments. Synced from HDS API daily.</p>
      </div>

      <div className="screen-body">
        {error && <div className="error-message">❌ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <div className="header-bar">
          <div className="search-filter">
            <input
              type="text"
              className="search-input"
              placeholder="Search suburb or postcode..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
            />
            <select
              style={{ padding: '10px 15px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
              value={selectedRegionFilter}
              onChange={(e) => {
                setSelectedRegionFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <label className="btn btn-secondary btn-small" style={{ cursor: 'pointer' }}>
            📥 Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {selectedIds.size > 0 && (
          <div className="bulk-actions show">
            <input type="checkbox" disabled />
            <span>{selectedIds.size} suburb(s) selected</span>
            <select
              value={bulkRegionId}
              onChange={(e) => setBulkRegionId(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #e0e0e0' }}
            >
              <option value="">Select Region</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleBulkAssignRegion}
              disabled={bulkLoading || !bulkRegionId}
            >
              Assign Region
            </button>
          </div>
        )}

        <div className="info-box">
          <strong>Source:</strong> Data pulled from HDS API. Updates automatically when HDS
          changes regions or adds suburbs.
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading suburbs...</p>
          </div>
        ) : suburbs.length === 0 ? (
          <div className="loading">
            <p>No suburbs found</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" disabled />
                  </th>
                  <th>Suburb</th>
                  <th>Postcode</th>
                  <th>State</th>
                  <th>Assigned Region</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suburbs.map(suburb => (
                  <tr key={suburb.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(suburb.id)}
                        onChange={(e) => handleSelectSuburb(suburb.id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <strong>{suburb.name}</strong>
                    </td>
                    <td>{suburb.postcode}</td>
                    <td>{suburb.state}</td>
                    <td>
                      <span className="region-badge">
                        {suburb.region_name || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {suburb.updated_at
                        ? new Date(suburb.updated_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteSuburb(suburb.id)}
                        style={{ color: '#c33' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages && pagination.pages > 1 && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span style={{ margin: '0 15px', color: '#666' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
