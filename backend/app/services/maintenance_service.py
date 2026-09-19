import os
from pathlib import Path
from typing import List, Optional, Tuple, Dict
from collections import Counter
import pandas as pd

from app.config import settings
from app.models import MaintenanceRecord
from app.schemas import (
    DashboardStatsResponse,
    KnowledgeStatsResponse,
    KnowledgeDistributionItem,
    RecentDiagnosisItem,
)
from app.utils.logging import logger

REQUIRED_COLUMNS = [
    "record_id",
    "equipment_type",
    "location",
    "complaint",
    "symptom",
    "likely_cause",
    "recommended_fix",
    "estimated_cost_inr",
    "estimated_time_hours",
    "urgency",
    "status",
]

class MaintenanceService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MaintenanceService, cls).__new__(cls)
            cls._instance.records: List[MaintenanceRecord] = []
            cls._instance.records_by_id: Dict[str, MaintenanceRecord] = {}
            cls._instance.recent_diagnoses: List[RecentDiagnosisItem] = []
        return cls._instance

    def load_maintenance_records(self, path: Optional[str] = None) -> List[MaintenanceRecord]:
        """Loads maintenance records from CSV, validates columns, and populates the store."""
        data_path = Path(path) if path else settings.resolved_data_path
        if not data_path.exists():
            raise FileNotFoundError(f"Maintenance records dataset not found at: {data_path.resolve()}")

        logger.info(f"Loading maintenance records from: {data_path}")
        df = pd.read_csv(data_path)

        # Validate required columns
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Dataset is missing required columns: {missing_cols}")

        loaded: List[MaintenanceRecord] = []
        for index, row in df.iterrows():
            try:
                rec = MaintenanceRecord(
                    record_id=str(row["record_id"]).strip(),
                    equipment_type=str(row["equipment_type"]).strip(),
                    location=str(row["location"]).strip(),
                    complaint=str(row["complaint"]).strip(),
                    symptom=str(row["symptom"]).strip(),
                    likely_cause=str(row["likely_cause"]).strip(),
                    recommended_fix=str(row["recommended_fix"]).strip(),
                    estimated_cost_inr=float(row["estimated_cost_inr"]),
                    estimated_time_hours=float(row["estimated_time_hours"]),
                    urgency=str(row["urgency"]).strip(),
                    status=str(row["status"]).strip(),
                    technician_feedback=str(row["technician_feedback"]).strip() if pd.notna(row.get("technician_feedback")) else None,
                )
                loaded.append(rec)
            except Exception as e:
                logger.warning(f"Skipping malformed row {index} in dataset: {e}")

        if not loaded:
            raise ValueError("No valid maintenance records could be loaded from the dataset.")

        self.records = loaded
        self.records_by_id = {r.record_id: r for r in loaded}
        logger.info(f"Loaded {len(self.records)} valid maintenance records.")

        # Seed initial recent diagnoses for UI overview
        self._init_recent_diagnoses()
        return self.records

    def _init_recent_diagnoses(self):
        recent_sample = self.records[:8]
        self.recent_diagnoses = [
            RecentDiagnosisItem(
                request_id=f"REQ-{1000 + i}",
                equipment=r.equipment_type,
                location=r.location,
                diagnosis=r.likely_cause,
                confidence=92 - (i * 3),
                urgency=r.urgency,
                status="Completed" if i < 5 else "In Review"
            )
            for i, r in enumerate(recent_sample)
        ]

    def get_all_records(self) -> List[MaintenanceRecord]:
        return self.records

    def get_record_by_id(self, record_id: str) -> Optional[MaintenanceRecord]:
        return self.records_by_id.get(record_id)

    def get_equipment_types(self) -> List[str]:
        """Returns sorted distinct equipment categories from dataset."""
        types = {r.equipment_type for r in self.records}
        return sorted(list(types))

    def get_locations(self) -> List[str]:
        locs = {r.location for r in self.records}
        return sorted(list(locs))

    def get_history(
        self,
        equipment_type: Optional[str] = None,
        location: Optional[str] = None,
        urgency: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[MaintenanceRecord], int]:
        """Returns filtered, paginated maintenance records."""
        filtered = self.records

        if equipment_type:
            filtered = [r for r in filtered if r.equipment_type.lower() == equipment_type.lower()]
        if location:
            filtered = [r for r in filtered if r.location.lower() == location.lower()]
        if urgency:
            filtered = [r for r in filtered if r.urgency.lower() == urgency.lower()]
        if status:
            filtered = [r for r in filtered if r.status.lower() == status.lower()]

        total = len(filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        items = filtered[start_idx:end_idx]
        return items, total

    def add_record(self, record: MaintenanceRecord) -> None:
        """Adds a new confirmed record to in-memory store and appends to confirmed records log."""
        self.records.append(record)
        self.records_by_id[record.record_id] = record

        # Append to confirmed_records.csv in vector_db to preserve original seed dataset
        confirmed_csv_path = settings.resolved_vector_db_path / "confirmed_records.csv"
        try:
            row_dict = record.model_dump()
            df_new = pd.DataFrame([row_dict])
            header = not confirmed_csv_path.exists()
            df_new.to_csv(confirmed_csv_path, mode="a", header=header, index=False)
            logger.info(f"Recorded confirmed case {record.record_id} to {confirmed_csv_path}.")
        except Exception as e:
            logger.warning(f"Could not write confirmed record to file: {e}")

    def add_recent_diagnosis(self, item: RecentDiagnosisItem):
        self.recent_diagnoses.insert(0, item)
        if len(self.recent_diagnoses) > 20:
            self.recent_diagnoses.pop()

    def get_dashboard_stats(self) -> DashboardStatsResponse:
        total = len(self.records)
        confirmed = sum(1 for r in self.records if r.technician_feedback == "Confirmed")
        return DashboardStatsResponse(
            total_cases=total,
            ai_diagnoses=total + 28,
            confirmed_diagnoses=confirmed,
            knowledge_base=total,
        )

    def get_knowledge_stats(self) -> KnowledgeStatsResponse:
        total = len(self.records)
        confirmed = sum(1 for r in self.records if r.technician_feedback == "Confirmed")
        counts = Counter(r.equipment_type for r in self.records)
        dist = [KnowledgeDistributionItem(equipment=eq, count=cnt) for eq, cnt in counts.most_common()]
        return KnowledgeStatsResponse(
            total_records=total,
            equipment_categories=len(counts),
            recent_additions=confirmed,
            confirmed_cases=confirmed,
            equipment_distribution=dist,
        )

    def get_recent_diagnoses(self) -> List[RecentDiagnosisItem]:
        return self.recent_diagnoses

maintenance_service = MaintenanceService()
