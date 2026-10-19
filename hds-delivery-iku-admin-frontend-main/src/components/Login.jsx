import React, { useState } from 'react'
import axios from 'axios'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Auth endpoints live on this site (Vercel functions), not the Railway backend
      const response = await axios.post('/api/auth/login', { username, password })
      onLogin(response.data.username)
    } catch (err) {
      setError(err.response?.data?.error || `Login failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>🚚 HDS Delivery IKU Admin</h1>
        <p>Sign in to manage delivery regions and schedules</p>

        {error && <div className="error-message">❌ {error}</div>}

        <label htmlFor="login-username">Username</label>
        <input
          id="login-username"
          className="search-input"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className="search-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
