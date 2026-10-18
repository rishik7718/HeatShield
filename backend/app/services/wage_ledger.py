"""SQLite-backed timecard records and derived wage ledger for the prototype."""
import os, sqlite3
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(os.getenv("HEATSHIELD_DB_PATH", str(Path(__file__).resolve().parents[2] / "heatshield.db")))

def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS timecards (
          id INTEGER PRIMARY KEY AUTOINCREMENT, worker_name TEXT NOT NULL,
          work_minutes INTEGER NOT NULL, rest_minutes INTEGER NOT NULL,
          hourly_rate REAL NOT NULL, temperature_c REAL, humidity_pct REAL,
          activity_source TEXT NOT NULL DEFAULT 'manager_recorded', notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL)''')

def create_timecard(worker_name, work_minutes, rest_minutes, hourly_rate, temperature_c=None, humidity_pct=None, activity_source='manager_recorded', notes=''):
    init_db()
    created_at = datetime.now(timezone.utc).isoformat()
    with connect() as db:
        cur = db.execute('''INSERT INTO timecards(worker_name,work_minutes,rest_minutes,hourly_rate,temperature_c,humidity_pct,activity_source,notes,created_at)
          VALUES(?,?,?,?,?,?,?,?,?)''', (worker_name.strip(),work_minutes,rest_minutes,hourly_rate,temperature_c,humidity_pct,activity_source,notes,created_at))
        row = db.execute('SELECT * FROM timecards WHERE id=?',(cur.lastrowid,)).fetchone()
    return serialize(row)

def serialize(row):
    d = dict(row)
    d['paid_hours'] = round(d['work_minutes']/60, 2)
    d['estimated_wages'] = round(d['work_minutes']/60*d['hourly_rate'], 2)
    d['wage_note'] = 'Estimate only; verify applicable wage, overtime, and break rules before payroll.'
    d['activity_note'] = 'Work/rest minutes are manager-recorded. Temperature and humidity provide context; ambient weather alone cannot reliably detect whether a specific worker is working or resting.'
    return d

def list_timecards():
    init_db()
    with connect() as db: rows = db.execute('SELECT * FROM timecards ORDER BY id DESC').fetchall()
    return [serialize(r) for r in rows]

def get_ledger():
    cards = list_timecards()
    return {'records':cards,'record_count':len(cards),'total_work_minutes':sum(x['work_minutes'] for x in cards),'total_rest_minutes':sum(x['rest_minutes'] for x in cards),'total_paid_hours':round(sum(x['work_minutes'] for x in cards)/60,2),'estimated_gross_wages':round(sum(x['estimated_wages'] for x in cards),2),'notice':'Derived directly from saved timecards. Estimates only; not payroll advice.'}
def delete_timecard(timecard_id: int):
    init_db()
    with connect() as db:
        cur = db.execute(
            "DELETE FROM timecards WHERE id = ?",
            (timecard_id,)
        )
        return cur.rowcount > 0