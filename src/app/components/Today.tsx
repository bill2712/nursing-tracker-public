import React, { useEffect, useMemo, useState } from 'react';
import { LogForm } from './LogForm';
import { TimerView } from './TimerView';
import { showToast, vibrate } from './Toast';
import { useFormat, useI18n, useVolume } from '../i18n';
import { actions } from '../store';
import type { ActivityType, AppData, DiaperState, LogEntry, TimedType } from '../types';
import { generateId, getTrackerSummary } from '../utils';
import { TYPE_META, TypeIcon } from '../typeMeta';

const BACKUP_INTERVAL_DAYS = 7;

export const Today: React.FC<{ data: AppData; onBackup: () => void }> = ({ data, onBackup }) => {
  const { m } = useI18n();
  const fmt = useFormat();
  const vol = useVolume(data.profile);
  const [now, setNow] = useState(() => Date.now());
  const [showForm, setShowForm] = useState(false);
  const [solids, setSolids] = useState('');
  const [urine, setUrine] = useState('');

  // Refresh "x min ago" labels and today's totals.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') setNow(Date.now()); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  // Use the current time (not just the last tick) so entries made since the last refresh count.
  const summary = useMemo(() => getTrackerSummary(data.logs, Math.max(now, Date.now())), [data.logs, now]);
  const t = summary.today;

  if (data.activeTimer) return <TimerView timer={data.activeTimer} profile={data.profile} />;

  const logWithUndo = (log: LogEntry, message: string) => {
    actions.saveLog(log);
    vibrate();
    showToast({ message, actionLabel: m.common.undo, onAction: () => actions.removeLog(log.id) });
  };

  const startTimer = (type: TimedType) => {
    vibrate();
    actions.setTimer({ type, startTime: Date.now(), ignoredDurationMs: 0, details: type === 'feeding' ? { feedingType: 'bottle' } : type === 'pumping' ? { side: 'both' } : {} });
  };

  const quickBath = (minutes: number) => {
    const end = Date.now();
    logWithUndo({ id: generateId(), type: 'bath', startTime: end - minutes * 60000, endTime: end, durationSeconds: minutes * 60, details: {} }, m.today.savedBath(minutes));
  };

  const quickDiaper = (state: DiaperState) => {
    const urineMl = urine.trim() ? vol.parse(urine) : null;
    if (urine.trim() && urineMl === null) return showToast({ message: m.today.invalidAmount, tone: 'error' });
    logWithUndo(
      { id: generateId(), type: 'diaper', startTime: Date.now(), details: { diaperState: state, ...(urineMl ? { urineMl } : {}) } },
      m.today.savedDiaper(m.diaper[state] + (urineMl ? ` · ${vol.format(urineMl)}` : ''))
    );
    setUrine('');
  };

  const quickSolids = () => {
    const amountMl = vol.parse(solids);
    if (amountMl === null) return showToast({ message: m.today.invalidAmount, tone: 'error' });
    logWithUndo({ id: generateId(), type: 'solids', startTime: Date.now(), details: { amountMl } }, m.today.savedSolids(vol.format(amountMl)));
    setSolids('');
  };

  const quickCare = (type: ActivityType) => logWithUndo({ id: generateId(), type, startTime: Date.now(), details: {} }, m.today.savedCare(m.types[type]));

  const daysSinceBackup = data.lastBackupAt ? Math.floor((now - data.lastBackupAt) / 86400000) : null;
  const snoozedRecently = data.backupReminderSnoozedAt && now - data.backupReminderSnoozedAt < 3 * 86400000;
  const showBackupReminder = data.logs.length >= 10 && !snoozedRecently && (daysSinceBackup === null || daysSinceBackup >= BACKUP_INTERVAL_DAYS);

  const last = summary.last;
  const lastFeedDetail = last.feeding
    ? last.feeding.details.amountMl ? vol.format(last.feeding.details.amountMl)
      : last.feeding.details.feedingType === 'breast' ? [m.method.breast, last.feeding.details.side && m.side[last.feeding.details.side]].filter(Boolean).join(' · ')
      : ''
    : '';

  return (
    <div className="nt-page space-y-3">
      <header className="flex items-center justify-between gap-3 py-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-100 to-indigo-100 text-2xl dark:from-pink-950/60 dark:to-indigo-950/60" aria-hidden="true">👶</div>
          <div className="min-w-0">
            <p className="eyebrow !text-[0.68rem]">{m.today.overview}</p>
            <h1 className="truncate text-lg font-black">{m.today.careOf(data.profile.name)}</h1>
          </div>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="nt-btn nt-btn-primary shrink-0 !px-3 text-xs">{m.today.addPast}</button>
      </header>

      {showBackupReminder && (
        <div className="notice flex flex-col gap-2 p-3.5 text-sm sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-black">💾 {m.today.backupTitle}</p>
            <p className="mt-0.5">{m.today.backupText(daysSinceBackup)}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="nt-btn nt-btn-dark !min-h-[2.4rem] text-xs" onClick={onBackup}>{m.today.backupAction}</button>
            <button type="button" className="nt-btn !min-h-[2.4rem] text-xs" onClick={() => actions.snoozeBackupReminder()}>{m.today.backupLater}</button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2" aria-label={m.today.overview}>
        <StatCard color={TYPE_META.feeding.color} label={m.today.lastFeeding} value={last.feeding ? fmt.ago(last.feeding.endTime || last.feeding.startTime, now) : m.common.none} accentClass="text-pink-600 dark:text-pink-400"
          lines={[lastFeedDetail, m.today.feedsToday(t.feeds, vol.format(t.feedingMl)), t.solidsMl > 0 ? m.today.totalIntake(vol.format(t.totalMl)) : '', t.pumpedMl > 0 ? m.today.pumpedToday(vol.format(t.pumpedMl)) : '']} />
        <StatCard color={TYPE_META.sleep.color} label={m.today.lastSleep} value={last.sleep ? fmt.ago(last.sleep.endTime || last.sleep.startTime, now) : m.common.none} accentClass="text-indigo-600 dark:text-indigo-400"
          lines={[last.sleep?.durationSeconds ? fmt.duration(last.sleep.durationSeconds) : '', m.today.sleepToday(fmt.duration(t.sleepSeconds)), summary.weekBaths > 0 ? m.today.weekBaths(summary.weekBaths) : '']} />
        <StatCard color={TYPE_META.diaper.color} label={m.today.lastDiaper} value={last.diaper ? fmt.ago(last.diaper.startTime, now) : m.common.none} accentClass="text-emerald-600 dark:text-emerald-400"
          lines={[last.diaper?.details.diaperState ? m.diaper[last.diaper.details.diaperState] : '', m.today.diapersToday(t.diapers.wet, t.diapers.dirty), t.urineMl > 0 ? m.today.urineToday(vol.format(t.urineMl)) : '']} />
        <StatCard color={TYPE_META.solids.color} label={m.today.lastSolids} value={last.solids ? fmt.ago(last.solids.startTime, now) : m.common.none} accentClass="text-orange-600 dark:text-orange-400"
          lines={[last.solids?.details.amountMl ? vol.format(last.solids.details.amountMl) : '', m.today.solidsToday(vol.format(t.solidsMl))]} />
      </section>

      {data.logs.length === 0 && (
        <div className="callout p-4 text-center">
          <p className="font-black">{m.today.emptyTitle}</p>
          <p className="mt-1 text-sm text-[var(--nt-muted)]">{m.today.emptyText}</p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2">
        {(['feeding', 'sleep', 'pumping', 'bath'] as TimedType[]).map(type => (
          <div key={type} className="relative">
            <button type="button" onClick={() => startTimer(type)} className={`nt-action h-full w-full ${type === 'bath' ? '!pb-[3.4rem]' : ''}`}
              style={{ ['--tint' as string]: tint[type].light, ['--tint-dark' as string]: tint[type].dark }}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TYPE_META[type].badge}`}><TypeIcon type={type} /></span>
              <span className="mt-2 block text-[15px] font-black leading-tight">{m.startTypes[type]}</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-[var(--nt-muted)]">{m.startHints[type]}</span>
            </button>
            {type === 'bath' && (
              <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
                {[5, 10, 15].map(min => (
                  <button key={min} type="button" onClick={() => quickBath(min)} className="flex-1 rounded-lg border border-sky-200 bg-sky-50 py-1.5 text-[11px] font-black text-sky-800 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                    {min} {m.common.minutesShort}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="nt-panel" style={{ ['--tint' as string]: 'rgb(236 253 245)', ['--tint-dark' as string]: 'rgb(6 78 59 / 35%)' }}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-emerald-800 dark:text-emerald-300">{m.today.quickDiaper}</h2>
          <span className="text-[11px] font-bold text-emerald-700/80 dark:text-emerald-300/80">{m.today.diapersToday(t.diapers.wet, t.diapers.dirty)}</span>
        </div>
        <label className="relative mb-2 block">
          <span className="sr-only">{m.today.urinePlaceholder}</span>
          <input type="number" inputMode="decimal" min="0" step={vol.step} value={urine} onChange={e => setUrine(e.target.value)} placeholder={m.today.urinePlaceholder} className="nt-input pe-12 text-sm" />
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-bold text-[var(--nt-muted)]">{vol.unit}</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['wet', 'dirty', 'mixed'] as DiaperState[]).map(state => (
            <button key={state} type="button" onClick={() => quickDiaper(state)} className="nt-btn !min-h-[3.4rem] flex-col !gap-0.5 !px-1 bg-emerald-100 text-[13px] leading-tight text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
              <span aria-hidden="true">{state === 'wet' ? '💧' : state === 'dirty' ? '💩' : '✨'}</span>{m.diaper[state]}
            </button>
          ))}
        </div>
      </section>

      <section className="nt-panel" style={{ ['--tint' as string]: 'rgb(255 247 237)', ['--tint-dark' as string]: 'rgb(67 20 7 / 45%)' }}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-orange-800 dark:text-orange-300">🥣 {m.today.quickSolids}</h2>
          <span className="text-[11px] font-bold text-orange-700/80 dark:text-orange-300/80">{m.today.solidsToday(vol.format(t.solidsMl))}</span>
        </div>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{m.today.solidsPlaceholder}</span>
            <input type="number" inputMode="decimal" min="0" step={vol.step} value={solids} onChange={e => setSolids(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') quickSolids(); }} placeholder={m.today.solidsPlaceholder} className="nt-input pe-12" />
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-bold text-[var(--nt-muted)]">{vol.unit}</span>
          </label>
          <button type="button" onClick={quickSolids} className="nt-btn shrink-0 bg-orange-500 text-white">{m.today.log}</button>
        </div>
      </section>

      <section>
        <h2 className="mb-1.5 px-1 text-[11px] font-black uppercase tracking-wider text-[var(--nt-muted)]">{m.today.care}</h2>
        <div className="grid grid-cols-2 gap-2">
          {([['clear_snot', '🤧', t.snot], ['clean_mouth', '🦷', t.mouth]] as [ActivityType, string, number][]).map(([type, emoji, count]) => (
            <button key={type} type="button" onClick={() => quickCare(type)} className="nt-card flex min-h-[3rem] items-center justify-between gap-2 px-3 text-sm font-black">
              <span className="flex items-center gap-2"><span className="text-lg" aria-hidden="true">{emoji}</span>{m.types[type]}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-[var(--nt-muted)] dark:bg-slate-800">{m.today.careToday(count)}</span>
            </button>
          ))}
        </div>
      </section>

      {showForm && <LogForm profile={data.profile} onClose={() => setShowForm(false)} />}
    </div>
  );
};

const tint: Record<TimedType, { light: string; dark: string }> = {
  feeding: { light: 'rgb(253 242 248)', dark: 'rgb(80 7 36 / 40%)' },
  sleep: { light: 'rgb(238 242 255)', dark: 'rgb(30 27 75 / 55%)' },
  pumping: { light: 'rgb(236 254 255)', dark: 'rgb(8 51 68 / 55%)' },
  bath: { light: 'rgb(240 249 255)', dark: 'rgb(12 74 110 / 45%)' }
};

const StatCard: React.FC<{ color: string; label: string; value: string; lines: string[]; accentClass: string }> = ({ color, label, value, lines, accentClass }) => (
  <div className="nt-card nt-stat flex min-h-[7rem] flex-col" style={{ ['--accent' as string]: color }}>
    <span className="text-[11px] font-bold text-[var(--nt-muted)]">{label}</span>
    <span className={`mt-1.5 text-lg font-black leading-tight ${accentClass}`}>{value}</span>
    <span className="mt-auto space-y-0.5 pt-2">
      {lines.filter(Boolean).map((line, index) => (
        <span key={index} className={`block text-[11px] font-bold leading-snug ${index === 0 ? 'text-[var(--nt-text)]' : 'text-[var(--nt-muted)]'}`}>{line}</span>
      ))}
    </span>
  </div>
);
