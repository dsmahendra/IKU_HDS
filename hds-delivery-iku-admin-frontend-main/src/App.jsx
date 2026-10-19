import React, { useState, useEffect } from 'react'
import axios from 'axios'
import api from './api'
import './App.css'
import Login from './components/Login'
import RegionsList from './components/RegionsList'
import RegionDetail from './components/RegionDetail'
import SuburbsList from './components/SuburbsList'
import BlackoutDates from './components/BlackoutDates'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = checking session, null = logged out
  const [page, setPage] = useState('regions') // 'regions', 'detail', 'suburbs', or 'blackout'
  const [selectedRegionId, setSelectedRegionId] = useState(null)
  const [regions, setRegions] = useState([])

  // Check for an existing login session
  useEffect(() => {
    axios
      .get('/api/auth/session')
      .then((res) => setUser(res.data.username))
      .catch(() => setUser(null))
  }, [])

  // Load regions for dropdowns once logged in
  useEffect(() => {
    if (user) fetchRegions()
  }, [user])

  async function handleLogout() {
    try {
      await axios.post('/api/auth/logout')
    } finally {
      setUser(null)
      setPage('regions')
      setSelectedRegionId(null)
    }
  }

  async function fetchRegions() {
    try {
      const response = await api.get('/regions')
      setRegions(response.data.data || [])
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  const handleViewRegion = (regionId) => {
    setSelectedRegionId(regionId)
    setPage('detail')
  }

  const handleBack = () => {
    setPage('regions')
    setSelectedRegionId(null)
  }

  const handleGoToSuburbs = () => {
    setPage('suburbs')
  }

  if (user === undefined) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content header-with-user">
          <div>
            <h1>🚚 HDS Delivery IKU Admin</h1>
            <p>Manage delivery regions and schedules</p>
          </div>
          <div className="header-user">
            <span>👤 {user}</span>
            <button className="btn btn-secondary btn-small" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        {page !== 'detail' && (
          <nav className="app-nav">
            <button
              className={`nav-tab ${page === 'regions' ? 'active' : ''}`}
              onClick={() => setPage('regions')}
            >
              Screen 1: Regions
            </button>
            <button
              className={`nav-tab ${page === 'suburbs' ? 'active' : ''}`}
              onClick={() => setPage('suburbs')}
            >
              Screen 3: Suburbs
            </button>
            <button
              className={`nav-tab ${page === 'blackout' ? 'active' : ''}`}
              onClick={() => setPage('blackout')}
            >
              Screen 4: Blackout Dates
            </button>
          </nav>
        )}
      </header>

      <main className="app-main">
        {page === 'regions' && (
          <RegionsList onSelectRegion={handleViewRegion} />
        )}

        {page === 'detail' && selectedRegionId && (
          <RegionDetail regionId={selectedRegionId} onBack={handleBack} />
        )}

        {page === 'suburbs' && (
          <SuburbsList regions={regions} />
        )}

        {page === 'blackout' && (
          <BlackoutDates />
        )}
      </main>

      <footer className="app-footer">
        <p>HDS Delivery IKU Admin • Workout Meals</p>
      </footer>
    </div>
  )
}
