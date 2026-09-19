import type {
  AgentName,
  AgentTraceStep,
  DashboardStats,
  DiagnosisResult,
  FeedbackEntry,
  FeedbackStats,
  KnowledgeStats,
  MaintenanceRecord,
  RecentDiagnosis,
  UrgencyLevel,
} from '@/types';

const EQUIPMENT = [
  'Air Conditioner',
  'Elevator',
  'Generator',
  'Water Pump',
  'Projector',
  'Electrical Panel',
  'CCTV Camera',
  'Wi-Fi Access Point',
  'Refrigerator',
  'Water Cooler',
  'Fire Alarm',
  'Access Control System',
];

const LOCATIONS = [
  'Block A',
  'Block B',
  'Block C',
  'Block D',
  'Library',
  'Laboratory',
  'Administrative Block',
  'Hostel A',
  'Hostel B',
  'Auditorium',
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

const mockHistory: MaintenanceRecord[] = Array.from({ length: 48 }, (_, i) => {
  const eq = pick(EQUIPMENT, i * 3);
  const causes: Record<string, string> = {
    'Air Conditioner': 'Fan motor bearing failure',
    Elevator: 'Door sensor misalignment',
    Generator: 'Fuel filter clogging',
    'Water Pump': 'Impeller wear',
    Projector: 'Lamp module failure',
    'Electrical Panel': 'Loose terminal connection',
    'CCTV Camera': 'Power supply unit failure',
    'Wi-Fi Access Point': 'Firmware corruption',
    Refrigerator: 'Compressor relay failure',
    'Water Cooler': 'Thermostat malfunction',
    'Fire Alarm': 'Smoke detector drift',
    'Access Control System': 'Card reader board fault',
  };
  const fixes: Record<string, string> = {
    'Air Conditioner': 'Replace fan motor and lubricate bearings',
    Elevator: 'Realign door sensors and recalibrate',
    Generator: 'Replace fuel filter and bleed lines',
    'Water Pump': 'Replace impeller and seal kit',
    Projector: 'Replace lamp module',
    'Electrical Panel': 'Tighten terminals and inspect for arcing',
    'CCTV Camera': 'Replace power supply unit',
    'Wi-Fi Access Point': 'Reflash firmware and reconfigure',
    Refrigerator: 'Replace compressor relay',
    'Water Cooler': 'Replace thermostat',
    'Fire Alarm': 'Clean and recalibrate smoke detector',
    'Access Control System': 'Replace card reader board',
  };
  const urgencies: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const costs = [1200, 3000, 5500, 800, 4500, 2200, 1500, 900, 3800, 700, 2600, 1900];
  const times = ['1 hour', '3 hours', '2 hours', '4 hours', '90 min', '30 min'];
  return {
    record_id: `MR-${String(i + 1).padStart(4, '0')}`,
    equipment_type: eq,
    location: pick(LOCATIONS, i * 2),
    complaint: pick(
      [
        'Unit not cooling and making buzzing noise',
        'Doors not closing properly',
        'Engine cranks but will not start',
        'Low water pressure and vibration',
        'No display output',
        'Burning smell near panel',
        'Camera feed intermittent',
        'Devices cannot connect',
        'Not maintaining temperature',
        'Water not cooling',
        'False alarm triggers',
        'Cards not being read',
      ],
      i,
    ),
    symptom: pick(
      [
        'Cooling failure + abnormal noise',
        'Door mechanism malfunction',
        'Start failure',
        'Pressure drop + vibration',
        'Display failure',
        'Overheating component',
        'Intermittent signal',
        'Connectivity loss',
        'Temperature drift',
        'Cooling failure',
        'False triggers',
        'Reader unresponsive',
      ],
      i,
    ),
    likely_cause: causes[eq] ?? 'Component wear',
    recommended_fix: fixes[eq] ?? 'Replace faulty component',
    cost: pick(costs, i),
    repair_time: pick(times, i),
    urgency: pick(urgencies, i % 4 === 3 ? 3 : (i % 4) + 1) as MaintenanceRecord['urgency'],
    status: pick(['Resolved', 'Resolved', 'Resolved', 'Pending', 'In Progress'], i),
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

const mockRecentDiagnoses: RecentDiagnosis[] = Array.from({ length: 8 }, (_, i) => ({
  request_id: `AC-REQ-${1024 + i}`,
  equipment: pick(EQUIPMENT, i + 2),
  location: pick(LOCATIONS, i + 1),
  diagnosis: pick(
    [
      'Fan Motor Bearing Failure',
      'Door Sensor Misalignment',
      'Fuel Filter Clogging',
      'Lamp Module Failure',
      'Loose Terminal Connection',
      'Power Supply Unit Failure',
      'Compressor Relay Failure',
      'Thermostat Malfunction',
    ],
    i,
  ),
  confidence: 86 - i * 3,
  urgency: pick(['HIGH', 'MEDIUM', 'CRITICAL', 'LOW', 'HIGH'] as UrgencyLevel[], i),
  status: i < 5 ? 'Completed' : i < 7 ? 'In Review' : 'Pending',
}));

const mockKnowledge: KnowledgeStats = {
  total_records: 240,
  equipment_categories: 12,
  recent_additions: 18,
  confirmed_cases: 96,
  equipment_distribution: [
    { equipment: 'Air Conditioner', count: 42 },
    { equipment: 'Elevator', count: 28 },
    { equipment: 'Generator', count: 22 },
    { equipment: 'Water Pump', count: 19 },
    { equipment: 'Electrical Panel', count: 26 },
    { equipment: 'Projector', count: 15 },
    { equipment: 'CCTV Camera', count: 24 },
    { equipment: 'Wi-Fi Access Point', count: 18 },
    { equipment: 'Fire Alarm', count: 16 },
    { equipment: 'Other', count: 30 },
  ],
};

const mockFeedbackHistory: FeedbackEntry[] = Array.from({ length: 12 }, (_, i) => ({
  id: `FB-${String(i + 1).padStart(4, '0')}`,
  request_id: `AC-REQ-${1018 + i}`,
  record_id: `MR-${String(40 + i).padStart(4, '0')}`,
  feedback: i % 4 === 3 ? 'incorrect' : 'correct',
  actual_resolution:
    i % 4 === 3
      ? 'Actual issue was a clogged air filter, not the motor.'
      : pick(
          [
            'Replaced the fan motor as recommended.',
            'Realigned door sensors and tested.',
            'Replaced fuel filter — generator started normally.',
            'Replaced lamp module, display restored.',
          ],
          i,
        ),
  timestamp: new Date(Date.now() - i * 43200000).toISOString(),
  equipment_type: pick(EQUIPMENT, i + 2),
}));

const mockFeedbackStats: FeedbackStats = {
  total_feedback: mockFeedbackHistory.length,
  correct: mockFeedbackHistory.filter((f) => f.feedback === 'correct').length,
  incorrect: mockFeedbackHistory.filter((f) => f.feedback === 'incorrect').length,
  confirmed_cases: mockFeedbackHistory.filter((f) => f.feedback === 'correct').length,
};

const mockDashboard: DashboardStats = {
  total_cases: 240,
  ai_diagnoses: 128,
  confirmed_diagnoses: 96,
  knowledge_base: 240,
};

function buildTrace(roles: Partial<Record<AgentName, Partial<AgentTraceStep>>>): AgentTraceStep[] {
  const base: { agent: AgentName; label: string; description: string }[] = [
    { agent: 'orchestrator', label: 'Orchestrator Agent', description: 'Coordinates the investigation workflow.' },
    { agent: 'retrieval', label: 'Retrieval Agent', description: 'Finds similar historical maintenance cases.' },
    { agent: 'diagnosis', label: 'Diagnosis Agent', description: 'Reasons over retrieved evidence to identify likely causes.' },
    { agent: 'recommendation', label: 'Recommendation Agent', description: 'Generates repair actions, urgency, cost and time.' },
    { agent: 'explanation', label: 'Explanation Agent', description: 'Explains the evidence supporting the decision.' },
  ];
  return base.map((b) => ({
    agent: b.agent,
    label: b.label,
    description: b.description,
    status: (roles[b.agent]?.status ?? 'completed') as AgentTraceStep['status'],
    duration_ms: roles[b.agent]?.duration_ms,
    detail: roles[b.agent]?.detail,
  }));
}

function buildDiagnosis(complaint: string, equipment: string, location: string): DiagnosisResult {
  const isAC = equipment.toLowerCase().includes('air') || equipment.toLowerCase().includes('conditioner');
  const cause = isAC
    ? 'Fan Motor Bearing Failure'
    : equipment.toLowerCase().includes('elevator')
    ? 'Door Sensor Misalignment'
    : equipment.toLowerCase().includes('generator')
    ? 'Fuel Filter Clogging'
    : 'Component Wear / Calibration Drift';

  const similar: DiagnosisResult['similar_cases'] = mockHistory
    .filter((m) => m.equipment_type === equipment)
    .slice(0, 5)
    .map((m, i) => ({
      ...m,
      similarity: 92 - i * 6,
      recommended_fix: m.recommended_fix,
    }));

  if (similar.length === 0) {
    similar.push(
      ...mockHistory.slice(0, 4).map((m, i) => ({ ...m, similarity: 88 - i * 7 })),
    );
  }

  return {
    request_id: `AC-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    likely_cause: cause,
    confidence: 86,
    urgency: 'HIGH',
    recommended_action: isAC
      ? 'Replace the fan motor bearings and inspect the motor assembly for additional wear.'
      : 'Inspect and replace the faulty component, then test the unit under normal operating conditions.',
    step_by_step_actions: isAC
      ? [
          'Shut off power to the AC unit at the breaker panel.',
          'Remove the indoor unit front cover to access the fan motor.',
          'Disconnect the fan motor wiring and unbolt the motor assembly.',
          'Replace the bearing or the full fan motor if wear is extensive.',
          'Reassemble, restore power, and verify normal cooling and noise levels.',
        ]
      : [
          'Isolate the equipment from its power source.',
          'Open the relevant access panel and inspect the suspect component.',
          'Replace or recalibrate the faulty part.',
          'Reassemble and power on the unit.',
          'Run a functional test and confirm normal operation.',
        ],
    estimated_cost: 3000,
    estimated_time: '3 hours',
    safety_note:
      'Always disconnect power before opening any equipment enclosure. Wear appropriate PPE. If a burning smell or electrical arcing is present, do not attempt repair — contact a certified technician.',
    explanation: {
      why_this_diagnosis:
        'Two similar historical cases involved the same equipment and comparable symptoms (cooling failure combined with abnormal noise). Both were resolved after addressing the fan motor assembly.',
      evidence_points: [
        'Similar cooling failure reported in past cases',
        'Similar abnormal noise pattern observed in past cases',
        'Two historical cases involved fan motor issues for the same equipment type',
        'Previous cases were resolved through motor repair or replacement',
      ],
    },
    alternative_diagnoses: [
      { cause: 'Low refrigerant level', confidence: 11 },
      { cause: 'Dirty or clogged air filter', confidence: 7 },
    ],
    similar_cases: similar,
    agent_trace: buildTrace({
      orchestrator: { duration_ms: 85, detail: 'Planned 5-step investigation.' },
      retrieval: { duration_ms: 312, detail: `Retrieved ${similar.length} similar cases.` },
      diagnosis: { duration_ms: 1200, detail: 'Identified probable cause with 86% confidence.' },
      recommendation: { duration_ms: 840, detail: 'Generated repair plan, cost and time estimates.' },
      explanation: { duration_ms: 620, detail: 'Generated evidence summary with 4 evidence points.' },
    }),
    timestamp: new Date().toISOString(),
  };
}

export const mockData = {
  EQUIPMENT,
  LOCATIONS,
  history: mockHistory,
  recentDiagnoses: mockRecentDiagnoses,
  knowledge: mockKnowledge,
  feedbackHistory: mockFeedbackHistory,
  feedbackStats: mockFeedbackStats,
  dashboard: mockDashboard,
  buildDiagnosis,
  buildTrace,
};
