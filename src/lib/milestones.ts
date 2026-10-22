/** URL slug for a development month page, e.g. "newborn", "1-month" or "6-months". */
export const monthSlug = (month: number): string => (month === 0 ? 'newborn' : month === 1 ? '1-month' : `${month}-months`);
