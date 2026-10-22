import type { Locale } from '../i18n/locales';
import { useUi } from '../i18n/ui';

export const toolList = (locale: Locale) => {
  const tools = useUi(locale).tools;
  return [
    { page: '/tools/formula-calculator/', emoji: '🍼', title: tools.formula.short, text: tools.formula.lead },
    { page: '/tools/growth-percentile/', emoji: '📈', title: tools.growth.short, text: tools.growth.lead }
  ];
};
