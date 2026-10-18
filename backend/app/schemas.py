from typing import Literal
from pydantic import BaseModel, Field, model_validator

Risk = Literal["LOW", "MODERATE", "HIGH", "EXTREME"]
Environment = Literal["outdoor_sun", "indoor_or_shade"]
Workload = Literal["light", "moderate", "heavy", "very_heavy"]

class Zone(BaseModel):
    id: str
    name: str
    location: str
    wbgt_c: float = Field(ge=-10, le=60)
    risk: Risk
    work_minutes: int = Field(ge=0, le=240)
    rest_minutes: int = Field(ge=0, le=240)
    workers: int = Field(ge=0)

class Reading(BaseModel):
    time: str
    wbgt: float
    threshold: float

class Day(BaseModel):
    day: str
    compliant: float = Field(ge=0, le=100)
    total: float = Field(ge=0, le=100)

class Alert(BaseModel):
    id: str
    level: Literal["critical", "warning", "info"]
    title: str
    detail: str
    time: str

class Overview(BaseModel):
    site_name: str
    site_status: str
    active_workers: int
    high_risk_zones: int
    breaks_due: int
    compliance_pct: float = Field(ge=0, le=100)
    estimated_wages: float = Field(ge=0)
    zones: list[Zone]
    hourly_wbgt: list[Reading]
    compliance: list[Day]
    alerts: list[Alert]

class HeatRiskRequest(BaseModel):
    dry_bulb_c: float = Field(ge=0, le=70, description="Air/dry-bulb temperature in °C")
    natural_wet_bulb_c: float = Field(ge=0, le=50, description="Natural wet-bulb temperature measured with a suitable WBGT instrument, °C")
    globe_temperature_c: float = Field(ge=0, le=90, description="Black-globe temperature in °C")
    environment: Environment = "outdoor_sun"
    workload: Workload = "moderate"
    acclimatized: bool = False
    clothing_adjustment_c: float = Field(default=0, ge=0, le=15, description="Clothing adjustment factor (CAF), °C; use a documented value for the ensemble")

    @model_validator(mode="after")
    def temperatures_are_plausible(self):
        if self.natural_wet_bulb_c > self.dry_bulb_c + 5:
            raise ValueError("Natural wet-bulb temperature is unexpectedly higher than dry-bulb temperature; verify sensor inputs.")
        return self

class HeatRiskResult(BaseModel):
    wbgt_c: float
    clothing_adjustment_c: float
    effective_wbgt_c: float
    workload: Workload
    acclimatized: bool
    reference_limit_c: float
    limit_type: Literal["NIOSH REL screening value", "NIOSH RAL screening value"]
    difference_from_limit_c: float
    risk_level: Risk
    status: str
    actions: list[str]
    methodology: list[str]
    limitations: list[str]
