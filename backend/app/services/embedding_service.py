try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.models import MaintenanceRecord
from app.utils.logging import logger

class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._model = None
        return cls._instance

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully.")
        return self._model

    def build_searchable_text(self, record: MaintenanceRecord) -> str:
        """Constructs a rich text representation of a maintenance record for vector indexing."""
        return (
            f"Equipment: {record.equipment_type}\n"
            f"Location: {record.location}\n"
            f"Complaint: {record.complaint}\n"
            f"Symptom: {record.symptom}\n"
            f"Likely Cause: {record.likely_cause}\n"
            f"Recommended Fix: {record.recommended_fix}\n"
            f"Urgency: {record.urgency}"
        )

    def build_query_text(self, equipment_type: str, location: str, complaint: str) -> str:
        """Constructs search text for a new incoming complaint."""
        parts = []
        if equipment_type:
            parts.append(f"Equipment: {equipment_type}")
        if location:
            parts.append(f"Location: {location}")
        if complaint:
            parts.append(f"Complaint: {complaint}")
        return "\n".join(parts)

    def encode_texts(self, texts: List[str]) -> np.ndarray:
        """Encodes a list of texts into normalized float32 numpy arrays."""
        embeddings = self.model.encode(
            texts,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return embeddings.astype(np.float32)

    def encode_query(self, query: str) -> np.ndarray:
        """Encodes a single query string into a 2D normalized float32 array [1, dim]."""
        emb = self.model.encode(
            query,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return np.expand_dims(emb.astype(np.float32), axis=0)

embedding_service = EmbeddingService()
