import pytest
import numpy as np
from app.services.maintenance_service import maintenance_service
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store

@pytest.fixture(scope="module", autouse=True)
def init_data():
    records = maintenance_service.load_maintenance_records()
    vector_store.build_index(records)

def test_embedding_generation():
    text = "Equipment: Air Conditioner\nComplaint: AC not cooling"
    embedding = embedding_service.encode_query(text)
    assert isinstance(embedding, np.ndarray)
    assert embedding.shape == (1, 384)
    # Check normalization (L2 norm should be ~ 1.0)
    norm = np.linalg.norm(embedding[0])
    assert abs(norm - 1.0) < 1e-4

def test_vector_store_initialization():
    assert vector_store.is_loaded is True
    assert vector_store.count >= 240

def test_retrieval_ac_cooling():
    query = "Equipment: Air Conditioner\nLocation: Block A\nComplaint: The AC is running but the room is not getting cold and airflow is weak."
    results = vector_store.search_similar_cases(query, top_k=5, equipment_filter="Air Conditioner")
    
    assert len(results) == 5
    for item in results:
        assert item.record_id.startswith("MR-")
        assert 0.0 <= item.similarity_score <= 1.0
        assert item.record.equipment_type == "Air Conditioner"
        assert len(item.record.likely_cause) > 0

    # Top similarity should be high for this relevant complaint
    assert results[0].similarity_score > 0.60
