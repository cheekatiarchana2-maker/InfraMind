import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { MaintenanceRecord, UrgencyLevel } from '@/types';
import { mockData } from '@/lib/mockData';
import { SectionCard, LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/Layout';
import { UrgencyBadge } from '@/components/ui/Badges';
import { formatCurrency, cn } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox, Filter } from 'lucide-react';

type SortKey = 'record_id' | 'equipment_type' | 'location' | 'cost' | 'urgency' | 'timestamp';
type SortDir = 'asc' | 'desc';

const URGENCY_ORDER: Record<UrgencyLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export function MaintenanceCasesPage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('record_id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getHistory();
      setRecords(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = records;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.record_id.toLowerCase().includes(q) ||
          r.equipment_type.toLowerCase().includes(q) ||
          r.complaint.toLowerCase().includes(q) ||
          r.likely_cause.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q),
      );
    }
    if (filterEquipment) result = result.filter((r) => r.equipment_type === filterEquipment);
    if (filterLocation) result = result.filter((r) => r.location === filterLocation);
    if (filterUrgency) result = result.filter((r) => r.urgency === filterUrgency);

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'cost') cmp = a.cost - b.cost;
      else if (sortKey === 'urgency') cmp = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [records, search, filterEquipment, filterLocation, filterUrgency, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const equipmentOptions = useMemo(
    () => [...new Set(records.map((r) => r.equipment_type))].sort(),
    [records],
  );
  const locationOptions = useMemo(
    () => [...new Set(records.map((r) => r.location))].sort(),
    [records],
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search maintenance records..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={filterEquipment} onChange={(e) => { setFilterEquipment(e.target.value); setPage(1); }} className="input-field w-auto py-2 text-sm">
              <option value="">All Equipment</option>
              {equipmentOptions.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
            </select>
            <select value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }} className="input-field w-auto py-2 text-sm">
              <option value="">All Locations</option>
              {locationOptions.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <select value={filterUrgency} onChange={(e) => { setFilterUrgency(e.target.value); setPage(1); }} className="input-field w-auto py-2 text-sm">
              <option value="">All Urgency</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
        {(filterEquipment || filterLocation || filterUrgency || search) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} match
            <button
              onClick={() => { setSearch(''); setFilterEquipment(''); setFilterLocation(''); setFilterUrgency(''); setPage(1); }}
              className="text-ai-300 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <SectionCard title="Maintenance Records" subtitle={`${filtered.length} total records`}>
        {loading ? (
          <LoadingSpinner label="Loading maintenance records…" />
        ) : error ? (
          <ErrorState title="Unable to load records" message="Check that the backend is running and try again." onRetry={load} />
        ) : paged.length === 0 ? (
          <EmptyState icon={Inbox} title="No records found" message="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700/60 text-xs uppercase tracking-wider text-slate-500">
                  {([
                    ['record_id', 'Record ID'],
                    ['equipment_type', 'Equipment'],
                    ['location', 'Location'],
                    ['complaint', 'Complaint'],
                    ['likely_cause', 'Likely Cause'],
                    ['urgency', 'Urgency'],
                    ['cost', 'Cost'],
                    ['repair_time', 'Time'],
                    ['status', 'Status'],
                  ] as [SortKey | '', string][]).map(([key, label]) => (
                    <th key={label} className="px-3 py-2.5 font-semibold">
                      {key ? (
                        <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-slate-300">
                          {label}
                          <ArrowUpDown className={cn('h-3 w-3', sortKey === key ? 'text-ai-400' : 'text-slate-600')} />
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/60">
                {paged.map((r, i) => (
                  <tr
                    key={r.record_id}
                    className="transition-colors hover:bg-ink-800/40"
                    style={{ animation: `fade-in 0.3s ease-out ${i * 0.03}s both` }}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-ai-300">{r.record_id}</td>
                    <td className="px-3 py-3 text-slate-300">{r.equipment_type}</td>
                    <td className="px-3 py-3 text-slate-400">{r.location}</td>
                    <td className="px-3 py-3 max-w-[200px] truncate text-slate-400" title={r.complaint}>{r.complaint}</td>
                    <td className="px-3 py-3 font-medium text-slate-200">{r.likely_cause}</td>
                    <td className="px-3 py-3"><UrgencyBadge level={r.urgency} /></td>
                    <td className="px-3 py-3 font-mono text-slate-300">{formatCurrency(r.cost)}</td>
                    <td className="px-3 py-3 text-slate-400">{r.repair_time}</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'badge',
                        r.status === 'Resolved' && 'bg-emerald-500/10 text-emerald-300',
                        r.status === 'Pending' && 'bg-amber-500/10 text-amber-300',
                        r.status === 'In Progress' && 'bg-ai-500/10 text-ai-300',
                      )}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export { mockData };
