import { useEffect, useState } from 'react'
import {
  CloudSun,
  Wallet,
  BellRing,
  Clock,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react'

const api =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

type Weather = {
  temperature_c: number
  relative_humidity_pct: number
  wind_speed_kmh: number
  estimated_heat_index_c: number
  risk_level: string
  observed_at: string
  disclaimer: string
  error?: string
  detail?: string
}

type Card = {
  id: number
  worker_name: string
  work_minutes: number
  rest_minutes: number
  hourly_rate: number
  paid_hours: number
  estimated_wages: number
  temperature_c: number | null
  humidity_pct: number | null
  created_at: string
  activity_note: string
  wage_note: string
  notes: string
}

type Ledger = {
  records: Card[]
  record_count: number
  total_work_minutes: number
  total_rest_minutes: number
  total_paid_hours: number
  estimated_gross_wages: number
  notice: string
}

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)

type DeleteHandler = (
  id: number,
  workerName: string
) => Promise<void>

function DeleteButton({
  card,
  onDelete,
}: {
  card: Card
  onDelete: DeleteHandler
}) {
  return (
    <button
      type="button"
      onClick={() => void onDelete(card.id, card.worker_name)}
      style={{
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: '1px solid #b91c1c',
        borderRadius: 6,
        padding: '8px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: 'pointer',
        flexShrink: 0,
        fontWeight: 600,
        fontSize: 14,
        opacity: 1,
      }}
      aria-label={`Delete timecard for ${card.worker_name}`}
    >
      <Trash2 size={15} color="#ffffff" />
      Delete
    </button>
  )
}

function WageLedger({
  api,
  money,
  refreshKey,
  onDelete,
}: {
  api: string
  money: (n: number) => string
  refreshKey: number
  onDelete: DeleteHandler
}) {
  const [data, setData] = useState<Ledger | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)

    try {
      const response = await fetch(`${api}/api/v1/wage-ledger`)

      if (!response.ok) {
        throw new Error(`API ${response.status}`)
      }

      setData(await response.json())
      setError('')
    } catch {
      setError(
        'Could not load wage ledger. Check that the backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [refreshKey])

  return (
    <article className="panel" style={{ maxWidth: 1000 }}>
      <div className="panel-head">
        <div>
          <label>DERIVED FROM SAVED TIMECARDS</label>
          <h2>
            <Wallet size={20} /> Wage estimate ledger
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <RefreshCw size={14} />
          {loading ? 'Refreshing...' : 'Refresh ledger'}
        </button>
      </div>

      <p className="description">
        This ledger reads saved timecards and calculates wage estimates from
        recorded work minutes and hourly rates.
      </p>

      {error && <div className="warning">{error}</div>}

      {data && (
        <>
          <div className="metrics">
            <div className="metric">
              <div className="metric-top">SAVED RECORDS</div>
              <strong className="metric-value">
                {data.record_count}
              </strong>
            </div>

            <div className="metric">
              <div className="metric-top">TOTAL WORKED</div>
              <strong className="metric-value">
                {data.total_paid_hours} h
              </strong>
            </div>

            <div className="metric">
              <div className="metric-top">TOTAL REST</div>
              <strong className="metric-value">
                {Math.round((data.total_rest_minutes / 60) * 100) / 100} h
              </strong>
            </div>

            <div className="metric">
              <div className="metric-top">ESTIMATED GROSS WAGES</div>
              <strong className="metric-value">
                {money(data.estimated_gross_wages)}
              </strong>
            </div>
          </div>

          <p className="description">{data.notice}</p>

          {data.records.map((card) => (
            <div
              className="alert"
              key={card.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <b>{card.worker_name}</b>

                <p>
                  {card.paid_hours} payable hours ×{' '}
                  {money(card.hourly_rate)}/hour ={' '}
                  <strong>{money(card.estimated_wages)}</strong>
                </p>

                <small>
                  {card.work_minutes} work min · {card.rest_minutes} rest min
                  {' · '}recorded{' '}
                  {new Date(card.created_at).toLocaleString()}
                </small>
              </div>

              <DeleteButton card={card} onDelete={onDelete} />
            </div>
          ))}

          {data.records.length === 0 && (
            <p className="description">
              No saved timecards yet. New timecards will appear here.
            </p>
          )}
        </>
      )}
    </article>
  )
}

export default function OperationsTools({
  section,
}: {
  section: string
}) {
  const [lat, setLat] = useState('12.9716')
  const [lon, setLon] = useState('77.5946')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(false)

  const [worker, setWorker] = useState('Worker 001')
  const [work, setWork] = useState('480')
  const [rest, setRest] = useState('60')
  const [rate, setRate] = useState('100')
  const [card, setCard] = useState<Card | null>(null)

  const [risk, setRisk] = useState('HIGH')
  const [notice, setNotice] = useState('')
  const [temp, setTemp] = useState('')
  const [humidity, setHumidity] = useState('')
  const [notes, setNotes] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [ledgerRefreshKey, setLedgerRefreshKey] = useState(0)

  async function getWeather() {
    setLoading(true)

    try {
      const response = await fetch(`${api}/api/v1/weather-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: Number(lat),
          longitude: Number(lon),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error('Weather request failed')
      }

      setWeather(data)
    } catch {
      setWeather({
        error: 'Could not connect to backend',
        detail: 'Check that FastAPI is running.',
      } as Weather)
    } finally {
      setLoading(false)
    }
  }

  async function loadRecords() {
    try {
      const response = await fetch(`${api}/api/v1/timecards`)

      if (!response.ok) {
        throw new Error('Could not load timecards')
      }

      const data = await response.json()
      setCards(data.records ?? [])
    } catch {
      setNotice('Could not load saved timecards. Check the backend.')
    }
  }

  async function deleteTimecard(
    id: number,
    workerName: string
  ): Promise<void> {
    const confirmed = window.confirm(
      `Delete the timecard for ${workerName}? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`${api}/api/v1/timecards/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))

        setNotice(
          data.detail ?? 'Could not delete the timecard. Please try again.'
        )
        return
      }

      setNotice(`Timecard for ${workerName} deleted successfully.`)

      await loadRecords()

      // Refresh the wage ledger after a successful deletion.
      setLedgerRefreshKey((previous) => previous + 1)
    } catch {
      setNotice(
        'Could not connect to the backend to delete the timecard.'
      )
    }
  }

  async function timecard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      const response = await fetch(`${api}/api/v1/timecards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_name: worker,
          work_minutes: Number(work),
          rest_minutes: Number(rest),
          hourly_rate: Number(rate),
          temperature_c: temp === '' ? null : Number(temp),
          humidity_pct: humidity === '' ? null : Number(humidity),
          activity_source: 'manager_recorded',
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setNotice(JSON.stringify(data.detail ?? data))
        return
      }

      setCard(data)
      setNotice(
        'Timecard saved to the local database. Wage ledger will use this record.'
      )
      setNotes('')

      await loadRecords()
      setLedgerRefreshKey((previous) => previous + 1)
    } catch {
      setNotice('Backend unavailable; start FastAPI on port 8000.')
    }
  }

  async function alertWorker() {
    const text =
      `HeatShield ${risk} alert. ` +
      (risk === 'EXTREME'
        ? 'Pause strenuous exposed work and contact the safety lead.'
        : risk === 'HIGH'
          ? 'Reduce exposure, hydrate and take cool recovery breaks.'
          : 'Hydrate, take scheduled breaks and report symptoms.')

    if (!('Notification' in window)) {
      setNotice(text)
      return
    }

    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      if (Notification.permission === 'granted') {
        new Notification(`HeatShield ${risk} heat alert`, {
          body: text,
        })
        setNotice(
          'Browser notification displayed on this device. This does not send a remote mobile push.'
        )
      } else {
        setNotice(text)
      }
    } catch {
      setNotice(text)
    }
  }

  useEffect(() => {
    if (section === 'Workforce') {
      void loadRecords()
    }
  }, [section])

  const title =
    section === 'Live site map'
      ? 'Weather-based site screening'
      : section === 'Workforce'
        ? 'Worker timecard & rest planning'
        : section === 'Wage ledger'
          ? 'Wage estimate ledger'
          : section === 'Compliance'
            ? 'Heat alerts & safety guidance'
            : section

  return (
    <div className="content">
      <section className="heading">
        <div>
          <label className="eyebrow">FIELD OPERATIONS TOOLS</label>
          <h1>{title}</h1>
          <p>
            Prototype tools for field screening, shift records and worker
            communication.
          </p>
        </div>
      </section>

      {section === 'Live site map' && (
        <article className="panel" style={{ maxWidth: 900 }}>
          <div className="panel-head">
            <div>
              <label>OPEN-METEO CURRENT WEATHER</label>
              <h2>
                <CloudSun size={20} /> Weather estimate{' '}
                <small>Not measured WBGT</small>
              </h2>
            </div>
          </div>

          <div className="tool-form">
            <label>
              Latitude
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                type="number"
                step="any"
              />
            </label>

            <label>
              Longitude
              <input
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                type="number"
                step="any"
              />
            </label>

            <button
              className="primary"
              disabled={loading}
              onClick={() => void getWeather()}
            >
              <RefreshCw size={14} />
              {loading ? 'Loading...' : 'Fetch current weather'}
            </button>
          </div>

          <p className="description">
            Defaults to Bengaluru, India. Enter the worksite coordinates to
            fetch current conditions.
          </p>

          {weather && (
            <>
              {weather.error ? (
                <div className="warning">
                  {weather.error}: {weather.detail}
                </div>
              ) : (
                <>
                  <div className="metrics">
                    <div className="metric">
                      <div className="metric-top">AIR TEMPERATURE</div>
                      <strong className="metric-value">
                        {weather.temperature_c}°C
                      </strong>
                    </div>

                    <div className="metric">
                      <div className="metric-top">RELATIVE HUMIDITY</div>
                      <strong className="metric-value">
                        {weather.relative_humidity_pct}%
                      </strong>
                    </div>

                    <div className="metric">
                      <div className="metric-top">ESTIMATED HEAT INDEX</div>
                      <strong className="metric-value">
                        {weather.estimated_heat_index_c}°C
                      </strong>
                    </div>

                    <div className="metric">
                      <div className="metric-top">SCREENING BAND</div>
                      <strong className="metric-value">
                        {weather.risk_level}
                      </strong>
                    </div>
                  </div>

                  <p className="description">
                    Observed: {weather.observed_at} · Wind:{' '}
                    {weather.wind_speed_kmh} km/h
                  </p>

                  <div className="warning">
                    <ShieldAlert size={16} />
                    {weather.disclaimer}
                  </div>
                </>
              )}
            </>
          )}
        </article>
      )}

      {section === 'Workforce' && (
        <article className="panel" style={{ maxWidth: 1000 }}>
          <div className="panel-head">
            <div>
              <label>WORKER ACTIVITY & ENVIRONMENTAL CONTEXT</label>
              <h2>
                <Clock size={20} /> Record actual work/rest time
              </h2>
            </div>
          </div>

          <p className="description">
            Enter manager-observed or sensor-verified minutes for the worker's
            day. Temperature and humidity are context only: weather alone
            cannot tell whether a particular worker is active or resting.
          </p>

          <form className="tool-form" onSubmit={timecard}>
            <label>
              Worker name / ID
              <input
                required
                value={worker}
                onChange={(e) => setWorker(e.target.value)}
              />
            </label>

            <label>
              Actual work (minutes)
              <input
                required
                type="number"
                min="0"
                max="1440"
                value={work}
                onChange={(e) => setWork(e.target.value)}
              />
            </label>

            <label>
              Actual rest (minutes)
              <input
                required
                type="number"
                min="0"
                max="1440"
                value={rest}
                onChange={(e) => setRest(e.target.value)}
              />
            </label>

            <label>
              Hourly rate (₹)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </label>

            <label>
              Temperature °C (optional)
              <input
                type="number"
                min="-20"
                max="70"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="e.g. 34.5"
              />
            </label>

            <label>
              Humidity % (optional)
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                placeholder="e.g. 78"
              />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Manager notes / sensor evidence
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. shaded recovery from 11:00–11:20"
              />
            </label>

            <button className="primary" type="submit">
              Save timecard
            </button>
          </form>

          {card && (
            <div className="timecard">
              <h3>Saved record · {card.worker_name}</h3>
              <p>
                Work: {card.work_minutes} min · Rest: {card.rest_minutes} min
                {' · '}Payable hours: {card.paid_hours}
              </p>
              <strong className="metric-value">
                {money(card.estimated_wages)} estimated gross pay
              </strong>
              <p className="description">{card.activity_note}</p>
            </div>
          )}

          {notice && <p className="description">{notice}</p>}

          <div className="panel-head">
            <div>
              <label>PERSISTED RECORDS</label>
              <h2>Saved timecards ({cards.length})</h2>
            </div>

            <button type="button" onClick={() => void loadRecords()}>
              Refresh records
            </button>
          </div>

          {cards.map((savedCard) => (
            <div
              className="alert"
              key={savedCard.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <b>
                  {savedCard.worker_name} ·{' '}
                  {new Date(savedCard.created_at).toLocaleString()}
                </b>

                <p>
                  {savedCard.work_minutes} work min ·{' '}
                  {savedCard.rest_minutes} rest min ·{' '}
                  {savedCard.temperature_c ?? '—'}°C · humidity{' '}
                  {savedCard.humidity_pct ?? '—'}%
                </p>

                <small>{savedCard.notes || 'No manager notes'}</small>

                <p>
                  Estimated wages:{' '}
                  <strong>{money(savedCard.estimated_wages)}</strong>
                </p>
              </div>

              <DeleteButton
                card={savedCard}
                onDelete={deleteTimecard}
              />
            </div>
          ))}

          {cards.length === 0 && (
            <p className="description">No saved timecards yet.</p>
          )}
        </article>
      )}

      {section === 'Wage ledger' && (
        <WageLedger
          api={api}
          money={money}
          refreshKey={ledgerRefreshKey}
          onDelete={deleteTimecard}
        />
      )}

      {section === 'Compliance' && (
        <article className="panel" style={{ maxWidth: 900 }}>
          <div className="panel-head">
            <div>
              <label>WORKER ALERTS</label>
              <h2>
                <BellRing size={20} /> Local heat alert
              </h2>
            </div>
          </div>

          <p className="description">
            This prototype can display a browser notification on this device
            after permission is granted. Remote mobile push, SMS, and delivery
            tracking require a configured push/SMS provider.
          </p>

          <div className="tool-form">
            <label>
              Risk level
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
              >
                <option>LOW</option>
                <option>MODERATE</option>
                <option>HIGH</option>
                <option>EXTREME</option>
              </select>
            </label>

            <button
              className="primary"
              onClick={() => void alertWorker()}
            >
              Preview / send local notification
            </button>
          </div>

          {notice && (
            <div className="warning">
              <BellRing size={16} />
              {notice}
            </div>
          )}

          <h3>General protective reminders</h3>
          <ul>
            <li>
              Provide drinking water and cool/shaded recovery areas.
            </li>
            <li>
              Use a buddy system and train workers to report symptoms early.
            </li>
            <li>
              Confusion, collapse or suspected heat stroke requires emergency
              response.
            </li>
            <li>
              Have a competent safety professional set work/rest schedules
              using workload, clothing, acclimatization and applicable
              standards.
            </li>
          </ul>
        </article>
      )}

      {section !== 'Live site map' &&
        section !== 'Workforce' &&
        section !== 'Wage ledger' &&
        section !== 'Compliance' && (
          <article className="panel">
            <h2>Choose an operations tool from the sidebar.</h2>
          </article>
        )}

      <footer>
        <span>HEATSHIELD AI / FIELD OPERATIONS</span>
        <span>
          Prototype · verify all safety decisions with a qualified
          professional
        </span>
      </footer>
    </div>
  )
}
