import React, { useState } from 'react';
import { Modal } from './Modal';
import { showToast, vibrate } from './Toast';
import { useI18n, useVolume } from '../i18n';
import { actions } from '../store';
import { ALL_TYPES, isTimedType, type ActivityType, type BabyProfile, type LogDetails, type LogEntry } from '../types';
import { generateId, toLocalInput } from '../utils';
import { TypeIcon } from '../typeMeta';

interface LogFormProps {
  profile: BabyProfile;
  /** Existing entry to edit, or undefined to add a new one. */
  entry?: LogEntry;
  defaultType?: ActivityType;
  onClose: () => void;
}

const detailsFor = (type: ActivityType, previous: LogDetails = {}): LogDetails => {
  const notes = previous.notes ? { notes: previous.notes } : {};
  switch (type) {
    case 'feeding': return { feedingType: previous.feedingType ?? 'bottle', side: previous.side, amountMl: previous.amountMl, ...notes };
    case 'pumping': return { side: previous.side ?? 'both', amountMl: previous.amountMl, ...notes };
    case 'diaper': return { diaperState: previous.diaperState ?? 'wet', urineMl: previous.urineMl, ...notes };
    case 'solids': return { amountMl: previous.amountMl, foods: previous.foods ?? [], reaction: previous.reaction, ...notes };
    default: return notes;
  }
};

const clean = (details: LogDetails): LogDetails => {
  const out: LogDetails = {};
  (Object.keys(details) as (keyof LogDetails)[]).forEach(key => {
    const value = details[key];
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return;
    (out as Record<string, unknown>)[key] = value;
  });
  return out;
};

export const LogForm: React.FC<LogFormProps> = ({ profile, entry, defaultType = 'feeding', onClose }) => {
  const { m } = useI18n();
  const vol = useVolume(profile);
  const now = Date.now();
  const [type, setType] = useState<ActivityType>(entry?.type ?? defaultType);
  const [start, setStart] = useState(toLocalInput(entry?.startTime ?? now - (isTimedType(entry?.type ?? defaultType) ? 15 * 60000 : 0)));
  const [end, setEnd] = useState(toLocalInput(entry?.endTime ?? now));
  const [details, setDetails] = useState<LogDetails>(detailsFor(entry?.type ?? defaultType, entry?.details));
  const [amount, setAmount] = useState(vol.toInput(entry?.details.amountMl));
  const [urine, setUrine] = useState(vol.toInput(entry?.details.urineMl));
  const [food, setFood] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [error, setError] = useState('');

  const timed = isTimedType(type);
  const maxInput = toLocalInput(now + 5 * 60000);
  const patch = (update: Partial<LogDetails>) => setDetails(previous => ({ ...previous, ...update }));

  const chooseType = (next: ActivityType) => {
    setType(next);
    setDetails(previous => detailsFor(next, previous));
    setError('');
  };

  const setDurationBack = (minutes: number) => {
    const endTs = new Date(end).getTime();
    const base = Number.isFinite(endTs) ? endTs : Date.now();
    if (!Number.isFinite(endTs)) setEnd(toLocalInput(base));
    setStart(toLocalInput(base - minutes * 60000));
  };

  const addFood = () => {
    const value = food.trim();
    if (!value) return;
    patch({ foods: [...(details.foods ?? []), value] });
    setFood('');
  };

  const save = () => {
    // Keep the exact saved times (with seconds and paused time left out) unless the user changed them.
    const startUnchanged = !!entry && start === toLocalInput(entry.startTime);
    const endUnchanged = entry?.endTime !== undefined && end === toLocalInput(entry.endTime);
    const startTs = startUnchanged ? entry!.startTime : new Date(start).getTime();
    const endTs = timed ? (endUnchanged ? entry!.endTime! : new Date(end).getTime()) : undefined;
    if (!Number.isFinite(startTs) || (timed && !Number.isFinite(endTs))) return setError(m.form.pickTime);
    // Allow a few minutes of clock difference, but catch a wrong day or AM/PM.
    const latest = Date.now() + 5 * 60000;
    if ((!startUnchanged && startTs > latest) || (timed && !endUnchanged && (endTs as number) > latest)) return setError(m.form.futureTime);
    if (timed && (endTs as number) <= startTs) return setError(m.form.endBeforeStart);
    const durationSeconds = timed
      ? startUnchanged && endUnchanged && entry?.durationSeconds && entry.type === type
        ? entry.durationSeconds
        : Math.round(((endTs as number) - startTs) / 1000)
      : undefined;

    const next: LogDetails = { ...details };
    const needsAmount = type === 'pumping' || type === 'solids' || (type === 'feeding' && details.feedingType === 'bottle');
    if (needsAmount) {
      if (amount.trim() && vol.parse(amount) === null) return setError(m.form.amountRange);
      next.amountMl = vol.parse(amount) ?? undefined;
    } else {
      delete next.amountMl;
    }
    if (type === 'diaper') {
      if (urine.trim() && vol.parse(urine) === null) return setError(m.form.amountRange);
      next.urineMl = vol.parse(urine) ?? undefined;
    }
    if (type === 'feeding' && details.feedingType === 'bottle') delete next.side;
    if (type === 'solids' && food.trim()) next.foods = [...(next.foods ?? []), food.trim()];

    const log: LogEntry = {
      id: entry?.id ?? generateId(),
      type,
      startTime: startTs,
      ...(timed ? { endTime: endTs, durationSeconds } : {}),
      details: clean(next)
    };
    actions.saveLog(log);
    vibrate();
    showToast({ message: m.today.savedEntry });
    onClose();
  };

  const remove = () => {
    if (!entry) return;
    const removed = actions.removeLog(entry.id);
    vibrate();
    showToast({ message: m.today.deleted, actionLabel: m.common.undo, onAction: () => removed && actions.saveLog(removed) });
    onClose();
  };

  return (
    <Modal
      title={entry ? m.form.titleEdit : m.form.titleAdd}
      onClose={onClose}
      closeLabel={m.common.close}
      footer={
        <div className="flex gap-2">
          {entry && <button type="button" onClick={remove} className="nt-btn nt-btn-danger">{m.common.delete}</button>}
          <button type="button" onClick={save} className="nt-btn nt-btn-dark flex-1">{m.form.save}</button>
        </div>
      }
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="nt-label">{m.form.type}</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {ALL_TYPES.map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={type === option}
                onClick={() => chooseType(option)}
                className={`flex min-h-[3.6rem] flex-col items-center justify-center gap-1 rounded-xl border px-1 text-[11px] font-bold leading-tight transition-colors ${type === option ? 'border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-200' : 'border-[var(--nt-line)] text-[var(--nt-muted)]'}`}
              >
                <TypeIcon type={option} className="h-4 w-4" />
                <span className="text-center">{m.types[option]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {timed ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="nt-label">{m.form.start}</span>
                <input type="datetime-local" className="nt-input text-sm" value={start} max={maxInput} onChange={e => setStart(e.target.value)} />
              </label>
              <label>
                <span className="nt-label">{m.form.end}</span>
                <input type="datetime-local" className="nt-input text-sm" value={end} max={maxInput} onChange={e => setEnd(e.target.value)} />
              </label>
            </div>
            <div>
              <p className="nt-label">{m.form.quickDuration}</p>
              <div className="flex flex-wrap gap-1.5">
                {[5, 10, 15, 20, 30, 45, 60].map(min => (
                  <button key={min} type="button" className="nt-chip-btn" onClick={() => setDurationBack(min)}>{min} {m.common.minutesShort}</button>
                ))}
                <span className="flex items-center gap-1">
                  <input type="number" inputMode="numeric" min="1" className="nt-input !min-h-[2.4rem] !w-20 text-center text-sm" placeholder={m.timer.customMinutes} value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} aria-label={m.timer.customMinutes} />
                  <button type="button" className="nt-chip-btn" onClick={() => { const n = parseInt(customMinutes, 10); if (n > 0) { setDurationBack(n); setCustomMinutes(''); } }}>{m.common.set}</button>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <label className="block">
            <span className="nt-label">{m.form.time}</span>
            <input type="datetime-local" className="nt-input text-sm" value={start} max={maxInput} onChange={e => setStart(e.target.value)} />
          </label>
        )}

        {type === 'feeding' && (
          <div className="space-y-3">
            <div className="nt-seg" role="group" aria-label={m.timer.method}>
              {(['breast', 'bottle'] as const).map(method => (
                <button key={method} type="button" aria-pressed={details.feedingType === method} onClick={() => patch({ feedingType: method })}>{m.method[method]}</button>
              ))}
            </div>
            {details.feedingType === 'breast' && (
              <div className="nt-seg" role="group" aria-label={m.timer.side}>
                {(['left', 'right', 'both'] as const).map(side => (
                  <button key={side} type="button" aria-pressed={details.side === side} onClick={() => patch({ side })}>{m.side[side]}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {type === 'pumping' && (
          <div className="nt-seg" role="group" aria-label={m.timer.side}>
            {(['left', 'right', 'both'] as const).map(side => (
              <button key={side} type="button" aria-pressed={details.side === side} onClick={() => patch({ side })}>{m.side[side]}</button>
            ))}
          </div>
        )}

        {type === 'diaper' && (
          <div className="space-y-3">
            <div className="nt-seg" role="group" aria-label={m.types.diaper}>
              {(['wet', 'dirty', 'mixed'] as const).map(state => (
                <button key={state} type="button" aria-pressed={details.diaperState === state} onClick={() => patch({ diaperState: state })}>{m.diaper[state]}</button>
              ))}
            </div>
            <label className="block">
              <span className="nt-label">{m.form.urine} ({vol.unit})</span>
              <input type="number" inputMode="decimal" min="0" step={vol.step} className="nt-input" value={urine} onChange={e => setUrine(e.target.value)} />
            </label>
          </div>
        )}

        {(type === 'pumping' || type === 'solids' || (type === 'feeding' && details.feedingType === 'bottle')) && (
          <div>
            <label className="block">
              <span className="nt-label">{m.form.amount} ({vol.unit})</span>
              <input type="number" inputMode="decimal" min="0" step={vol.step} className="nt-input text-lg font-bold" value={amount} onChange={e => setAmount(e.target.value)} />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {vol.presets.map(preset => (
                <button key={preset} type="button" className="nt-chip-btn" onClick={() => setAmount(String(preset))}>{vol.presetLabel(preset)}</button>
              ))}
            </div>
          </div>
        )}

        {type === 'solids' && (
          <div className="space-y-3">
            <div>
              <span className="nt-label">{m.form.foods}</span>
              {(details.foods ?? []).length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {(details.foods ?? []).map((item, index) => (
                    <span key={`${item}-${index}`} className="inline-flex items-center gap-1 rounded-lg bg-orange-100 px-2 py-1 text-xs font-bold text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                      {item}
                      <button type="button" aria-label={`${m.common.delete} ${item}`} onClick={() => patch({ foods: (details.foods ?? []).filter((_, i) => i !== index) })}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input className="nt-input" value={food} placeholder={m.form.foodPlaceholder} onChange={e => setFood(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFood(); } }} />
                <button type="button" className="nt-btn nt-btn-soft" onClick={addFood}>{m.form.addFood}</button>
              </div>
            </div>
            <label className="block">
              <span className="nt-label">{m.form.reaction}</span>
              <input className="nt-input" value={details.reaction ?? ''} placeholder={m.form.reactionPlaceholder} onChange={e => patch({ reaction: e.target.value })} />
            </label>
          </div>
        )}

        <label className="block">
          <span className="nt-label">{m.common.notes}</span>
          <textarea className="nt-input resize-none" rows={2} value={details.notes ?? ''} placeholder={m.common.notesPlaceholder} onChange={e => patch({ notes: e.target.value })} />
        </label>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      </div>
    </Modal>
  );
};
