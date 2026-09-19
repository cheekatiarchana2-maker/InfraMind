import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.maintenance_service import maintenance_service
from app.services.vector_store import vector_store

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["dataset_records"] >= 240
    assert data["vector_index_loaded"] is True
    assert "llm_configured" in data

def test_equipment_endpoint(client):
    response = client.get("/api/equipment")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 12
    assert "Air Conditioner" in data
    assert "Elevator" in data

def test_history_endpoint(client):
    response = client.get("/api/history?equipment_type=Air%20Conditioner")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    for item in data:
        assert item["equipment_type"] == "Air Conditioner"

def test_analyze_endpoint(client):
    payload = {
        "equipment_type": "Air Conditioner",
        "location": "Block A",
        "complaint": "AC is running but the room is not getting cold and airflow is weak."
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "request_id" in data
    assert "retrieved_cases" in data
    assert len(data["retrieved_cases"]) == 5
    assert "diagnosis" in data
    assert "recommendation" in data
    assert "explanation" in data
    assert "agent_trace" in data
    assert len(data["agent_trace"]) == 5

    # Check frontend compatibility fields
    assert "likely_cause" in data
    assert data["confidence"] > 0
    assert "urgency" in data
    assert "similar_cases" in data

def test_feedback_correct_workflow(client):
    initial_count = len(maintenance_service.get_all_records())

    # Step 1: Run analyze to get a request_id
    analyze_payload = {
        "equipment_type": "Generator",
        "location": "Block D",
        "complaint": "Generator engine is overheating under heavy load."
    }
    analyze_res = client.post("/api/analyze", json=analyze_payload)
    assert analyze_res.status_code == 200
    req_id = analyze_res.json()["request_id"]

    # Step 2: Submit 'correct' feedback
    feedback_payload = {
        "request_id": req_id,
        "diagnosis": "Low coolant level",
        "feedback": "correct",
        "resolution": "Refilled coolant reservoir and inspected radiator hoses."
    }
    fb_res = client.post("/api/feedback", json=feedback_payload)
    assert fb_res.status_code == 200
    fb_data = fb_res.json()

    assert fb_data["success"] is True
    assert fb_data["feedback"] == "correct"
    assert fb_data["knowledge_base_updated"] is True
    assert fb_data["new_record_id"].startswith("MR-CONF-")

    # Verify knowledge base record count increased by 1
    new_count = len(maintenance_service.get_all_records())
    assert new_count == initial_count + 1
    assert vector_store.count == new_count

def test_feedback_incorrect_workflow(client):
    initial_count = len(maintenance_service.get_all_records())

    feedback_payload = {
        "request_id": "REQ-TEST-INCORRECT",
        "diagnosis": "Wrong diagnosis",
        "feedback": "incorrect",
        "resolution": "Technician determined the problem was something else."
    }
    fb_res = client.post("/api/feedback", json=feedback_payload)
    assert fb_res.status_code == 200
    fb_data = fb_res.json()

    assert fb_data["success"] is True
    assert fb_data["feedback"] == "incorrect"
    assert fb_data["knowledge_base_updated"] is False

    # Verify knowledge base did NOT change
    new_count = len(maintenance_service.get_all_records())
    assert new_count == initial_count
