import React, { useEffect, useRef, useState } from 'react';
import { showToast } from './Toast';
import { useFormat, useI18n, useVolume } from '../i18n';
import { actions } from '../store';
import type { AppData, BabyProfile } from '../types';
import { downloadFile, dayKey, fromLocalDateInput, toCsv, toLocalDateInput } from '../utils';

export interface SiteLinks {
  home: string;
  guides: string;
  milestones: string;
  privacy: string;
  support: string;
  languages: { locale: string; label: string; href: string; current: boolean }[];
}

type Theme = 'light' | 'dark' | 'system';

const readTheme = (): Theme => {
  try { return (localStorage.getItem('nt-theme') as Theme) || 'system'; } catch { return 'system'; }
};

export const applyTheme = (theme: Theme) => {
  try {
    if (theme === 'system') localStorage.removeItem('nt-theme'); else localStorage.setItem('nt-theme', theme);
  } catch { /* ignore */ }
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  window.dispatchEvent(new CustomEvent('nt-theme', { detail: dark }));
};

export const downloadBackup = () => {
  const text = actions.exportBackup();
  downloadFile(text, `nurturetrack-backup-${dayKey(Date.now())}.json`, 'application/json');
};

export const Settings: React.FC<{ data: AppData; links: SiteLinks }> = ({ data, links }) => {
  const { m } = useI18n();
  const fmt = useFormat();
  const vol = useVolume(data.profile);
  const [profile, setProfile] = useState<BabyProfile>(data.profile);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setProfile(data.profile), [data.profile]);

  const dirty = JSON.stringify(profile) !== JSON.stringify(data.profile);
  const setUnit = (patch: Partial<BabyProfile>) => actions.setProfile({ ...data.profile, ...patch });

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    file.text().then(text => {
      const result = actions.importBackup(text);
      if (!result) return showToast({ message: m.settings.importInvalid, tone: 'error' });
      if (result.logs === 0 && result.growth === 0) return showToast({ message: m.settings.importNothing });
      showToast({ message: m.settings.importDone(result.logs, result.growth) });
    });
  };

  const exportCsv = () => {
    const c = m.history.csv;
    const rows = data.logs.map(log => [
      m.types[log.type] ?? log.type,
      fmt.dateTime(log.startTime),
      log.endTime ? fmt.dateTime(log.endTime) : '',
      log.durationSeconds ? String(Math.round(log.durationSeconds / 60)) : '',
      [log.details.feedingType && m.method[log.details.feedingType], log.details.side && m.side[log.details.side], log.details.amountMl ? vol.format(log.details.amountMl) : '', log.details.diaperState && m.diaper[log.details.diaperState], log.details.urineMl ? m.history.urine(vol.format(log.details.urineMl)) : '', ...(log.details.foods ?? [])].filter(Boolean).join('; '),
      log.details.notes ?? ''
    ]);
    downloadFile(toCsv([c.type, c.start, c.end, c.duration, c.details, c.notes], rows), `nurturetrack-${dayKey(Date.now())}.csv`, 'text/csv');
  };

  const Seg = <T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) => (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm font-bold">{label}</span>
      <div className="nt-seg w-44" role="group" aria-label={label}>
        {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
      </div>
    </div>
  );

  return (
    <div className="nt-page space-y-5">
      <header>
        <p className="eyebrow !text-[0.68rem]">{m.settings.eyebrow}</p>
        <h1 className="text-2xl font-black">{m.settings.title}</h1>
      </header>

      <section className="nt-card space-y-4 p-4">
        <h2 className="text-sm font-black">{m.settings.profile}</h2>
        <label className="block"><span className="nt-label">{m.settings.name}</span><input className="nt-input" value={profile.name} placeholder={m.settings.namePlaceholder} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} /></label>
        <label className="block"><span className="nt-label">{m.settings.birthDate}</span><input type="date" className="nt-input" max={toLocalDateInput(Date.now())} value={profile.birthDate ? toLocalDateInput(profile.birthDate) : ''} onChange={e => setProfile(p => ({ ...p, birthDate: fromLocalDateInput(e.target.value) }))} /></label>
        <div>
          <span className="nt-label">{m.settings.sex}</span>
          <div className="nt-seg" role="group" aria-label={m.settings.sex}>
            {(['girl', 'boy'] as const).map(sex => <button key={sex} type="button" aria-pressed={profile.sex === sex} onClick={() => setProfile(p => ({ ...p, sex }))}>{m.settings[sex]}</button>)}
          </div>
        </div>
        <button type="button" disabled={!dirty} className="nt-btn nt-btn-dark w-full" onClick={() => { actions.setProfile(profile); showToast({ message: m.settings.profileSaved }); }}>{m.settings.saveProfile}</button>
      </section>

      <section className="nt-card divide-y divide-[var(--nt-line)] px-4 py-2">
        <h2 className="py-2 text-sm font-black">{m.settings.units}</h2>
        <Seg label={m.settings.volumeUnit} value={data.profile.volumeUnit} onChange={volumeUnit => setUnit({ volumeUnit })} options={[{ value: 'ml', label: 'ml' }, { value: 'oz', label: 'oz' }]} />
        <Seg label={m.settings.weightUnit} value={data.profile.weightUnit} onChange={weightUnit => setUnit({ weightUnit })} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
        <Seg label={m.settings.lengthUnit} value={data.profile.lengthUnit} onChange={lengthUnit => setUnit({ lengthUnit })} options={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'in' }]} />
      </section>

      <section className="nt-card px-4 py-2">
        <Seg label={m.settings.appearance} value={theme} onChange={value => { setTheme(value); applyTheme(value); }} options={[{ value: 'light', label: m.settings.light }, { value: 'dark', label: m.settings.dark }, { value: 'system', label: m.settings.system }]} />
        <div className="flex items-center justify-between gap-3 border-t border-[var(--nt-line)] py-3">
          <span className="text-sm font-bold">{m.settings.language}</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {links.languages.map(lang => (
              <a key={lang.locale} href={lang.href} className="nt-chip-btn" aria-pressed={lang.current} onClick={() => { try { localStorage.setItem('nt-locale', lang.locale); } catch { /* ignore */ } }}>{lang.label}</a>
            ))}
          </div>
        </div>
      </section>

      <section className="nt-card space-y-3 p-4">
        <h2 className="text-sm font-black">{m.settings.backup}</h2>
        <p className="text-sm leading-relaxed text-[var(--nt-muted)]">{m.settings.backupLead}</p>
        <p className="text-xs font-bold">{data.lastBackupAt ? m.settings.lastBackup(fmt.dateTime(data.lastBackupAt)) : m.settings.neverBackedUp} · {m.settings.stats(data.logs.length)}</p>
        <button type="button" className="nt-btn nt-btn-primary w-full" onClick={downloadBackup}>💾 {m.settings.download}</button>
        <button type="button" className="nt-btn nt-btn-soft w-full" onClick={() => fileRef.current?.click()}>{m.settings.restore}</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        <p className="text-xs text-[var(--nt-muted)]">{m.settings.restoreHint}</p>
        <button type="button" className="nt-btn nt-btn-soft w-full" disabled={data.logs.length === 0} onClick={exportCsv}>{m.settings.csv}</button>
      </section>

      <section className="callout space-y-2 p-4">
        <h2 className="text-sm font-black">☕ {m.settings.supportTitle}</h2>
        <p className="text-sm text-[var(--nt-muted)]">{m.settings.supportText}</p>
        <a href={links.support} target="_blank" rel="noopener" className="btn-kofi w-full justify-center text-sm" data-support-link>♥ {m.settings.supportButton}</a>
      </section>

      <section className="nt-card divide-y divide-[var(--nt-line)] overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-black">{m.settings.more}</h2>
        {[[links.guides, m.settings.guides], [links.milestones, m.settings.milestones], [links.privacy, m.settings.privacy], [links.home, m.settings.website]].map(([href, label]) => (
          <a key={href} href={href} className="flex items-center justify-between px-4 py-3 text-sm font-bold">{label}<span aria-hidden="true">→</span></a>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-black uppercase tracking-wider text-[var(--nt-muted)]">{m.settings.danger}</h2>
        <button type="button" className="nt-btn nt-btn-danger w-full" onClick={() => {
          if (!window.confirm(m.settings.clearConfirm)) return;
          actions.clearAll();
          showToast({ message: m.settings.cleared });
        }}>{m.settings.clearAll}</button>
        <p className="px-1 text-xs leading-relaxed text-[var(--nt-muted)]">🔒 {m.settings.privacyNote}</p>
      </section>
    </div>
  );
};
