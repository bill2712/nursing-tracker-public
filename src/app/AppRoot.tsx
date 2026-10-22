import React, { Suspense, lazy, useEffect, useState } from 'react';
import './app.css';
import type { AppMessages } from '../i18n/app/en';
import type { Locale } from '../i18n/locales';
import { I18nProvider, loadMessages } from './i18n';
import { onPersistError, useAppData } from './store';
import { loadDevelopment, type DevMonth } from '../data/development';
import { monthSlug } from '../lib/milestones';
import { ToastHost, showToast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Today } from './components/Today';
import { History } from './components/History';
import { Development } from './components/Development';
import { Settings, downloadBackup, type SiteLinks } from './components/Settings';
import { Onboarding } from './components/Onboarding';
import { BabyIcon, BarChartIcon, ClockIcon, ListIcon, RulerIcon, SettingsIcon } from './components/Icons';

// Chart screens load on demand so the Today screen opens quickly.
const loadTrends = () => import('./components/Trends').then(mod => ({ default: mod.Trends }));
const loadHealth = () => import('./components/Health').then(mod => ({ default: mod.Health }));
const Trends = lazy(loadTrends);
const Health = lazy(loadHealth);

type Tab = 'today' | 'history' | 'trends' | 'growth' | 'development' | 'settings';
const TABS: Tab[] = ['today', 'history', 'trends', 'growth', 'development', 'settings'];

const tabFromHash = (): Tab => {
  const hash = window.location.hash.replace('#', '') as Tab;
  return TABS.includes(hash) ? hash : 'today';
};

interface AppRootProps {
  locale: Locale;
  links: SiteLinks;
  milestonesBase: string;
  monthLabels: Record<number, string>;
  loadingLabel: string;
  errorLabel: string;
  retryLabel: string;
}

const LoadError: React.FC<{ text: string; retryLabel: string; onRetry: () => void }> = ({ text, retryLabel, onRetry }) => (
  <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center text-sm font-semibold text-[var(--nt-muted)]">
    <p>{text}</p>
    <button type="button" className="nt-btn nt-btn-dark" onClick={onRetry}>{retryLabel}</button>
  </div>
);

const useDarkMode = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
};

const AppRoot: React.FC<AppRootProps> = ({ locale, links, milestonesBase, monthLabels, loadingLabel, errorLabel, retryLabel }) => {
  const [messages, setMessages] = useState<AppMessages | null>(null);
  const [months, setMonths] = useState<DevMonth[] | null>(null);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [loadFailed, setLoadFailed] = useState(false);
  const data = useAppData();
  const dark = useDarkMode();

  useEffect(() => {
    let alive = true;
    Promise.all([loadMessages(locale), loadDevelopment(locale)]).then(([msgs, dev]) => {
      if (!alive) return;
      // Warm the chart screens in the background once the app is ready.
      window.setTimeout(() => { import('./components/Trends').catch(() => {}); import('./components/Health').catch(() => {}); }, 1500);
      setMessages(msgs);
      setMonths(dev);
      onPersistError(() => showToast({ message: msgs.today.storageError, tone: 'error', durationMs: 8000 }));
    }).catch(() => { if (alive) setLoadFailed(true); });
    return () => { alive = false; };
  }, [locale]);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (next: Tab) => {
    if (next === tab) {
      document.querySelector('.nt-app-main')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Use the hash so the back button returns to the previous tab.
    window.location.hash = next === 'today' ? '' : next;
    if (next === 'today') history.replaceState(null, '', window.location.pathname + window.location.search);
    setTab(next);
    document.querySelector('.nt-app-main')?.scrollTo({ top: 0 });
  };

  if (loadFailed) return <LoadError text={errorLabel} retryLabel={retryLabel} onRetry={() => window.location.reload()} />;

  if (!messages || !months) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-sm font-semibold text-[var(--nt-muted)]">
        <div className="nt-spinner" aria-hidden="true" />
        {loadingLabel}
      </div>
    );
  }

  const m = messages;
  const nav: { tab: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { tab: 'today', label: m.nav.today, Icon: ClockIcon },
    { tab: 'history', label: m.nav.history, Icon: ListIcon },
    { tab: 'trends', label: m.nav.trends, Icon: BarChartIcon },
    { tab: 'growth', label: m.nav.health, Icon: RulerIcon },
    { tab: 'development', label: m.nav.development, Icon: BabyIcon },
    { tab: 'settings', label: m.nav.settings, Icon: SettingsIcon }
  ];
  const defaultVolume = locale === 'en' && /^en-US/i.test(navigator.language) ? 'oz' : 'ml';

  return (
    <I18nProvider messages={messages} locale={locale}>
      <div className="nt-app">
        <div className="nt-app-main no-scrollbar">
          <ErrorBoundary key={tab} fallback={() => (
            <LoadError text={errorLabel} retryLabel={retryLabel} onRetry={() => window.location.reload()} />
          )}>
          <Suspense fallback={<div className="flex h-60 items-center justify-center"><div className="nt-spinner" aria-hidden="true" /></div>}>
          {tab === 'today' && <Today data={data} onBackup={downloadBackup} />}
          {tab === 'history' && <History data={data} />}
          {tab === 'trends' && <Trends data={data} dark={dark} />}
          {tab === 'growth' && <Health data={data} dark={dark} onOpenSettings={() => go('settings')} />}
          {tab === 'development' && (
            <Development data={data} months={months} monthLabel={n => monthLabels[n] ?? String(n)}
              milestonesUrl={month => `${milestonesBase}${monthSlug(month)}/`} />
          )}
          {tab === 'settings' && <Settings data={data} links={links} />}
          </Suspense>
          </ErrorBoundary>
        </div>
        <nav className="nt-bottom-nav safe-area-pb" aria-label={m.settings.more}>
          {nav.map(item => (
            <button key={item.tab} type="button" className="nt-nav-btn" aria-current={tab === item.tab ? 'page' : undefined} onClick={() => go(item.tab)}>
              <span className="nt-nav-icon"><item.Icon className="h-5 w-5" /></span>
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {!data.onboarded && <Onboarding profile={data.profile} defaultVolume={defaultVolume} />}
      <ToastHost />
    </I18nProvider>
  );
};

export default AppRoot;
