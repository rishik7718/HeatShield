import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  CloudSun,
  Download,
  Flame,
  HardHat,
  LayoutDashboard,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  Wind,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchOverview } from './api'
import type { Overview, Zone } from './types'
import HeatRiskCalculator from './HeatRiskCalculator'
import OperationsTools from './OperationsTools'

const emptyOverview: Overview = {
  site_name: 'Site not configured',
  site_status: 'NO DATA',
  active_workers: 0,
  high_risk_zones: 0,
  breaks_due: 0,
  compliance_pct: 0,
  estimated_wages: 0,
  zones: [],
  hourly_wbgt: [],
  compliance: [],
  alerts: [],
}

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)

function Metric({
  title,
  value,
  icon: Icon,
  tone,
  foot,
}: {
  title: string
  value: string | number
  icon: typeof Activity
  tone: string
  foot: string
}) {
  return (
    <article className="metric">
      <div className="metric-top">
        {title}
        <span className={`metric-icon ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      <small>{foot}</small>
    </article>
  )
}

function ZoneRow({ z }: { z: Zone }) {
  return (
    <div className="zone-row">
      <div>
        <b>{z.name}</b>
        <small>
          <MapPinned size={12} /> {z.location}
        </small>
      </div>

      <strong className="heat">{z.wbgt_c.toFixed(1)}°C</strong>

      <div>
        <b>
          {z.work_minutes}/{z.rest_minutes}
        </b>
        <small>work / rest min</small>
      </div>

      <span>
        {z.workers} <Users size={12} />
      </span>

      <span className={`risk ${z.risk.toLowerCase()}`}>
        {z.risk}
      </span>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<Overview>(emptyOverview)
  const [mode, setMode] = useState('CONNECTING')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [section, setSection] = useState('Overview')

  async function refresh() {
    setBusy(true)

    try {
      const result = await fetchOverview()

      setData(result)
      setMode('API CONNECTED')
      setError('')
    } catch {
      setData(emptyOverview)
      setMode('API UNAVAILABLE')
      setError(
        'Could not load dashboard data. Start the backend and refresh. No sample measurements are being displayed.'
      )
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const nav = [
    ['Overview', LayoutDashboard],
    ['Live site map', MapPinned],
    ['Workforce', Users],
    ['Compliance', ShieldCheck],
    ['Wage ledger', Wallet],
    ['Heat risk calculator', Activity],
  ] as const

  const peakWbgt =
    data.hourly_wbgt.length > 0
      ? Math.max(...data.hourly_wbgt.map((point) => point.wbgt))
      : null

  const criticalAlerts = data.alerts.filter(
    (alert) => alert.level === 'critical'
  ).length

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Flame size={22} />
          </span>
          <div>
            <b>
              HEATSHIELD <em>AI</em>
            </b>
            <small>FIELD SAFETY SYSTEMS</small>
          </div>
        </div>

        <label>WORKSPACE</label>

        <div className="site-select">
          <span>
            <HardHat size={17} />
          </span>
          <div>
            <b>{data.site_name}</b>
            <small>Site information from API</small>
          </div>
        </div>

        <label>OPERATIONS</label>

        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              className={section === name ? 'selected' : ''}
              onClick={() => setSection(name)}
            >
              <Icon size={17} />
              {name}
            </button>
          ))}
        </nav>

        <div className="side-bottom">
          <div className="engine">
            <i />
            <div>
              <b>API connection</b>
              <small>{mode}</small>
            </div>
          </div>

          <div className="profile">
            <span>OP</span>
            <div>
              <b>Operations</b>
              <small>Safety dashboard</small>
            </div>
          </div>
        </div>
      </aside>

      <main>
        <header>
          <span>
            Operations　/　<b>{section}</b>
          </span>

          <div className="top-right">
            <span className={mode === 'API CONNECTED' ? 'online' : ''}>
              ● {mode}
            </span>
            <Bell size={18} />
            <span className="avatar">OP</span>
          </div>
        </header>

        {section === 'Heat risk calculator' ? (
          <HeatRiskCalculator />
        ) : section !== 'Overview' ? (
          <OperationsTools section={section} />
        ) : (
          <div className="content">
            <section className="heading">
              <div>
                <label className="eyebrow">
                  OCCUPATIONAL HEAT INTELLIGENCE
                </label>
                <h1>
                  Safety operations <span>center</span>
                </h1>
                <p>
                  Monitor heat exposure, protect crews, and maintain a
                  verifiable safety record.
                </p>
              </div>

              <div className="actions">
                <span
                  className={
                    mode === 'API CONNECTED' ? 'connected' : 'demo'
                  }
                >
                  {mode}
                </span>

                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={busy}
                >
                  <RefreshCw
                    size={14}
                    className={busy ? 'spin' : ''}
                  />
                  {busy ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={() => window.print()}
                >
                  <Download size={14} />
                  Export report
                </button>
              </div>
            </section>

            {error && (
              <div className="warning">
                <AlertTriangle size={15} />
                {error}
              </div>
            )}

            <section className="site-banner">
              <span className="site-icon">
                <HardHat size={22} />
              </span>

              <div className="site-name">
                <b>{data.site_name}</b>
                <small>
                  {data.site_status === 'NO DATA'
                    ? 'Site status unavailable'
                    : `Status: ${data.site_status}`}
                </small>
              </div>

              <div className="banner-stat">
                <small>LOCAL CONDITIONS</small>
                <b>
                  <CloudSun size={15} />
                  No verified data
                </b>
              </div>

              <div className="banner-stat">
                <small>WIND SPEED</small>
                <b>
                  <Wind size={15} />
                  Not available
                </b>
              </div>

              <span className="demo-tag">
                <Activity size={13} />
                {data.site_status}
              </span>
            </section>

            <section className="metrics">
              <Metric
                title="ACTIVE WORKERS"
                value={data.active_workers}
                icon={Users}
                tone="blue"
                foot="Reported by API"
              />

              <Metric
                title="HIGH-RISK ZONES"
                value={data.high_risk_zones}
                icon={AlertTriangle}
                tone="red"
                foot="Reported by API"
              />

              <Metric
                title="BREAKS DUE SOON"
                value={data.breaks_due}
                icon={Clock3}
                tone="amber"
                foot="Reported by API"
              />

              <Metric
                title="SAFETY COMPLIANCE"
                value={
                  data.compliance.length > 0
                    ? `${data.compliance_pct.toFixed(1)}%`
                    : 'N/A'
                }
                icon={ShieldCheck}
                tone="green"
                foot={
                  data.compliance.length > 0
                    ? 'Based on available API data'
                    : 'No compliance history available'
                }
              />
            </section>

            <section className="columns">
              <article className="panel">
                <div className="panel-head">
                  <div>
                    <label>ENVIRONMENTAL MONITORING</label>
                    <h2>
                      Heat stress index <small>WBGT °C</small>
                    </h2>
                  </div>
                  <span className="live">API DATA</span>
                </div>

                <div className="legend">
                  <span>━ WBGT index</span>
                  <span>┄ Configured threshold</span>
                </div>

                {data.hourly_wbgt.length > 0 ? (
                  <>
                    <div className="chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.hourly_wbgt}
                          margin={{
                            top: 12,
                            right: 8,
                            left: -18,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="heatFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#ff624d"
                                stopOpacity={0.27}
                              />
                              <stop
                                offset="100%"
                                stopColor="#ff624d"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            stroke="#26323d"
                            strokeDasharray="3 5"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="time"
                            tick={{ fill: '#8493a0', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />

                          <YAxis
                            tick={{ fill: '#8493a0', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />

                          <Tooltip
                            contentStyle={{
                              background: '#111a23',
                              border: '1px solid #34414d',
                              borderRadius: 8,
                            }}
                            formatter={(value) => [
                              `${Number(value).toFixed(1)} °C`,
                              'WBGT',
                            ]}
                          />

                          <ReferenceLine
                            y={28}
                            stroke="#f4bd58"
                            strokeDasharray="5 5"
                          />

                          <Area
                            type="monotone"
                            dataKey="wbgt"
                            stroke="#ff624d"
                            strokeWidth={2.5}
                            fill="url(#heatFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-foot">
                      Peak exposure
                      <b>{peakWbgt?.toFixed(1)}°C</b>
                      <span>
                        Verify measurements and threshold before use.
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="description">
                    No WBGT time-series data is available from the API.
                    Air temperature or a weather-based heat index must not
                    be presented as a measured WBGT value.
                  </p>
                )}
              </article>

              <article className="panel">
                <div className="panel-head">
                  <div>
                    <label>ACTION REQUIRED</label>
                    <h2>Active risk alerts</h2>
                  </div>

                  <span className="critical">
                    {criticalAlerts} CRITICAL
                  </span>
                </div>

                <div className="alerts">
                  {data.alerts.map((alert) => (
                    <div className="alert" key={alert.id}>
                      <span className={`alert-icon ${alert.level}`}>
                        {alert.level === 'critical' ? (
                          <Flame size={17} />
                        ) : alert.level === 'warning' ? (
                          <Clock3 size={17} />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                      </span>

                      <div>
                        <b>{alert.title}</b>
                        <p>{alert.detail}</p>
                        <small>
                          {alert.time} · {alert.id}
                        </small>
                      </div>
                    </div>
                  ))}

                  {data.alerts.length === 0 && (
                    <p className="description">
                      No alert records are available. This does not
                      establish that the site is safe.
                    </p>
                  )}
                </div>

                <button
                  className="link-button"
                  onClick={() => setSection('Compliance')}
                >
                  View compliance logs →
                </button>
              </article>
            </section>

            <section className="columns lower">
              <article className="panel">
                <div className="panel-head">
                  <div>
                    <label>WORKSITE MONITORING</label>
                    <h2>
                      Site risk zones <small>{data.zones.length} ZONES</small>
                    </h2>
                  </div>

                  <button onClick={() => setSection('Live site map')}>
                    View site map ↗
                  </button>
                </div>

                <div className="zone-head">
                  <span>ZONE / LOCATION</span>
                  <span>WBGT</span>
                  <span>WORK / REST</span>
                  <span>CREW</span>
                  <span>RISK</span>
                </div>

                {data.zones.map((zone) => (
                  <ZoneRow key={zone.id} z={zone} />
                ))}

                {data.zones.length === 0 && (
                  <p className="description">
                    No site-zone records are available from the API.
                  </p>
                )}

                <div className="zone-note">
                  Use validated occupational guidance and verified
                  environmental measurements when assessing heat risk.
                </div>
              </article>

              <article className="panel">
                <div className="panel-head">
                  <div>
                    <label>AUDIT READINESS</label>
                    <h2>Break compliance</h2>
                  </div>

                  <strong className="score">
                    {data.compliance.length > 0
                      ? `${data.compliance_pct.toFixed(1)}%`
                      : 'N/A'}
                  </strong>
                </div>

                <p className="description">
                  Scheduled versus recorded breaks, when compliance
                  history is available.
                </p>

                {data.compliance.length > 0 ? (
                  <div className="bars">
                    {data.compliance.map((day) => {
                      const percentage =
                        day.total > 0
                          ? (day.compliant / day.total) * 100
                          : 0

                      return (
                        <div key={day.day}>
                          <div className="bar">
                            <i
                              style={{
                                height: `${Math.max(
                                  0,
                                  Math.min(100, percentage)
                                )}%`,
                              }}
                            />
                          </div>
                          <small>{day.day}</small>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="description">
                    No verified compliance history available.
                  </p>
                )}

                <div className="ledger">
                  <span>
                    <Wallet size={17} />
                  </span>

                  <div>
                    <b>Estimated shift wages</b>
                    <small>
                      API estimate; verify wage rules and records
                    </small>
                  </div>

                  <strong>{money(data.estimated_wages)}</strong>
                </div>
              </article>
            </section>

            <footer>
              <span>
                <Zap size={13} /> HEATSHIELD AI / SAFETY OPERATIONS PLATFORM
              </span>

              <span>
                Verify safety measurements and decisions.{' '}
                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  API docs ↗
                </a>
              </span>
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}