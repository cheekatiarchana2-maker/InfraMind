import time
from collections import defaultdict
from typing import List, Tuple, Dict, Any
from app.models import (
    SimilarCaseItem,
    DiagnosisOutput,
    AlternativeDiagnosis,
    AgentTraceStep,
)
from app.services.llm_service import llm_service
from app.utils.prompts import DIAGNOSIS_SYSTEM_PROMPT, DIAGNOSIS_USER_PROMPT
from app.utils.logging import logger

def _format_cases_for_prompt(cases: List[SimilarCaseItem]) -> str:
    lines = []
    for c in cases:
        rec = c.record
        lines.append(
            f"Record ID: {rec.record_id} | Similarity: {c.similarity_score:.2f} | Equipment: {rec.equipment_type} | "
            f"Complaint: {rec.complaint} | Symptom: {rec.symptom} | Likely Cause: {rec.likely_cause} | Fix: {rec.recommended_fix}"
        )
    return "\n".join(lines)

def _fallback_diagnosis(
    equipment_type: str,
    location: str,
    complaint: str,
    cases: List[SimilarCaseItem]
) -> DiagnosisOutput:
    """Historical heuristic fallback: aggregates causes weighted by similarity."""
    if not cases:
        return DiagnosisOutput(
            primary_diagnosis="Insufficient historical evidence",
            confidence=20,
            alternative_diagnoses=[],
            reasoning_summary="No similar historical maintenance records found in knowledge base.",
            supporting_case_ids=[]
        )

    cause_scores: Dict[str, float] = defaultdict(float)
    cause_cases: Dict[str, List[str]] = defaultdict(list)

    for c in cases:
        cause = c.record.likely_cause
        cause_scores[cause] += c.similarity_score
        cause_cases[cause].append(c.record_id)

    sorted_causes = sorted(cause_scores.items(), key=lambda x: x[1], reverse=True)
    top_cause, top_score = sorted_causes[0]

    # Calculate confidence based on similarity and consensus
    top_sim = cases[0].similarity_score
    total_score = sum(cause_scores.values()) or 1.0
    consensus_ratio = top_score / total_score
    confidence = int(min(95, max(45, (top_sim * 60) + (consensus_ratio * 35))))

    supporting_ids = cause_cases[top_cause][:3]

    alternatives = [
        AlternativeDiagnosis(
            cause=cause,
            confidence=int(min(80, max(20, (score / total_score) * 75)))
        )
        for cause, score in sorted_causes[1:3]
    ]

    reasoning = (
        f"Identified '{top_cause}' based on {len(supporting_ids)} matching historical records "
        f"({', '.join(supporting_ids)}) displaying similar complaints and symptoms for {equipment_type}."
    )

    return DiagnosisOutput(
        primary_diagnosis=top_cause,
        confidence=confidence,
        alternative_diagnoses=alternatives,
        reasoning_summary=reasoning,
        supporting_case_ids=supporting_ids
    )

def run_diagnosis_agent(
    equipment_type: str,
    location: str,
    complaint: str,
    cases: List[SimilarCaseItem]
) -> Tuple[DiagnosisOutput, AgentTraceStep]:
    """Reasons over retrieved evidence to identify the primary likely cause and alternatives."""
    start_time = time.perf_counter()

    valid_case_ids = {c.record.record_id for c in cases}
    cases_text = _format_cases_for_prompt(cases)

    user_prompt = DIAGNOSIS_USER_PROMPT.format(
        equipment_type=equipment_type,
        location=location,
        complaint=complaint,
        cases_text=cases_text
    )

    llm_output = llm_service.generate_json_response(
        system_prompt=DIAGNOSIS_SYSTEM_PROMPT,
        user_prompt=user_prompt
    )

    diagnosis: DiagnosisOutput
    if llm_output and "primary_diagnosis" in llm_output:
        try:
            # Validate and filter supporting case IDs so they only reference actual retrieved records
            raw_supporting = llm_output.get("supporting_case_ids", [])
            filtered_supporting = [cid for cid in raw_supporting if cid in valid_case_ids]
            if not filtered_supporting and cases:
                filtered_supporting = [cases[0].record_id]

            raw_alts = llm_output.get("alternative_diagnoses", [])
            alts = [
                AlternativeDiagnosis(cause=a.get("cause", ""), confidence=int(a.get("confidence", 30)))
                for a in raw_alts if isinstance(a, dict) and a.get("cause")
            ]

            diagnosis = DiagnosisOutput(
                primary_diagnosis=str(llm_output.get("primary_diagnosis")),
                confidence=int(llm_output.get("confidence", 80)),
                alternative_diagnoses=alts,
                reasoning_summary=str(llm_output.get("reasoning_summary", "")),
                supporting_case_ids=filtered_supporting
            )
        except Exception as e:
            logger.warning(f"Error parsing LLM diagnosis response: {e}. Using fallback.")
            diagnosis = _fallback_diagnosis(equipment_type, location, complaint, cases)
    else:
        diagnosis = _fallback_diagnosis(equipment_type, location, complaint, cases)

    duration_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(f"Diagnosis Agent concluded: {diagnosis.primary_diagnosis} ({diagnosis.confidence}%) in {duration_ms}ms.")

    trace_step = AgentTraceStep(
        agent_name="Diagnosis Agent",
        status="completed",
        short_description=f"Diagnosed: {diagnosis.primary_diagnosis} (Confidence: {diagnosis.confidence}%)",
        execution_time_ms=max(1, duration_ms),
        detail=f"Corroborated by {len(diagnosis.supporting_case_ids)} historical cases: {', '.join(diagnosis.supporting_case_ids)}",
        agent="diagnosis",
        label="Diagnosis Agent",
        description="Reasons over retrieved evidence to identify likely causes.",
        duration_ms=max(1, duration_ms),
    )

    return diagnosis, trace_step
