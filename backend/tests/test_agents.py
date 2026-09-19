import pytest
from app.services.maintenance_service import maintenance_service
from app.services.vector_store import vector_store
from app.agents.retrieval_agent import run_retrieval_agent
from app.agents.diagnosis_agent import run_diagnosis_agent
from app.agents.recommendation_agent import run_recommendation_agent
from app.agents.explanation_agent import run_explanation_agent
from app.agents.orchestrator import run_facility_orchestrator
from app.schemas import AnalyzeRequest

@pytest.fixture(scope="module", autouse=True)
def setup_vector_store():
    records = maintenance_service.load_maintenance_records()
    vector_store.build_index(records)

def test_retrieval_agent():
    cases, trace = run_retrieval_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly and airflow is weak.",
        top_k=5
    )
    assert len(cases) == 5
    assert trace.agent_name == "Retrieval Agent"
    assert trace.status == "completed"
    assert trace.execution_time_ms >= 1

def test_diagnosis_agent():
    cases, _ = run_retrieval_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling and making loud buzzing noise.",
        top_k=5
    )
    diagnosis, trace = run_diagnosis_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling and making loud buzzing noise.",
        cases=cases
    )
    assert trace.agent_name == "Diagnosis Agent"
    assert trace.status == "completed"
    assert len(diagnosis.primary_diagnosis) > 0
    assert 0 <= diagnosis.confidence <= 100
    assert len(diagnosis.reasoning_summary) > 0
    assert len(diagnosis.supporting_case_ids) > 0

    valid_ids = {c.record.record_id for c in cases}
    for cid in diagnosis.supporting_case_ids:
        assert cid in valid_ids

def test_recommendation_agent():
    cases, _ = run_retrieval_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly.",
        top_k=5
    )
    diagnosis, _ = run_diagnosis_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly.",
        cases=cases
    )
    rec, trace = run_recommendation_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly.",
        diagnosis=diagnosis,
        cases=cases
    )
    assert trace.agent_name == "Recommendation Agent"
    assert trace.status == "completed"
    assert len(rec.recommended_action) > 0
    assert len(rec.steps) > 0
    assert rec.urgency in ["Low", "Medium", "High", "Critical"]
    assert rec.estimated_cost_inr > 0
    assert rec.estimated_time_hours > 0

def test_explanation_agent():
    cases, _ = run_retrieval_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly.",
        top_k=5
    )
    diagnosis, _ = run_diagnosis_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly.",
        cases=cases
    )
    rec, _ = run_recommendation_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly.",
        diagnosis=diagnosis,
        cases=cases
    )
    exp, trace = run_explanation_agent(
        equipment_type="Air Conditioner",
        location="Block A",
        complaint="AC is not cooling properly.",
        diagnosis=diagnosis,
        recommendation=rec,
        cases=cases
    )
    assert trace.agent_name == "Explanation Agent"
    assert trace.status == "completed"
    assert len(exp.why_this_diagnosis) > 0
    assert len(exp.evidence_points) > 0

    valid_ids = {c.record.record_id for c in cases}
    for cid in exp.supporting_case_ids:
        assert cid in valid_ids

def test_langgraph_orchestrator():
    req = AnalyzeRequest(
        equipment_type="Elevator",
        location="Block B",
        complaint="Elevator stopping between floors and door not opening."
    )
    response = run_facility_orchestrator(req)

    assert response.request_id.startswith("REQ-")
    assert len(response.retrieved_cases) == 5
    assert len(response.diagnosis.primary_diagnosis) > 0
    assert len(response.recommendation.recommended_action) > 0
    assert len(response.explanation.why_this_diagnosis) > 0

    # Verify agent trace has all 5 agents in order
    agent_names = [t.agent_name for t in response.agent_trace]
    expected_agents = [
        "Orchestrator",
        "Retrieval Agent",
        "Diagnosis Agent",
        "Recommendation Agent",
        "Explanation Agent"
    ]
    assert agent_names == expected_agents
    for t in response.agent_trace:
        assert t.status == "completed"
        assert t.execution_time_ms >= 0
