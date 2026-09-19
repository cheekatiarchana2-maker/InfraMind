import json
import os
from pathlib import Path
from typing import List, Optional
import faiss
import numpy as np

from app.config import settings
from app.models import MaintenanceRecord, SimilarCaseItem
from app.services.embedding_service import embedding_service
from app.utils.logging import logger

class VectorStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            cls._instance.index: Optional[faiss.Index] = None
            cls._instance.records: List[MaintenanceRecord] = []
            cls._instance.dim: Optional[int] = None
        return cls._instance

    @property
    def is_loaded(self) -> bool:
        return self.index is not None and len(self.records) > 0

    @property
    def count(self) -> int:
        return len(self.records)

    def _get_paths(self):
        db_dir = settings.resolved_vector_db_path
        db_dir.mkdir(parents=True, exist_ok=True)
        index_path = db_dir / "maintenance.index"
        metadata_path = db_dir / "metadata.json"
        return index_path, metadata_path

    def build_index(self, records: List[MaintenanceRecord]) -> None:
        """Builds a new FAISS index from the provided maintenance records and persists it."""
        if not records:
            raise ValueError("Cannot build FAISS index from empty records list.")

        logger.info(f"Building FAISS vector index for {len(records)} records...")
        texts = [embedding_service.build_searchable_text(r) for r in records]
        embeddings = embedding_service.encode_texts(texts)

        self.dim = embeddings.shape[1]
        # Using IndexFlatIP for inner product on normalized embeddings = cosine similarity
        self.index = faiss.IndexFlatIP(self.dim)
        self.index.add(embeddings)
        self.records = list(records)

        self.save_index()
        logger.info(f"FAISS index built with {self.index.ntotal} vectors of dimension {self.dim}.")

    def save_index(self) -> None:
        """Persists the FAISS index and metadata to disk."""
        if self.index is None:
            return
        index_path, metadata_path = self._get_paths()
        faiss.write_index(self.index, str(index_path))

        metadata = [r.model_dump() for r in self.records]
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"Persisted vector index ({self.index.ntotal} items) to {settings.VECTOR_DB_PATH}")

    def load_index(self) -> bool:
        """Loads index and metadata from disk if available."""
        index_path, metadata_path = self._get_paths()
        if not index_path.exists() or not metadata_path.exists():
            logger.info("No persisted FAISS index found on disk.")
            return False

        try:
            logger.info(f"Loading FAISS index from {index_path}...")
            self.index = faiss.read_index(str(index_path))
            self.dim = self.index.d

            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            self.records = [MaintenanceRecord(**item) for item in metadata]
            logger.info(f"Successfully loaded {self.index.ntotal} vectors from disk.")
            return True
        except Exception as e:
            logger.error(f"Failed to load FAISS index from disk: {e}")
            self.index = None
            self.records = []
            return False

    def search_similar_cases(
        self,
        query: str,
        top_k: int = 5,
        equipment_filter: Optional[str] = None
    ) -> List[SimilarCaseItem]:
        """Searches for top_k most similar cases to the query string."""
        if self.index is None or not self.records:
            raise RuntimeError("Vector store is not initialized or index is empty.")

        query_vec = embedding_service.encode_query(query)
        
        # Retrieve a bit more if we want to prioritize equipment matches
        search_k = min(top_k * 3 if equipment_filter else top_k, self.index.ntotal)
        scores, indices = self.index.search(query_vec, search_k)

        results: List[SimilarCaseItem] = []
        raw_scores = scores[0]
        raw_indices = indices[0]

        # Prioritize matching equipment if specified
        candidates = []
        for score, idx in zip(raw_scores, raw_indices):
            if idx < 0 or idx >= len(self.records):
                continue
            rec = self.records[idx]
            # Normalize score to [0.0, 1.0]
            sim_score = max(0.0, min(1.0, float(score)))
            candidates.append((sim_score, rec))

        if equipment_filter:
            # First add cases matching equipment type
            exact_matches = [c for c in candidates if c[1].equipment_type.lower() == equipment_filter.lower()]
            other_matches = [c for c in candidates if c[1].equipment_type.lower() != equipment_filter.lower()]
            candidates = exact_matches + other_matches

        for sim_score, rec in candidates[:top_k]:
            results.append(
                SimilarCaseItem(
                    record_id=rec.record_id,
                    similarity_score=round(sim_score, 4),
                    record=rec
                )
            )

        return results

    def add_record(self, record: MaintenanceRecord) -> None:
        """Adds a single confirmed maintenance record to the vector store and persists."""
        if self.index is None:
            self.build_index([record])
            return

        text = embedding_service.build_searchable_text(record)
        embedding = embedding_service.encode_texts([text])
        self.index.add(embedding)
        self.records.append(record)
        self.save_index()
        logger.info(f"Added record {record.record_id} to vector index. Total vectors: {self.index.ntotal}")

vector_store = VectorStore()
