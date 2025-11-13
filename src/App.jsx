import { useEffect, useMemo, useState } from 'react'

function StatCard({ label, value, trend }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-3xl font-semibold text-gray-800">{value ?? '—'}</div>
        {typeof trend === 'number' && (
          <div className={`text-xs px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
  }
  return <span className={`text-xs px-2 py-1 rounded-full ${colors[color]}`}>{children}</span>
}

function IncidentRow({ inc }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 text-sm text-gray-700">{inc.incident_id}</td>
      <td className="py-2 text-sm"><Badge color="blue">{inc.type}</Badge></td>
      <td className="py-2 text-sm"><Badge color={{ low:'green', medium:'amber', high:'red', critical:'red' }[inc.severity] || 'gray'}>{inc.severity}</Badge></td>
      <td className="py-2 text-sm"><Badge color="violet">{inc.status}</Badge></td>
      <td className="py-2 text-sm text-gray-600">{inc.precinct || '—'}</td>
      <td className="py-2 text-sm text-gray-600">{inc.response_minutes ?? '—'}</td>
    </tr>
  )
}

export default function App() {
  const [summary, setSummary] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', severity: '', status: '', precinct: '' })

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const fetchData = async () => {
    setLoading(true)
    try {
      const s = await fetch(`${backend}/analytics/summary`).then(r => r.json())
      setSummary(s)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const list = await fetch(`${backend}/incidents?${params.toString()}`).then(r => r.json())
      setIncidents(list.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const onSeed = async () => {
    await fetch(`${backend}/incidents/seed?n=80`, { method: 'POST' })
    await fetchData()
  }

  const types = ['theft','assault','burglary','fraud','vandalism','traffic','narcotics','disturbance','other']
  const severities = ['low','medium','high','critical']
  const statuses = ['reported','dispatched','on_scene','resolved','closed']
  const precincts = ['Central','North','South','East','West']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="p-6 border-b bg-white/80 backdrop-blur sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Police Smart Analytics</h1>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Refresh</button>
            <button onClick={onSeed} className="px-3 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">Seed sample data</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Incidents" value={summary?.total} />
          <StatCard label="Open Cases" value={summary?.open} />
          <StatCard label="Avg Response (min)" value={summary?.avg_response_minutes ?? '—'} />
          <StatCard label="High/Critical" value={(summary?.by_severity?.high || 0) + (summary?.by_severity?.critical || 0)} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="grid sm:grid-cols-5 gap-3">
            <select className="w-full border rounded-md p-2 text-sm" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="w-full border rounded-md p-2 text-sm" value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
              <option value="">All Severities</option>
              {severities.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="w-full border rounded-md p-2 text-sm" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="w-full border rounded-md p-2 text-sm" value={filters.precinct} onChange={e => setFilters({ ...filters, precinct: e.target.value })}>
              <option value="">All Precincts</option>
              {precincts.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={fetchData} className="px-3 py-2 text-sm rounded-md bg-gray-900 text-white">Apply</button>
          </div>
        </div>

        {/* By Type Chart substitute */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">Incidents by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {summary && Object.entries(summary.by_type || {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-indigo-100 rounded">
                  <div className="h-2 bg-indigo-600 rounded" style={{ width: `${Math.min(100, (v / Math.max(1, summary.total)) * 100)}%` }} />
                </div>
                <div className="text-sm text-gray-700 whitespace-nowrap">{k} ({v})</div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-gray-500 border-b">
                  <th className="py-2">ID</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Severity</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Precinct</th>
                  <th className="py-2">Response (min)</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => <IncidentRow key={inc.id} inc={inc} />)}
                {!incidents.length && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500 text-sm">
                      {loading ? 'Loading…' : 'No incidents yet. Use "Seed sample data" to generate demo records.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
