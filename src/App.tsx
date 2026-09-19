import { useState } from 'react';
import type { PageId } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { OverviewPage } from '@/pages/OverviewPage';
import { NewDiagnosisPage } from '@/pages/NewDiagnosisPage';
import { MaintenanceCasesPage } from '@/pages/MaintenanceCasesPage';
import { AgentActivityPage } from '@/pages/AgentActivityPage';
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage';
import { FeedbackPage } from '@/pages/FeedbackPage';

const PAGE_META: Record<PageId, { title: string; description: string }> = {
  overview: {
    title: 'Facility Intelligence Center',
    description: 'Monitor maintenance intelligence, AI decisions and knowledge-base activity.',
  },
  'new-diagnosis': {
    title: 'New Maintenance Diagnosis',
    description: 'Describe the equipment issue and let the agent team investigate.',
  },
  cases: {
    title: 'Maintenance Cases',
    description: 'Browse and search historical maintenance records.',
  },
  'agent-activity': {
    title: 'Agent Operations Center',
    description: 'Observe how FacilityAI coordinates specialized agents.',
  },
  'knowledge-base': {
    title: 'Maintenance Knowledge Base',
    description: 'Explore the historical cases that power AI retrieval.',
  },
  feedback: {
    title: 'Learning & Feedback',
    description: 'Technician feedback that improves the knowledge base.',
  },
};

export default function App() {
  const [page, setPage] = useState<PageId>('overview');

  const meta = PAGE_META[page];

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar current={page} onNavigate={setPage} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader title={meta.title} description={meta.description} />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mx-auto max-w-6xl">
            {page === 'overview' && <OverviewPage onNavigate={setPage} />}
            {page === 'new-diagnosis' && <NewDiagnosisPage />}
            {page === 'cases' && <MaintenanceCasesPage />}
            {page === 'agent-activity' && <AgentActivityPage />}
            {page === 'knowledge-base' && <KnowledgeBasePage />}
            {page === 'feedback' && <FeedbackPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
