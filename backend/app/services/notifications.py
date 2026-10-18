"""Notification message builder. Delivery requires a configured provider or browser permission."""
def build_heat_alert(risk_level: str, site: str = "Worksite"):
    level = risk_level.upper()
    actions = {
      "LOW":"Drink water regularly, use planned breaks, and report symptoms.",
      "MODERATE":"Take scheduled cool-area breaks, hydrate, and use buddy monitoring.",
      "HIGH":"Reduce exposure, notify the supervisor, hydrate and take additional cool recovery breaks.",
      "EXTREME":"Pause strenuous exposed work and contact the safety lead immediately. Confusion or collapse is an emergency."}
    return {"title":f"HeatShield {level} heat alert","site":site,"risk_level":level,"message":actions.get(level,actions["MODERATE"]),"delivery":"message generated; not sent to a device","created_at":__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()}
