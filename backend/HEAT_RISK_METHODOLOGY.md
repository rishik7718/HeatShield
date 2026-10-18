# HeatShield AI — WBGT screening methodology

## Equations

The API requires component temperatures measured with a suitable WBGT instrument. It does not estimate WBGT from ordinary weather-station temperature and relative humidity.

- Outdoors in direct sun: `WBGT = 0.7 × natural wet-bulb + 0.2 × globe temperature + 0.1 × dry-bulb temperature`
- Indoors or outdoors without direct solar load: `WBGT = 0.7 × natural wet-bulb + 0.3 × globe temperature`
- `Effective WBGT = WBGT + clothing adjustment factor (CAF)`

Temperatures are in °C. Confirm the CAF against a documented source for the actual clothing/PPE ensemble. The default CAF of zero is not appropriate for every protective ensemble.

## Reference limits

The implementation uses the simplified workload limits shown on OSHA's Heat Hazard Recognition page, adapted from NIOSH's 2016 criteria. For unacclimatized workers (action-limit screening values) / acclimatized workers (threshold-limit screening values), in °C:

| Workload | Unacclimatized | Acclimatized |
|---|---:|---:|
| Light | 28 | 30 |
| Moderate | 25 | 28 |
| Heavy | 23 | 26 |
| Very heavy | 21 | 25 |

The app classifies the difference between effective WBGT and the selected reference limit using prototype-only bands: LOW when more than 2°C below; MODERATE when from 2°C below through the limit; HIGH when above the limit by up to 2°C; EXTREME when more than 2°C above. These labels are not official NIOSH categories and must not be represented as regulatory determinations.

## Limitations and safe use

- The calculator is a screening aid, not a medical diagnosis, regulatory compliance determination, or guarantee of safety.
- Work/rest schedules cannot be safely derived from WBGT alone. They require an appropriate exposure assessment considering metabolic workload, exposure duration, acclimatization, clothing/PPE, air movement, personal risk factors, and local rules. A qualified occupational-safety professional should validate site-specific procedures.
- Prefer calibrated on-site WBGT instruments and representative measurements. Reassess when conditions, task intensity, or clothing change.
- Follow local emergency protocols if heat illness is suspected. Suspected heat stroke is a medical emergency.

## Sources

- OSHA, [Heat Hazard Recognition](https://www.osha.gov/heat-exposure/hazards) — equations, clothing adjustment factors, simplified screening table.
- NIOSH, [Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments (2016-106)](https://www.cdc.gov/niosh/docs/2016-106/) — underlying recommended alert limits and recommended exposure limits.
- CDC/NIOSH, [Workplace Recommendations](https://www.cdc.gov/niosh/heat-stress/recommendations/) — preventive controls and work/rest recommendations.
