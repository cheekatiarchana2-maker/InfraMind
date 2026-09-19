export type AgentName =
  | 'orchestrator'
  | 'retrieval'
  | 'diagnosis'
  | 'recommendation'
  | 'explanation';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentTraceStep {
  agent: AgentName;
  label: string;
  description: string;
  status: AgentStatus;
  duration_ms?: number;
  detail?: string;
}

export interface SimilarCase {
  record_id: string;
  equipment_type: string;
  location: string;
  complaint: string;
  symptom: string;
  likely_cause: string;
  recommended_fix: string;
  similarity: number;
  cost: number;
  repair_time: string;
  urgency: UrgencyLevel;
  resolution?: string;
  status?: string;
}

export interface AlternativeDiagnosis {
  cause: string;
  confidence: number;
}

export interface Explanation {
  why_this_diagnosis: string;
  evidence_points: string[];
}

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DiagnosisResult {
  request_id: string;
  likely_cause: string;
  confidence: number;
  urgency: UrgencyLevel;
  recommended_action: string;
  step_by_step_actions: string[];
  estimated_cost: number;
  estimated_time: string;
  safety_note: string;
  explanation: Explanation;
  alternative_diagnoses: AlternativeDiagnosis[];
  similar_cases: SimilarCase[];
  agent_trace: AgentTraceStep[];
  timestamp?: string;
}

export interface MaintenanceRecord {
  record_id: string;
  equipment_type: string;
  location: string;
  complaint: string;
  symptom: string;
  likely_cause: string;
  recommended_fix: string;
  cost: number;
  repair_time: string;
  urgency: UrgencyLevel;
  status: string;
  timestamp?: string;
}

export interface FeedbackEntry {
  id: string;
  request_id: string;
  record_id: string;
  feedback: 'correct' | 'incorrect';
  actual_resolution: string;
  timestamp: string;
  equipment_type?: string;
}

export interface FeedbackStats {
  total_feedback: number;
  correct: number;
  incorrect: number;
  confirmed_cases: number;
}

export interface KnowledgeStats {
  total_records: number;
  equipment_categories: number;
  recent_additions: number;
  confirmed_cases: number;
  equipment_distribution: { equipment: string; count: number }[];
}

export interface DashboardStats {
  total_cases: number;
  ai_diagnoses: number;
  confirmed_diagnoses: number;
  knowledge_base: number;
}

export interface RecentDiagnosis {
  request_id: string;
  equipment: string;
  location: string;
  diagnosis: string;
  confidence: number;
  urgency: UrgencyLevel;
  status: string;
}

export interface BackendStatus {
  connected: boolean;
  version?: string;
  message?: string;
}

export interface FeedbackPayload {
  request_id: string;
  record_id: string;
  feedback: 'correct' | 'incorrect';
  actual_resolution: string;
}

export interface AnalyzePayload {
  complaint: string;
  equipment_type: string;
  location: string;
}

export type PageId =
  | 'overview'
  | 'new-diagnosis'
  | 'cases'
  | 'agent-activity'
  | 'knowledge-base'
  | 'feedback';
