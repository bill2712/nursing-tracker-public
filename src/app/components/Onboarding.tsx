import React, { useRef, useState } from 'react';
import { Modal } from './Modal';
import { showToast } from './Toast';
import { useI18n } from '../i18n';
import { actions } from '../store';
import type { BabyProfile } from '../types';
import { fromLocalDateInput, toLocalDateInput } from '../utils';

export const Onboarding: React.FC<{ profile: BabyProfile; defaultVolume: 'ml' | 'oz' }> = ({ profile, defaultVolume }) => {
  const { m } = useI18n();
  // Only shown before setup, so the profile still has the defaults: use US units for US English.
  const [draft, setDraft] = useState<BabyProfile>(() => (defaultVolume === 'oz'
    ? { ...profile, volumeUnit: 'oz', weightUnit: 'lb', lengthUnit: 'in' }
    : { ...profile, volumeUnit: defaultVolume }));
  const fileRef = useRef<HTMLInputElement>(null);
  const finish = () => actions.completeOnboarding(draft);

  return (
    <Modal title={m.onboarding.title} onClose={finish} closeLabel={m.common.skip}
      footer={
        <div className="space-y-2">
          <button type="button" className="nt-btn nt-btn-primary w-full" onClick={finish}>{m.onboarding.start}</button>
          <button type="button" className="nt-btn w-full text-sm text-[var(--nt-muted)]" onClick={() => fileRef.current?.click()}>{m.onboarding.restore}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            file.text().then(text => {
              const result = actions.importBackup(text);
              if (!result) showToast({ message: m.settings.importInvalid, tone: 'error' });
              else showToast({ message: m.settings.importDone(result.logs, result.growth) });
            }).catch(() => showToast({ message: m.settings.importInvalid, tone: 'error' }));
          }} />
        </div>
      }>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-[var(--nt-muted)]">{m.onboarding.lead}</p>
        <label className="block"><span className="nt-label">{m.onboarding.name}</span><input className="nt-input" value={draft.name} placeholder={m.settings.namePlaceholder} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></label>
        <label className="block"><span className="nt-label">{m.onboarding.birthDate}</span><input type="date" className="nt-input" max={toLocalDateInput(Date.now())} value={draft.birthDate ? toLocalDateInput(draft.birthDate) : ''} onChange={e => setDraft(d => ({ ...d, birthDate: fromLocalDateInput(e.target.value) }))} /></label>
        <div>
          <span className="nt-label">{m.onboarding.sex}</span>
          <div className="nt-seg" role="group" aria-label={m.onboarding.sex}>
            {(['girl', 'boy'] as const).map(sex => <button key={sex} type="button" aria-pressed={draft.sex === sex} onClick={() => setDraft(d => ({ ...d, sex }))}>{m.settings[sex]}</button>)}
          </div>
        </div>
        <div>
          <span className="nt-label">{m.onboarding.volume}</span>
          <div className="nt-seg" role="group" aria-label={m.onboarding.volume}>
            {(['ml', 'oz'] as const).map(unit => <button key={unit} type="button" aria-pressed={draft.volumeUnit === unit} onClick={() => setDraft(d => ({ ...d, volumeUnit: unit }))}>{unit}</button>)}
          </div>
        </div>
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{m.onboarding.privacy}</p>
      </div>
    </Modal>
  );
};
