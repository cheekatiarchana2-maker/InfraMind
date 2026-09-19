import type {
  AnalyzePayload,
  BackendStatus,
  DashboardStats,
  DiagnosisResult,
  FeedbackEntry,
  FeedbackPayload,
  FeedbackStats,
  KnowledgeStats,
  MaintenanceRecord,
  RecentDiagnosis,
} from '@/types';
import { mockData } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Toggle: when true and backend is unreachable, return mock data instead of throwing.
let useMockFallback = true;

export function setMockFallback(enabled: boolean) {
  useMockFallback = enabled;
}

async function apiFetch<T>(path: string, init?: RequestInit, mock?: () => T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (useMockFallback && mock) {
      return mock();
    }
    throw err;
  }
}

export const api = {
  async health(): Promise<BackendStatus> {
    try {
      const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return { connected: true, version: data.version, message: data.message };
    } catch {
      // If we have mock fallback enabled, report connected with mock indicator
      return { connected: useMockFallback, message: useMockFallback ? 'Demo mode' : undefined };
    }
  },

  getEquipment: () =>
    apiFetch<string[]>('/api/equipment', undefined, () => mockData.EQUIPMENT),

  getHistory: () =>
    apiFetch<MaintenanceRecord[]>('/api/history', undefined, () => mockData.history),

  getFeedbackHistory: () =>
    apiFetch<FeedbackEntry[]>('/api/feedback/history', undefined, () => mockData.feedbackHistory),

  getFeedbackStats: () =>
    apiFetch<FeedbackStats>('/api/feedback/stats', undefined, () => mockData.feedbackStats),

  getKnowledgeStats: () =>
    apiFetch<KnowledgeStats>('/api/knowledge/stats', undefined, () => mockData.knowledge),

  getDashboardStats: () =>
    apiFetch<DashboardStats>('/api/dashboard/stats', undefined, () => mockData.dashboard),

  getRecentDiagnoses: () =>
    apiFetch<RecentDiagnosis[]>('/api/diagnoses/recent', undefined, () => mockData.recentDiagnoses),

  analyze: (payload: AnalyzePayload) =>
    apiFetch<DiagnosisResult>(
      '/api/analyze',
      { method: 'POST', body: JSON.stringify(payload) },
      () => mockData.buildDiagnosis(payload.complaint, payload.equipment_type, payload.location),
    ),

  submitFeedback: (payload: FeedbackPayload) =>
    apiFetch<{ success: boolean; message: string }>(
      '/api/feedback',
      { method: 'POST', body: JSON.stringify(payload) },
      () => ({ success: true, message: 'Feedback recorded (demo mode).' }),
    ),
};

export { BASE_URL };
