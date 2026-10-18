
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .schemas import Overview, HeatRiskRequest, HeatRiskResult
from .services.wbgt_engine import calculate_heat_risk
from .services.weather import get_weather_estimate
from .services.work_rest import work_rest_guidance
from .services.notifications import build_heat_alert
from .services.wage_ledger import (
    create_timecard as create_timecard_record,
    list_timecards,
    get_ledger,
    delete_timecard,
)


app = FastAPI(
    title="HeatShield AI API",
    version="0.2.0",
    description=(
        "HeatShield AI prototype API. "
        "Overview data is not presented as live unless "
        "verified measurements and records are connected."
    ),
)


# Allow the local frontend to communicate with the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "heatshield-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/overview", response_model=Overview)
def get_overview():
    """Return an empty overview until verified overview data is connected."""
    return {
        "site_name": "Site not configured",
        "site_status": "NO DATA",
        "active_workers": 0,
        "high_risk_zones": 0,
        "breaks_due": 0,
        "compliance_pct": 0,
        "estimated_wages": 0,
        "zones": [],
        "hourly_wbgt": [],
        "compliance": [],
        "alerts": [],
    }


@app.post("/api/v1/heat-risk", response_model=HeatRiskResult)
def post_heat_risk(payload: HeatRiskRequest):
    """Calculate heat risk from the supplied measurements."""
    return calculate_heat_risk(payload)


class WeatherRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class TimecardRequest(BaseModel):
    worker_name: str = Field(min_length=1, max_length=100)
    work_minutes: int = Field(ge=0, le=1440)
    rest_minutes: int = Field(ge=0, le=1440)
    hourly_rate: float = Field(ge=0, le=100000)
    temperature_c: Optional[float] = Field(
        default=None, ge=-20, le=70
    )
    humidity_pct: Optional[float] = Field(
        default=None, ge=0, le=100
    )
    activity_source: str = Field(
        default="manager_recorded", max_length=40
    )
    notes: str = Field(default="", max_length=1000)


@app.post("/api/v1/weather-estimate")
def weather_estimate(payload: WeatherRequest):
    """Return a weather-based estimate, not a measured WBGT reading."""
    return get_weather_estimate(
        payload.latitude,
        payload.longitude,
    )


@app.get("/api/v1/work-rest/{risk_level}")
def get_work_rest(risk_level: str):
    if risk_level.upper() not in {
        "LOW", "MODERATE", "HIGH", "EXTREME"
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "risk_level must be LOW, MODERATE, HIGH or EXTREME"
            ),
        )

    return work_rest_guidance(risk_level)


@app.post("/api/v1/timecards")
def create_timecard(payload: TimecardRequest):
    return create_timecard_record(
        payload.worker_name,
        payload.work_minutes,
        payload.rest_minutes,
        payload.hourly_rate,
        payload.temperature_c,
        payload.humidity_pct,
        payload.activity_source,
        payload.notes,
    )


@app.get("/api/v1/timecards")
def get_timecards():
    return {"records": list_timecards()}


@app.delete("/api/v1/timecards/{timecard_id}")
def remove_timecard(timecard_id: int):
    """Delete one saved timecard by its unique database ID."""
    if timecard_id < 1:
        raise HTTPException(
            status_code=400,
            detail="timecard_id must be a positive integer",
        )

    deleted = delete_timecard(timecard_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Timecard not found",
        )

    return {
        "message": "Timecard deleted successfully",
        "id": timecard_id,
    }


@app.get("/api/v1/wage-ledger")
def wage_ledger():
    """Recalculate totals from the timecards saved in the database."""
    return get_ledger()


@app.get("/api/v1/alerts/{risk_level}")
def heat_alert(risk_level: str, site: str = "Worksite"):
    if risk_level.upper() not in {
        "LOW", "MODERATE", "HIGH", "EXTREME"
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "risk_level must be LOW, MODERATE, HIGH or EXTREME"
            ),
        )

    return build_heat_alert(risk_level, site)
