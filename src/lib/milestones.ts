/** URL slug for a development month page, e.g. "newborn" or "6-months". */
export const monthSlug = (month: number): string => (month === 0 ? 'newborn' : `${month}-months`);
