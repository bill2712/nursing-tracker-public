import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogForm } from './LogForm';
import { showToast, vibrate } from './Toast';
import { useFormat, useI18n, useVolume } from '../i18n';
import { actions } from '../store';
import { ALL_TYPES, type ActivityType, type AppData, type LogEntry } from '../types';
import { dayKey, downloadFile, fromLocalDateInput, toCsv } from '../utils';
import { TYPE_META, TypeIcon } from '../typeMeta';
import { CalendarIcon, ListIcon, TrashIcon } from './Icons';

const DAYS_PER_PAGE = 7;

export const History: React.FC<{ data: AppData }> = ({ data }) => {
  const { m } = useI18n();
  const fmt = useFormat();
  const vol = useVolume(data.profile);
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showDates, setShowDates] = useState(false);
  const [view, setView] = useState<'list' | 'timeline'>('list');
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);
  const [editing, setEditing] = useState<LogEntry | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingRef = useRef(deletingId);
  deletingRef.current = deletingId;

  useEffect(() => setVisibleDays(DAYS_PER_PAGE), [filter, from, to]);
  useEffect(() => {
    const reset = () => setDeletingId(null);
    window.addEventListener('click', reset);
    return () => window.removeEventListener('click', reset);
  }, []);

  const filtered = useMemo(() => {
    const fromTs = fromLocalDateInput(from);
    const toTs = fromLocalDateInput(to);
    return data.logs.filter(log =>
      (filter === 'all' || log.type === filter) &&
      (fromTs === null || log.startTime >= fromTs) &&
      (toTs === null || log.startTime < toTs + 86400000)
    );
  }, [data.logs, filter, from, to]);

  const { groups, days } = useMemo(() => {
    const result: Record<string, LogEntry[]> = {};
    for (const log of filtered) (result[dayKey(log.startTime)] ||= []).push(log);
    return { groups: result, days: Object.keys(result).sort((a, b) => b.localeCompare(a)) };
  }, [filtered]);

  const shownDays = days.slice(0, visibleDays);

  const onEdit = useCallback((log: LogEntry) => {
    if (deletingRef.current) { setDeletingId(null); return; }
    setEditing(log);
  }, []);

  const onDelete = useCallback((event: React.MouseEvent, log: LogEntry) => {
    event.stopPropagation();
    if (deletingRef.current === log.id) {
      actions.removeLog(log.id);
      setDeletingId(null);
      vibrate();
      showToast({ message: m.today.deleted, actionLabel: m.common.undo, onAction: () => actions.saveLog(log) });
    } else {
      setDeletingId(log.id);
    }
  }, [m]);

  const describe = useCallback((log: LogEntry) => {
    const d = log.details;
    return [
      d.feedingType && m.method[d.feedingType],
      d.side && m.side[d.side],
      d.amountMl ? vol.format(d.amountMl) : '',
      d.diaperState && m.diaper[d.diaperState],
      d.urineMl ? m.history.urine(vol.format(d.urineMl)) : '',
      ...(d.foods ?? []),
      d.reaction ? m.history.reaction(d.reaction) : ''
    ].filter(Boolean) as string[];
  }, [m, vol]);

  const exportCsv = () => {
    const c = m.history.csv;
    const rows = filtered.map(log => [
      m.types[log.type] ?? log.type,
      fmt.dateTime(log.startTime),
      log.endTime ? fmt.dateTime(log.endTime) : '',
      log.durationSeconds ? String(Math.round(log.durationSeconds / 60)) : '',
      describe(log).join('; '),
      log.details.notes ?? ''
    ]);
    downloadFile(toCsv([c.type, c.start, c.end, c.duration, c.details, c.notes], rows), `nurturetrack-${dayKey(Date.now())}.csv`, 'text/csv');
  };

  return (
    <div className="nt-page space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow !text-[0.68rem]">{m.history.eyebrow}</p>
          <h1 className="text-2xl font-black">{m.history.title}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="nt-btn nt-btn-primary !px-3 text-xs" onClick={() => setEditing('new')}>{m.history.add}</button>
          {filtered.length > 0 && <button type="button" className="nt-btn nt-btn-soft !px-3 text-xs" onClick={exportCsv}>{m.history.exportCsv}</button>}
        </div>
      </header>

      <div className="nt-seg" role="group">
        <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label={m.history.list}><span className="inline-flex items-center gap-1.5"><ListIcon className="h-4 w-4" />{m.history.list}</span></button>
        <button type="button" aria-pressed={view === 'timeline'} onClick={() => setView('timeline')} aria-label={m.history.timeline}><span className="inline-flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" />{m.history.timeline}</span></button>
      </div>

      <div className="flex items-center gap-2">
        <div className="no-scrollbar -mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 py-0.5">
          {(['all', ...ALL_TYPES] as const).map(option => (
            <button key={option} type="button" className="nt-chip-btn" aria-pressed={filter === option} onClick={() => setFilter(option)}>
              {option === 'all' ? m.history.all : m.types[option]}
            </button>
          ))}
        </div>
        <button type="button" className={`nt-chip-btn gap-1 ${from || to ? '!border-transparent !bg-pink-500 !text-white' : ''}`} aria-expanded={showDates} onClick={() => setShowDates(open => !open)}>
          <CalendarIcon className="h-4 w-4" />{m.history.dateFilter}
        </button>
      </div>

      {showDates && (
        <div className="nt-card animate-fade-in space-y-2 p-3">
          <div className="flex gap-2">
            <label className="flex-1"><span className="nt-label">{m.history.from}</span><input type="date" className="nt-input text-sm" value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label className="flex-1"><span className="nt-label">{m.history.to}</span><input type="date" className="nt-input text-sm" value={to} onChange={e => setTo(e.target.value)} /></label>
          </div>
          {(from || to) && <button type="button" className="text-xs font-bold text-pink-600" onClick={() => { setFrom(''); setTo(''); }}>{m.history.clear}</button>}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-14 text-center text-sm font-semibold text-[var(--nt-muted)]">{data.logs.length === 0 ? m.history.empty : m.history.emptyFiltered}</p>
      ) : (
        <div className="space-y-5">
          {shownDays.map(day => (
            <section key={day} className="nt-day">
              <h2 className="nt-day-header">
                <span>{fmt.day(new Date(`${day}T00:00:00`).getTime())}</span>
                <span className="text-[11px] font-bold">{m.history.items(groups[day].length)}</span>
              </h2>
              {view === 'list' ? (
                <div className="space-y-2">
                  {groups[day].map(log => (
                    <LogRow key={log.id} log={log} describe={describe} time={fmt.time(log.startTime) + (log.endTime ? ` – ${fmt.time(log.endTime)}` : '')}
                      duration={log.durationSeconds ? fmt.duration(log.durationSeconds) : ''} label={m.types[log.type]} isDeleting={deletingId === log.id}
                      deleteLabel={m.history.deleteLabel} confirmLabel={m.history.confirmLabel} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              ) : (
                <Timeline logs={groups[day]} day={day} onEdit={onEdit} />
              )}
            </section>
          ))}
          {days.length > shownDays.length && (
            <button type="button" className="nt-btn nt-btn-soft w-full" onClick={() => setVisibleDays(n => n + DAYS_PER_PAGE)}>{m.history.showMore(days.length - shownDays.length)}</button>
          )}
        </div>
      )}

      {editing && <LogForm profile={data.profile} entry={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

interface LogRowProps {
  log: LogEntry;
  describe: (log: LogEntry) => string[];
  time: string;
  duration: string;
  label: string;
  isDeleting: boolean;
  deleteLabel: string;
  confirmLabel: string;
  onEdit: (log: LogEntry) => void;
  onDelete: (event: React.MouseEvent, log: LogEntry) => void;
}

const LogRow = React.memo<LogRowProps>(({ log, describe, time, duration, label, isDeleting, deleteLabel, confirmLabel, onEdit, onDelete }) => (
  <div className="nt-log-row">
    <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => onEdit(log)}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${TYPE_META[log.type]?.badge ?? ''}`}><TypeIcon type={log.type} /></span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 text-sm font-black">
          {label}
          {duration && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{duration}</span>}
          {describe(log).map((line, i) => <span key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{line}</span>)}
        </span>
        <span className="mt-0.5 block text-xs font-semibold tabular-nums text-[var(--nt-muted)]">{time}</span>
        {log.details.notes && <span className="mt-0.5 block truncate text-xs italic text-[var(--nt-muted)]">“{log.details.notes}”</span>}
      </span>
    </button>
    <button type="button" onClick={event => onDelete(event, log)} aria-label={isDeleting ? confirmLabel : deleteLabel}
      className={`flex h-10 shrink-0 items-center justify-center rounded-full transition-all ${isDeleting ? 'w-auto bg-red-500 px-3 text-xs font-black text-white' : 'w-10 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-950/40'}`}>
      {isDeleting ? confirmLabel : <TrashIcon className="pointer-events-none h-5 w-5" />}
    </button>
  </div>
));

const Timeline: React.FC<{ logs: LogEntry[]; day: string; onEdit: (log: LogEntry) => void }> = ({ logs, day, onEdit }) => {
  const fmt = useFormat();
  const { m } = useI18n();
  const dayStart = new Date(`${day}T00:00:00`).getTime();
  const hours = Array.from({ length: 25 }, (_, h) => h);
  return (
    <div className="nt-card relative flex h-[900px] overflow-hidden">
      <div className="relative w-11 shrink-0 border-e border-[var(--nt-line)] text-[10px] font-semibold text-[var(--nt-muted)]">
        {hours.map(h => <span key={h} className="absolute w-full text-center" style={{ top: `${(h / 24) * 100}%`, transform: 'translateY(-50%)' }}>{h}:00</span>)}
      </div>
      <div className="pointer-events-none absolute inset-0 start-11">
        {hours.map(h => <div key={h} className="absolute w-full border-t border-[var(--nt-line)]" style={{ top: `${(h / 24) * 100}%` }} />)}
      </div>
      <div className="relative ms-1 flex-1">
        {logs.map(log => {
          const startMin = Math.max(0, (log.startTime - dayStart) / 60000);
          const minutes = log.durationSeconds ? log.durationSeconds / 60 : 12;
          return (
            <button key={log.id} type="button" onClick={() => onEdit(log)}
              className={`absolute inset-x-1 z-10 flex items-start gap-1.5 overflow-hidden rounded-md px-2 py-0.5 text-start text-[10px] font-bold shadow-sm ${TYPE_META[log.type]?.block ?? ''}`}
              style={{ top: `${(startMin / 1440) * 100}%`, height: `${Math.max((minutes / 1440) * 100, 1.6)}%` }}>
              <TypeIcon type={log.type} className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">{fmt.time(log.startTime)} {m.types[log.type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
