from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_health():
    r=client.get("/health")
    assert r.status_code==200 and r.json()["status"]=="ok"
def test_overview():
    r=client.get("/api/v1/overview")
    assert r.status_code==200 and r.json()["zones"]
