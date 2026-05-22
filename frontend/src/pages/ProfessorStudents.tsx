import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { Card, Badge, KPICard, EmptyState, ListFilterBar } from '../components/ui';
import { TERMS } from '../i18n/glossary';
import { IllUsers } from '../components/illustrations';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import type { ProfessorStudentsList } from '../types';

export default function ProfessorStudents() {
  const [data, setData] = useState<ProfessorStudentsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .getProfessorStudentsList()
      .then(setData)
      .catch((e) => setError(e.response?.data?.error || 'Eroare la încărcare'))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = useMemo(() => {
    if (!data) return [];
    if (selectedCourse === 'all') return data.courses;
    return data.courses.filter((c) => c.course_id === selectedCourse);
  }, [data, selectedCourse]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500 text-sm">Se încarcă listele de studenți...</div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card tone="danger">
        <p className="text-sm text-danger-fg">{error}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1280px]">
      <div>
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-neutral-800">
          Studenți per disciplină
        </h1>
        <p className="mt-1.5 text-neutral-500 text-[15px]">
          Lista studenților înrolați la cursurile tale, cu nume complet. Statusul individual al
          evaluării NU este afișat — protejăm anonimitatea autorilor feedback-ului.
        </p>
      </div>

      {/* Privacy notice — focus pe protejarea studentului */}
      <Card tone="info" className="flex gap-3 items-start">
        <LockClosedIcon className="w-5 h-5 text-info shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-info-fg mb-1">Confidențialitate</h3>
          <p className="text-sm text-info-fg leading-relaxed">
            Vezi nume complet pentru identificare didactică, dar NU vezi dacă un anumit student a
            evaluat sau nu — această informație ar putea genera presiuni sau repercusiuni. Doar
            cifra agregată per disciplină este afișată („X din Y au completat evaluarea").
          </p>
        </div>
      </Card>

      {/* KPIs agregate — nu identifică niciun student individual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label={TERMS.studentsEligible}
          value={data.total_unique_students}
          footnote="distincți între toate disciplinele"
        />
        <KPICard
          label="Au completat cel puțin o evaluare"
          value={data.unique_students_who_evaluated}
          suffix={`/ ${data.total_unique_students}`}
          delta={
            data.total_unique_students > 0
              ? `${Math.round((data.unique_students_who_evaluated / data.total_unique_students) * 100)}%`
              : '0%'
          }
          trend="up"
          footnote="cifră agregată, nu identifică pe nimeni"
        />
        <KPICard label={TERMS.evaluationsReceived} value={data.total_evaluations_received} footnote="cumulat" />
      </div>

      <ListFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Caută student după nume (ex: Popescu Ana)...',
        }}
        selects={[
          {
            key: 'course',
            label: 'Disciplină',
            value: selectedCourse === 'all' ? '' : String(selectedCourse),
            placeholder: 'Toate disciplinele',
            onChange: (v) => setSelectedCourse(v ? Number(v) : 'all'),
            options: data.courses.map((c) => ({
              value: String(c.course_id),
              label: `${c.course_name} (${c.course_type})`,
            })),
          },
        ]}
        active={search.trim() !== '' || selectedCourse !== 'all'}
        onClearAll={() => {
          setSearch('');
          setSelectedCourse('all');
        }}
      />

      {filteredCourses.length === 0 ? (
        <EmptyState
          illustration={<IllUsers className="w-full h-full" />}
          title="Nicio disciplină"
          description="Nu există studenți înrolați la nicio disciplină care să corespundă filtrelor selectate."
        />
      ) : (
        filteredCourses.map((c) => {
          const students = c.students ?? [];
          const filteredStudents = search.trim()
            ? students.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
            : students;
          return (
            <Card key={c.course_id} padding="none" className="overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-neutral-800">{c.course_name}</h2>
                      <Badge tone="accent">{c.course_type}</Badge>
                      <Badge tone="neutral">Sem {c.semester}</Badge>
                    </div>
                    <p className="text-[13px] text-neutral-500 mt-1">{c.course_code}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone="info">
                      {c.total_evaluated} din {c.total_enrolled} au completat evaluarea
                    </Badge>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      {c.completion_rate}% rată agregată
                    </div>
                  </div>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-500">
                  {search ? 'Niciun student care să corespundă căutării.' : 'Nicio înrolare.'}
                </div>
              ) : (
                <ul
                  className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5"
                  aria-label={`Lista studenți înrolați la ${c.course_name}`}
                >
                  {filteredStudents.map((s, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-neutral-700 py-1 border-b border-neutral-50 last:border-b-0 truncate"
                    >
                      <span className="text-neutral-400 mr-2 tabular-nums">{String(idx + 1).padStart(2, '0')}.</span>
                      {s.name}
                      {s.year && (
                        <span className="text-[11px] text-neutral-400 ml-2">An {s.year}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
