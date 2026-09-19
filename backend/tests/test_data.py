import os
import pytest
from pathlib import Path
from app.config import settings
from app.services.maintenance_service import maintenance_service, REQUIRED_COLUMNS

def test_dataset_exists():
    path = settings.resolved_data_path
    assert path.exists(), f"Dataset file does not exist at {path.resolve()}"

def test_dataset_loads_240_records():
    records = maintenance_service.load_maintenance_records()
    assert len(records) == 240, f"Expected 240 records, but found {len(records)}"

def test_required_fields_present():
    records = maintenance_service.get_all_records()
    assert len(records) > 0

    for r in records:
        assert r.record_id.startswith("MR-")
        assert len(r.equipment_type) > 0
        assert len(r.location) > 0
        assert len(r.complaint) > 0
        assert len(r.symptom) > 0
        assert len(r.likely_cause) > 0
        assert len(r.recommended_fix) > 0
        assert r.estimated_cost_inr > 0
        assert r.estimated_time_hours > 0
        assert r.urgency in ["Low", "Medium", "High", "Critical"]
        assert r.status == "Resolved"
        assert r.technician_feedback == "Confirmed"

def test_equipment_categories_count():
    eq_types = maintenance_service.get_equipment_types()
    assert len(eq_types) == 12, f"Expected 12 distinct equipment types, found {len(eq_types)}: {eq_types}"
    expected_sample = ["Air Conditioner", "Elevator", "Generator", "Water Pump"]
    for eq in expected_sample:
        assert eq in eq_types
