import { useState } from 'react'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import Head from 'next/head'

const CUTOFF = new Date('2026-07-01')

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function mapsUrl(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  let cls = 'badge-unknown'
  if (s === 'confirmed') cls = 'badge-confirmed'
  else if (s === 'pending') cls = 'badge-pending'
  else if (s === 'cancelled' || s === 'canceled') cls = 'badge-cancelled'
  return <span className={`badge ${cls}`}>{status || 'Unknown'}</span>
}

export default function Home({ gigs, months }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? gigs : gigs.filter(g => g.month === filter)

  // Group by month label for divider rows
  const rows = []
  let lastMonth = null
  filtered.forEach(g => {
    if (g.monthLabel !== lastMonth) {
      rows.push({ type: 'header', label: g.monthLabel, month: g.month })
      lastMonth = g.monthLabel
    }
    rows.push({ type: 'gig', ...g })
  })

  return (
    <>
      <Head>
        <title>2026 Mambo Soul Gigs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header>
        <h1>2026 Mambo Soul Gigs</h1>
        <p>Upcoming Performances &amp; Events</p>
      </header>

      <div className="controls">
        <label htmlFor="month-filter">Filter by Month:</label>
        <select id="month-filter" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Months</option>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        {rows.length === 0 ? (
          <p className="no-gigs">No gigs found for this month.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day / Time</th>
                <th>Type</th>
                <th>Venue</th>
                <th>City</th>
                <th>Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) =>
                row.type === 'header' ? (
                  <tr key={`h-${i}`} className="month-header">
                    <td colSpan={7}>{row.label}</td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td className="col-date">{row.date}</td>
                    <td className="col-daytime">
                      {row.day}<br />
                      <span className="col-time">{row.time}</span>
                    </td>
                    <td><span className="type-pill">{row.type}</span></td>
                    <td>{row.name}</td>
                    <td>{row.city}</td>
                    <td className="col-address">
                      {row.address && !row.address.toLowerCase().startsWith('tbd') ? (
                        <a href={mapsUrl(row.address)} target="_blank" rel="noreferrer">{row.address}</a>
                      ) : (
                        <span>{row.address}</span>
                      )}
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx global>{`
        :root {
          --maroon: #800020;
          --sienna: #A0522D;
          --cream: #FFF8E7;
          --mustard: #E3A020;
          --mustard-light: #F5C84A;
          --dark: #2a0a0a;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: var(--cream);
          font-family: Georgia, 'Times New Roman', serif;
          color: var(--dark);
          min-height: 100vh;
        }
        header {
          background: var(--maroon);
          padding: 36px 24px 28px;
          text-align: center;
          border-bottom: 6px solid var(--mustard);
        }
        header h1 {
          font-size: 2.6rem;
          color: var(--cream);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        header p {
          color: var(--mustard-light);
          font-size: 1rem;
          margin-top: 6px;
          letter-spacing: 0.08em;
        }
        .controls {
          max-width: 1100px;
          margin: 28px auto 0;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .controls label {
          font-weight: bold;
          color: var(--maroon);
          font-size: 0.95rem;
        }
        .controls select {
          background: white;
          border: 2px solid var(--sienna);
          color: var(--dark);
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 0.95rem;
          cursor: pointer;
          outline: none;
        }
        .controls select:focus { border-color: var(--maroon); }
        .table-wrap {
          max-width: 1100px;
          margin: 24px auto 48px;
          padding: 0 20px;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 3px 16px rgba(128,0,32,0.10);
        }
        thead tr {
          background: var(--maroon);
          color: var(--cream);
        }
        thead th {
          padding: 14px 18px;
          text-align: left;
          font-size: 0.85rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: bold;
          border-bottom: 3px solid var(--mustard);
        }
        tbody tr { border-bottom: 1px solid #f0e8d6; transition: background 0.14s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: #fdf4e3; }
        tbody td { padding: 14px 18px; font-size: 0.93rem; vertical-align: middle; }
        .col-date { white-space: nowrap; font-weight: bold; color: var(--maroon); }
        .col-daytime { white-space: nowrap; color: var(--sienna); font-size: 0.88rem; }
        .col-time { color: #555; font-size: 0.85rem; }
        .type-pill {
          display: inline-block;
          background: var(--mustard);
          color: white;
          font-size: 0.72rem;
          font-weight: bold;
          padding: 3px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .col-address a { color: var(--sienna); text-decoration: none; font-size: 0.88rem; }
        .col-address a:hover { text-decoration: underline; }
        .col-address span { font-size: 0.88rem; color: #666; }
        .badge {
          font-size: 0.72rem;
          font-weight: bold;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .badge-confirmed  { background: #d4edda; color: #1a6630; }
        .badge-pending    { background: #fff3cd; color: #856404; }
        .badge-cancelled  { background: #f8d7da; color: #842029; }
        .badge-unknown    { background: #e2e3e5; color: #41464b; }
        .month-header td {
          background: var(--sienna);
          color: var(--cream);
          font-size: 0.85rem;
          font-weight: bold;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 8px 18px;
        }
        .no-gigs {
          text-align: center;
          color: var(--sienna);
          font-size: 1rem;
          padding: 32px;
        }
        @media (max-width: 700px) {
          header h1 { font-size: 1.8rem; }
          thead th, tbody td { padding: 10px 10px; font-size: 0.8rem; }
        }
      `}</style>
    </>
  )
}

export async function getStaticProps() {
  const csvPath = path.join(process.cwd(), '2026 - Mambo Soul Gigs.csv')
  const raw = fs.readFileSync(csvPath, 'utf-8')
  const { data } = Papa.parse(raw, { header: true, skipEmptyLines: true })

  const gigs = []
  const monthSet = new Map()

  data.forEach(row => {
    const d = parseDate(row['Date'])
    if (!d || d < CUTOFF) return

    const monthValue = String(d.getMonth() + 1)
    const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    monthSet.set(monthValue, monthLabel)

    gigs.push({
      date: formatDate(d),
      day: (row['Day of Week'] || '').trim(),
      time: (row['Time'] || '').trim(),
      type: (row['Gig Type'] || '').trim(),
      name: (row['Name'] || '').trim(),
      city: (row['City'] || '').trim(),
      address: (row['Address'] || '').trim(),
      status: (row['Status'] || '').trim(),
      month: monthValue,
      monthLabel,
      _ts: d.getTime(),
    })
  })

  gigs.sort((a, b) => a._ts - b._ts)

  const months = Array.from(monthSet.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([value, label]) => ({ value, label }))

  return { props: { gigs, months } }
}
