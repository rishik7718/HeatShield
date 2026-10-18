"""Open-Meteo current-weather estimate. Not a substitute for measured WBGT."""
from urllib.parse import urlencode
from urllib.request import urlopen
import json

def get_weather_estimate(latitude: float, longitude: float):
    params = urlencode({"latitude": latitude, "longitude": longitude, "current": "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,shortwave_radiation", "timezone": "auto"})
    url = "https://api.open-meteo.com/v1/forecast?" + params
    try:
        with urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode())
        current = payload.get("current", {})
        temp = float(current["temperature_2m"])
        humidity = float(current["relative_humidity_2m"])
        radiation = float(current.get("shortwave_radiation") or 0)
        # Rough screening estimate only; not physical WBGT and not suitable for compliance.
        wet_bulb_approx = temp * __import__('math').atan(0.151977 * (humidity + 8.313659) ** 0.5) + __import__('math').atan(temp + humidity) - __import__('math').atan(humidity - 1.676331) + 0.00391838 * humidity ** 1.5 * __import__('math').atan(0.023101 * humidity) - 4.686035
        estimated = 0.7 * wet_bulb_approx + 0.3 * temp + min(3.0, radiation / 300.0)
        level = "EXTREME" if estimated >= 32 else "HIGH" if estimated >= 29 else "MODERATE" if estimated >= 26 else "LOW"
        return {"source":"Open-Meteo", "latitude":latitude,"longitude":longitude,"observed_at":current.get("time"),"temperature_c":round(temp,1),"relative_humidity_pct":round(humidity,1),"wind_speed_kmh":current.get("wind_speed_10m"),"solar_radiation_wm2":radiation,"estimated_heat_index_c":round(estimated,1),"risk_level":level,"is_wbgt_measurement":False,"disclaimer":"Weather-derived screening estimate only; not measured WBGT, not a compliance value, and not a basis for declaring work safe. Confirm with on-site WBGT instrumentation and local occupational guidance."}
    except Exception as exc:
        return {"error":"Weather provider unavailable", "detail":str(exc),"is_wbgt_measurement":False}
