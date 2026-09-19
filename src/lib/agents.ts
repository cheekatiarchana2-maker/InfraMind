import {
  Network,
  Search,
  Brain,
  Wrench,
  FileSearch,
  type LucideIcon,
} from 'lucide-react';
import type { AgentName } from '@/types';

export interface AgentIdentity {
  id: AgentName;
  name: string;
  shortName: string;
  icon: LucideIcon;
  role: string;
  color: string;
  accent: string;
  ring: string;
  bg: string;
  text: string;
  border: string;
}

export const AGENT_IDENTITIES: Record<AgentName, AgentIdentity> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    shortName: 'Orchestrator',
    icon: Network,
    role: 'Coordinates the investigation workflow.',
    color: '#a78bfa',
    accent: 'from-violet-500 to-violet-400',
    ring: 'ring-violet-500/40',
    bg: 'bg-violet-500/10',
    text: 'text-violet-300',
    border: 'border-violet-500/30',
  },
  retrieval: {
    id: 'retrieval',
    name: 'Retrieval Agent',
    shortName: 'Retrieval',
    icon: Search,
    role: 'Finds similar historical maintenance cases.',
    color: '#22d3ee',
    accent: 'from-ai-500 to-ai-400',
    ring: 'ring-ai-500/40',
    bg: 'bg-ai-500/10',
    text: 'text-ai-300',
    border: 'border-ai-500/30',
  },
  diagnosis: {
    id: 'diagnosis',
    name: 'Diagnosis Agent',
    shortName: 'Diagnosis',
    icon: Brain,
    role: 'Reasons over retrieved evidence to identify likely causes.',
    color: '#34d399',
    accent: 'from-emerald-500 to-emerald-400',
    ring: 'ring-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  recommendation: {
    id: 'recommendation',
    name: 'Recommendation Agent',
    shortName: 'Recommendation',
    icon: Wrench,
    role: 'Generates repair actions, urgency, cost and time.',
    color: '#fbbf24',
    accent: 'from-amber-500 to-amber-400',
    ring: 'ring-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  explanation: {
    id: 'explanation',
    name: 'Explanation Agent',
    shortName: 'Explanation',
    icon: FileSearch,
    role: 'Explains the evidence supporting the decision.',
    color: '#f472b6',
    accent: 'from-pink-500 to-pink-400',
    ring: 'ring-pink-500/40',
    bg: 'bg-pink-500/10',
    text: 'text-pink-300',
    border: 'border-pink-500/30',
  },
};

export const AGENT_ORDER: AgentName[] = [
  'orchestrator',
  'retrieval',
  'diagnosis',
  'recommendation',
  'explanation',
];
