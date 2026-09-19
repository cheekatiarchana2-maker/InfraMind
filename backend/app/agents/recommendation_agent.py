import time
import statistics
from typing import List, Tuple
from app.models import (
    SimilarCaseItem,
    DiagnosisOutput,
    RecommendationOutput,
    AgentTraceStep,
)
from app.services.llm_service import llm_service
from app.utils.prompts import RECOMMENDATION_SYSTEM_PROMPT, RECOMMENDATION_USER_PROMPT
from app.utils.logging import logger

def _format_cases_for_prompt(cases: List[SimilarCaseItem]) -> str:
    lines = []
    for c in cases:
        rec = c.record
        lines.append(
            f"ID: {rec.record_id} | Fix: {rec.recommended_fix} | Cost: ₹{rec.estimated_cost_inr} | "
            f"Time: {rec.estimated_time_hours}h | Urgency: {rec.urgency}"
        )
    return "\n".join(lines)

def _fallback_recommendation(
    equipment_type: str,
    location: str,
    complaint: str,
    diagnosis: DiagnosisOutput,
    cases: List[SimilarCaseItem]
) -> RecommendationOutput:
    """Historical heuristic fallback: derives fix, cost, time, and urgency from matching records."""
    # Filter cases that match the diagnosis cause
    matching = [c for c in cases if c.record.likely_cause.lower() == diagnosis.primary_diagnosis.lower()]
    target_cases = matching if matching else cases

    if not target_cases:
        return RecommendationOutput(
            recommended_action=f"Inspect {equipment_type} and verify operating conditions.",
            steps=[f"1. Isolate {equipment_type}", "2. Conduct visual and electrical inspection", "3. Test functionality"],
            urgency="Medium",
            estimated_cost_inr=1500.0,
            estimated_time_hours=2.0,
            safety_note="Ensure equipment is fully isolated and locked out before inspection."
        )

    best_record = target_cases[0].record
    primary_fix = best_record.recommended_fix

    # Compute median cost and time across relevant cases to avoid skew
    costs = [c.record.estimated_cost_inr for c in target_cases]
    times = [c.record.estimated_time_hours for c in target_cases]
    urgencies = [c.record.urgency for c in target_cases]

    cost = float(statistics.median(costs))
    time_h = float(statistics.median(times))
    urgency = max(set(urgencies), key=urgencies.count)

    steps = [
        f"1. Secure and isolate {equipment_type} at {location}.",
        f"2. {primary_fix}.",
        f"3. Verify operational parameters and test under standard load.",
        f"4. Document repair completion and update facility maintenance log."
    ]

    # Equipment-specific safety advice
    eq_lower = equipment_type.lower()
    if "electric" in eq_lower or "panel" in eq_lower:
        safety_note = "Danger: High voltage hazard. Follow Lockout/Tagout (LOTO) protocols and use insulated tools."
    elif "elevator" in eq_lower:
        safety_note = "Engage mechanical safety locks and secure elevator cab before entering the shaft or pit."
    elif "generator" in eq_lower:
        safety_note = "Disconnect battery starter and allow exhaust/engine components to cool before servicing."
    else:
        safety_note = "Verify power isolation and wear appropriate PPE before performing maintenance."

    return RecommendationOutput(
        recommended_action=primary_fix,
        steps=steps,
        urgency=urgency,
        estimated_cost_inr=cost,
        estimated_time_hours=time_h,
        safety_note=safety_note
    )

def run_recommendation_agent(
    equipment_type: str,
    location: str,
    complaint: str,
    diagnosis: DiagnosisOutput,
    cases: List[SimilarCaseItem]
) -> Tuple[RecommendationOutput, AgentTraceStep]:
    """Generates repair actions, execution steps, cost, time, and urgency grounded in historical evidence."""
    start_time = time.perf_counter()

    cases_text = _format_cases_for_prompt(cases)
    user_prompt = RECOMMENDATION_USER_PROMPT.format(
        equipment_type=equipment_type,
        location=location,
        complaint=complaint,
        primary_diagnosis=diagnosis.primary_diagnosis,
        cases_text=cases_text
    )

    llm_output = llm_service.generate_json_response(
        system_prompt=RECOMMENDATION_SYSTEM_PROMPT,
        user_prompt=user_prompt
    )

    rec: RecommendationOutput
    if llm_output and "recommended_action" in llm_output:
        try:
            rec = RecommendationOutput(
                recommended_action=str(llm_output.get("recommended_action")),
                steps=list(llm_output.get("steps", [])),
                urgency=str(llm_output.get("urgency", "High")),
                estimated_cost_inr=float(llm_output.get("estimated_cost_inr", 2000.0)),
                estimated_time_hours=float(llm_output.get("estimated_time_hours", 2.0)),
                safety_note=str(llm_output.get("safety_note", "Follow standard facility safety protocols."))
            )
        except Exception as e:
            logger.warning(f"Error parsing LLM recommendation response: {e}. Using fallback.")
            rec = _fallback_recommendation(equipment_type, location, complaint, diagnosis, cases)
    else:
        rec = _fallback_recommendation(equipment_type, location, complaint, diagnosis, cases)

    duration_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(f"Recommendation Agent generated fix: '{rec.recommended_action}' (Cost: ₹{rec.estimated_cost_inr}) in {duration_ms}ms.")

    trace_step = AgentTraceStep(
        agent_name="Recommendation Agent",
        status="completed",
        short_description=f"Prescribed: {rec.recommended_action} (Est. ₹{int(rec.estimated_cost_inr)}, {rec.estimated_time_hours}h)",
        execution_time_ms=max(1, duration_ms),
        detail=f"Urgency {rec.urgency}. {len(rec.steps)} action steps defined.",
        agent="recommendation",
        label="Recommendation Agent",
        description="Generates repair actions, urgency, cost and time.",
        duration_ms=max(1, duration_ms),
    )

    return rec, trace_step
