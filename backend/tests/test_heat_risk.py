import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.wbgt_engine import calculate_heat_risk
from app.schemas import HeatRiskRequest

client = TestClient(app)


def test_outdoor_wbgt_equation_and_clothing_adjustment():
    request = HeatRiskRequest(
        dry_bulb_c=35, natural_wet_bulb_c=25, globe_temperature_c=40,
        environment="outdoor_sun", workload="moderate", acclimatized=False,
        clothing_adjustment_c=0.5,
    )
    result = calculate_heat_risk(request)
    assert result.wbgt_c == pytest.approx(29.0)
    assert result.effective_wbgt_c == pytest.approx(29.5)
    assert result.reference_limit_c == 25.0
    assert result.risk_level == "EXTREME"


def test_indoor_shade_equation():
    request = HeatRiskRequest(
        dry_bulb_c=32, natural_wet_bulb_c=24, globe_temperature_c=30,
        environment="indoor_or_shade", workload="light", acclimatized=True,
    )
    result = calculate_heat_risk(request)
    assert result.wbgt_c == pytest.approx(25.8)
    assert result.reference_limit_c == 30.0
    assert result.risk_level == "LOW"


def test_endpoint_returns_methodology_and_limitations():
    response = client.post("/api/v1/heat-risk", json={
        "dry_bulb_c": 35,
        "natural_wet_bulb_c": 25,
        "globe_temperature_c": 40,
        "environment": "outdoor_sun",
        "workload": "moderate",
        "acclimatized": False,
        "clothing_adjustment_c": 0,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["wbgt_c"] == pytest.approx(29.0)
    assert data["risk_level"] == "EXTREME"
    assert data["methodology"]
    assert data["limitations"]


def test_invalid_temperature_relationship_rejected():
    response = client.post("/api/v1/heat-risk", json={
        "dry_bulb_c": 20,
        "natural_wet_bulb_c": 30,
        "globe_temperature_c": 30,
    })
    assert response.status_code == 422
