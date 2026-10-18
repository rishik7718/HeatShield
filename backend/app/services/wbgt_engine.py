"""WBGT screening calculation and transparent NIOSH-derived limit comparison.

This module requires measured natural wet-bulb and globe temperatures. It does not
infer WBGT from weather-station temperature/RH because that is not equivalent to
an on-site WBGT measurement.
"""
from app.schemas import HeatRiskRequest, HeatRiskResult

# Simplified values reproduced by OSHA from NIOSH 2016 guidance. Units: °C.
# These are screening values for conventional work clothing, not universal safe limits.
_NIOSH_LIMITS_C = {
    "light": {False: 28.0, True: 30.0},
    "moderate": {False: 25.0, True: 28.0},
    "heavy": {False: 23.0, True: 26.0},
    "very_heavy": {False: 21.0, True: 25.0},
}


def calculate_heat_risk(data: HeatRiskRequest) -> HeatRiskResult:
    """Calculate WBGT from measured components and compare effective WBGT to a limit.

    Outdoor sun: WBGT = 0.7*Tnwb + 0.2*Tg + 0.1*Tdb
    Indoor/shade: WBGT = 0.7*Tnwb + 0.3*Tg
    Effective WBGT = measured WBGT + documented clothing adjustment factor.

    Severity bands below are explicit application screening bands around the
    NIOSH-derived limit; they are not official NIOSH risk categories.
    """
    if data.environment == "outdoor_sun":
        wbgt = (0.7 * data.natural_wet_bulb_c
                + 0.2 * data.globe_temperature_c
                + 0.1 * data.dry_bulb_c)
        environment_label = "outdoor with direct solar load"
    else:
        wbgt = 0.7 * data.natural_wet_bulb_c + 0.3 * data.globe_temperature_c
        environment_label = "indoors or outdoors without direct solar load"

    effective = wbgt + data.clothing_adjustment_c
    limit = _NIOSH_LIMITS_C[data.workload][data.acclimatized]
    difference = effective - limit

    # App-defined screening bands, deliberately labelled as such.
    if difference > 2.0:
        risk = "EXTREME"
        status = "Well above the selected screening limit"
        actions = [
            "Pause strenuous heat-exposed work while a competent safety professional reassesses conditions.",
            "Move workers to a cool/shaded recovery area and provide readily accessible drinking water.",
            "Review engineering controls, workload, PPE/clothing adjustment, and a formal work/rest plan before resuming.",
            "Monitor workers for symptoms; suspected heat stroke is a medical emergency—activate emergency response immediately.",
        ]
    elif difference > 0:
        risk = "HIGH"
        status = "Above the selected screening limit"
        actions = [
            "Reduce heat exposure and workload now; obtain a competent-person assessment before continuing the same task.",
            "Increase cool recovery breaks, provide water, and verify the clothing adjustment and acclimatization status.",
            "Use a documented work/rest schedule based on workload and applicable occupational guidance.",
        ]
    elif difference >= -2.0:
        risk = "MODERATE"
        status = "At or within 2°C below the selected screening limit"
        actions = [
            "Apply preventive controls: water access, shaded/cool recovery, buddy observation, and scheduled rest.",
            "Recheck WBGT when conditions or work intensity change; reassess if protective clothing is added.",
        ]
    else:
        risk = "LOW"
        status = "More than 2°C below the selected screening limit"
        actions = [
            "Maintain water access, acclimatization practices, symptom reporting, and planned rest breaks.",
            "Continue monitoring; this screening result does not rule out individual heat illness or changing conditions.",
        ]

    return HeatRiskResult(
        wbgt_c=round(wbgt, 2),
        clothing_adjustment_c=data.clothing_adjustment_c,
        effective_wbgt_c=round(effective, 2),
        workload=data.workload,
        acclimatized=data.acclimatized,
        reference_limit_c=limit,
        limit_type="NIOSH REL screening value" if data.acclimatized else "NIOSH RAL screening value",
        difference_from_limit_c=round(difference, 2),
        risk_level=risk,
        status=status,
        actions=actions,
        methodology=[
            f"WBGT equation selected for {environment_label}.",
            "Effective WBGT = calculated WBGT + user-supplied clothing adjustment factor.",
            f"Reference value: {limit:.1f}°C for {data.workload.replace('_', ' ')} workload and {'acclimatized' if data.acclimatized else 'unacclimatized'} workers, simplified NIOSH 2016 screening table as reproduced by OSHA.",
            "Application severity bands: LOW = >2°C below limit; MODERATE = within 2°C below; HIGH = up to 2°C above; EXTREME = >2°C above. These bands are application-defined, not official NIOSH categories.",
        ],
        limitations=[
            "For screening only; not a medical diagnosis, regulatory determination, or guarantee of safety.",
            "Use calibrated on-site WBGT instrumentation where possible. Inputs must be representative of the actual work area and exposure period.",
            "Workload, acclimatization, clothing/PPE, work/rest schedule, air movement, personal risk factors, and local regulations affect the assessment.",
            "The simplified limit table is not a substitute for the full NIOSH/ACGIH assessment by a qualified occupational safety professional.",
        ],
    )
