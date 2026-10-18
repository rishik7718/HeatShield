"""Simple auditable work/rest and wage helpers; configure local rules before production."""
from datetime import datetime, timezone

def work_rest_guidance(risk_level: str):
    table = {
      "LOW": {"work_minutes":50,"rest_minutes":10,"message":"Illustrative default only; follow site policy."},
      "MODERATE": {"work_minutes":45,"rest_minutes":15,"message":"Increase monitoring and provide cool recovery."},
      "HIGH": {"work_minutes":30,"rest_minutes":30,"message":"Reduce exposure and obtain competent-person review."},
      "EXTREME": {"work_minutes":15,"rest_minutes":45,"message":"Pause strenuous exposed work pending safety reassessment."}}
    result = table.get(risk_level.upper(), table["MODERATE"]).copy()
    result.update({"risk_level":risk_level.upper(),"illustrative":True,"notice":"Not an official work/rest prescription. Workload, clothing, acclimatization and local standards determine actual schedules."})
    return result


def make_timecard(worker_name: str, work_minutes: int, rest_minutes: int, hourly_rate: float):
    paid_hours = max(0, work_minutes) / 60
    return {"worker_name":worker_name,"work_minutes":max(0,work_minutes),"rest_minutes":max(0,rest_minutes),"hourly_rate":round(max(0,hourly_rate),2),"paid_hours":round(paid_hours,2),"estimated_wages":round(paid_hours*max(0,hourly_rate),2),"created_at":datetime.now(timezone.utc).isoformat(),"note":"Estimate only; apply applicable minimum wage, overtime, breaks, tax and employment rules before payroll."}
