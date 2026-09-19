import time
from typing import List, Tuple
from app.config import settings
from app.models import SimilarCaseItem, AgentTraceStep
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store
from app.utils.logging import logger

def run_retrieval_agent(
    equipment_type: str,
    location: str,
    complaint: str,
    top_k: int = 5
) -> Tuple[List[SimilarCaseItem], AgentTraceStep]:
    """Retrieves the top-k similar historical maintenance records from FAISS vector store."""
    start_time = time.perf_counter()

    query = embedding_service.build_query_text(
        equipment_type=equipment_type,
        location=location,
        complaint=complaint
    )

    cases = vector_store.search_similar_cases(
        query=query,
        top_k=top_k,
        equipment_filter=equipment_type
    )

    duration_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(f"Retrieval Agent fetched {len(cases)} cases in {duration_ms}ms.")

    trace_step = AgentTraceStep(
        agent_name="Retrieval Agent",
        status="completed",
        short_description=f"Retrieved {len(cases)} similar historical maintenance cases",
        execution_time_ms=max(1, duration_ms),
        detail=f"Found {len(cases)} candidate matches for {equipment_type} at {location}.",
        agent="retrieval",
        label="Retrieval Agent",
        description="Finds similar historical maintenance cases.",
        duration_ms=max(1, duration_ms),
    )

    return cases, trace_step
