import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { showToast, vibrate } from './Toast';
import { useFormat, useI18n, useVolume } from '../i18n';
import { actions } from '../store';
import type { ActiveTimer, BabyProfile, LogEntry } from '../types';
import { formatTimer, generateId, getFinishedTimerTimes, getTimerElapsedSeconds, toLocalInput } from '../utils';
import { TYPE_META, TypeIcon } from '../typeMeta';
import { PencilIcon } from './Icons';

const SNOOZE_MS = 5 * 60 * 1000;

export const TimerView: React.FC<{ timer: ActiveTimer; profile: BabyProfile }> = ({ timer, profile }) => {
  const { m } = useI18n();
  const fmt = useFormat();
  const vol = useVolume(profile);
  const [now, setNow] = useState(Date.now());
  const [editingStart, setEditingStart] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [amount, setAmount] = useState(vol.toInput(timer.details.amountMl));

  const paused = Boolean(timer.pauseStartTime);
  const snoozed = Boolean(timer.snoozeEndTime);
  const meta = TYPE_META[timer.type];

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  // Resume automatically when a snooze ends, even if the screen stayed open.
  useEffect(() => {
    if (!timer.snoozeEndTime || !timer.pauseStartTime) return;
    const resume = () => actions.updateTimer(t => {
      if (!t.pauseStartTime || !t.snoozeEndTime) return t;
      const resumeAt = Math.max(Date.now(), t.snoozeEndTime);
      const { pauseStartTime, snoozeEndTime, ...running } = t;
      return { ...running, ignoredDurationMs: (t.ignoredDurationMs || 0) + (resumeAt - pauseStartTime) };
    });
    const remaining = timer.snoozeEndTime - Date.now();
    if (remaining <= 0) { resume(); return; }
    const id = window.setTimeout(resume, remaining);
    return () => window.clearTimeout(id);
  }, [timer.snoozeEndTime, timer.pauseStartTime]);

  const elapsed = getTimerElapsedSeconds(timer, now);
  const patchDetails = (update: Partial<ActiveTimer['details']>) => actions.updateTimer(t => ({ ...t, details: { ...t.details, ...update } }));

  const togglePause = () => {
    vibrate();
    actions.updateTimer(t => {
      if (t.pauseStartTime) {
        const { pauseStartTime, snoozeEndTime, ...running } = t;
        return { ...running, ignoredDurationMs: (t.ignoredDurationMs || 0) + (Date.now() - pauseStartTime) };
      }
      return { ...t, pauseStartTime: Date.now() };
    });
  };

  const snooze = () => {
    vibrate();
    actions.updateTimer(t => ({ ...t, pauseStartTime: t.pauseStartTime || Date.now(), snoozeEndTime: Date.now() + SNOOZE_MS }));
  };

  const addMinutes = (minutes: number) => {
    if (!(minutes > 0)) return;
    vibrate();
    actions.updateTimer(t => ({ ...t, addedDurationMs: (t.addedDurationMs || 0) + minutes * 60000 }));
  };

  const commitAmount = (value: string) => {
    setAmount(value);
    const ml = vol.parse(value);
    patchDetails({ amountMl: ml ?? undefined });
  };

  const finish = () => {
    const { startTime, endTime, durationSeconds } = getFinishedTimerTimes(timer);
    actions.setTimer(null);
    vibrate(20);
    if (durationSeconds <= 2) return;
    const details = { ...timer.details };
    if (details.feedingType === 'breast') delete details.amountMl;
    Object.keys(details).forEach(key => (details as Record<string, unknown>)[key] === undefined && delete (details as Record<string, unknown>)[key]);
    const log: LogEntry = { id: generateId(), type: timer.type, startTime, endTime, durationSeconds, details };
    actions.saveLog(log);
    const extra = details.amountMl ? ` · ${vol.format(details.amountMl)}` : '';
    showToast({
      message: m.today.savedTimer(m.types[timer.type], fmt.duration(durationSeconds) + extra),
      actionLabel: m.common.undo,
      onAction: () => { actions.removeLog(log.id); actions.setTimer(timer); }
    });
  };

  const discard = () => {
    if (elapsed > 60 && !window.confirm(m.timer.discardConfirm)) return;
    actions.setTimer(null);
  };

  const isFeeding = timer.type === 'feeding';
  const showAmount = timer.type === 'pumping' || (isFeeding && timer.details.feedingType === 'bottle');
  const showSide = timer.type === 'pumping' || (isFeeding && timer.details.feedingType === 'breast');

  return (
    <div className="nt-page flex min-h-full flex-col items-center gap-5 pt-6">
      <div className="relative">
        <div className={`absolute -inset-3 rounded-full opacity-30 ${paused ? 'bg-slate-300' : 'animate-pulse'}`} style={paused ? undefined : { background: meta.color }} />
        <div className={`relative grid h-28 w-28 place-items-center rounded-full border-4 ${meta.badge}`} style={{ borderColor: paused ? '#94a3b8' : meta.color }}>
          <TypeIcon type={timer.type} className="h-12 w-12" />
          {(paused || snoozed) && (
            <span className="absolute -bottom-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow dark:bg-slate-900 dark:text-slate-200">
              {snoozed ? m.timer.snoozed : m.timer.paused}
            </span>
          )}
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-xl font-black">{m.timer.running[timer.type]}</h1>
        <div className="mt-1 flex items-center justify-center gap-1">
          <p className={`font-mono text-5xl font-semibold tabular-nums ${paused ? 'text-slate-400' : ''}`} aria-live="off">{formatTimer(elapsed)}</p>
          <button type="button" className="nt-icon-btn" aria-label={m.timer.editStart} onClick={() => { setStartInput(toLocalInput(timer.startTime)); setEditingStart(true); }}>
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
        {snoozed && <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">{m.timer.snoozeNote}</p>}
      </div>

      <div className="nt-card w-full max-w-sm space-y-4 p-4">
        {isFeeding && (
          <div className="nt-seg" role="group" aria-label={m.timer.method}>
            {(['breast', 'bottle'] as const).map(method => (
              <button key={method} type="button" aria-pressed={timer.details.feedingType === method} onClick={() => patchDetails({ feedingType: method })}>{m.method[method]}</button>
            ))}
          </div>
        )}
        {showSide && (
          <div className="nt-seg" role="group" aria-label={m.timer.side}>
            {(['left', 'right', 'both'] as const).map(side => (
              <button key={side} type="button" aria-pressed={timer.details.side === side} onClick={() => patchDetails({ side })}>{m.side[side]}</button>
            ))}
          </div>
        )}
        {showAmount && (
          <div>
            <label className="block">
              <span className="nt-label">{m.timer.amount} ({vol.unit})</span>
              <input type="number" inputMode="decimal" min="0" step={vol.step} className="nt-input text-center text-lg font-bold" value={amount} onChange={e => commitAmount(e.target.value)} />
            </label>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {vol.presets.map(preset => (
                <button key={preset} type="button" className="nt-chip-btn" onClick={() => commitAmount(String(preset))}>{vol.presetLabel(preset)}</button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="nt-label">{m.timer.addTime}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {[5, 10, 15, 20].map(min => (
              <button key={min} type="button" className="nt-chip-btn" onClick={() => addMinutes(min)}>{m.timer.addMinutes(min)}</button>
            ))}
            <input type="number" inputMode="numeric" min="1" className="nt-input !min-h-[2.4rem] !w-20 text-center text-sm" placeholder={m.timer.customMinutes} aria-label={m.timer.customMinutes} value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { addMinutes(parseInt(customMinutes, 10)); setCustomMinutes(''); } }} />
            <button type="button" className="nt-chip-btn" onClick={() => { addMinutes(parseInt(customMinutes, 10)); setCustomMinutes(''); }}>{m.common.add}</button>
          </div>
          <p className="mt-1.5 text-xs text-[var(--nt-muted)]">{m.timer.addTimeHint}</p>
        </div>
        <label className="block">
          <span className="nt-label">{m.common.notes}</span>
          <textarea className="nt-input resize-none text-sm" rows={2} value={timer.details.notes ?? ''} placeholder={m.common.notesPlaceholder} onChange={e => patchDetails({ notes: e.target.value })} />
        </label>
      </div>

      <div className="w-full max-w-sm space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`nt-btn ${paused && !snoozed ? 'bg-emerald-500 text-white' : 'nt-btn-soft'}`} onClick={togglePause}>{paused && !snoozed ? m.timer.resume : m.timer.pause}</button>
          <button type="button" className={`nt-btn ${snoozed ? 'bg-emerald-500 text-white' : 'nt-btn-soft'}`} onClick={snoozed ? togglePause : snooze}>{snoozed ? m.timer.resume : m.timer.snooze}</button>
        </div>
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button type="button" className="nt-btn nt-btn-soft !min-h-[3.4rem]" onClick={discard}>{m.timer.discard}</button>
          <button type="button" className="nt-btn nt-btn-primary !min-h-[3.4rem] text-lg" onClick={finish}>{m.timer.finish}</button>
        </div>
      </div>

      {editingStart && (
        <Modal title={m.timer.editStart} onClose={() => setEditingStart(false)} closeLabel={m.common.close}
          footer={<button type="button" className="nt-btn nt-btn-dark w-full" onClick={() => {
            const ts = new Date(startInput).getTime();
            if (Number.isFinite(ts) && ts <= Date.now()) actions.updateTimer(t => ({ ...t, startTime: ts }));
            setEditingStart(false);
          }}>{m.timer.updateTime}</button>}>
          <label className="block">
            <span className="nt-label">{m.form.start}</span>
            <input type="datetime-local" className="nt-input" value={startInput} max={toLocalInput(Date.now())} onChange={e => setStartInput(e.target.value)} />
          </label>
          <p className="mt-2 text-sm text-[var(--nt-muted)]">{m.timer.editStartHint}</p>
        </Modal>
      )}
    </div>
  );
};
