// Date helpers pinned to India Standard Time (UTC+5:30), independent of the server's timezone.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar parts of `date` as seen on a clock in IST
const istParts = (date = new Date()) => {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    y: ist.getUTCFullYear(),
    m: ist.getUTCMonth(),
    d: ist.getUTCDate(),
    hours: ist.getUTCHours(),
    minutes: ist.getUTCMinutes(),
  };
};

// 'YYYY-MM-DD' for the IST calendar day containing `date`
const istDateKey = (date = new Date()) => {
  const { y, m, d } = istParts(date);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

// IST date key `days` days before `date`
const istDateKeyDaysAgo = (days, date = new Date()) =>
  istDateKey(new Date(date.getTime() - days * DAY_MS));

// UTC start and end of the IST day containing `date`
const getTodayRangeIST = (date = new Date()) => {
  const { y, m, d } = istParts(date);
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MS);
  return { start, end };
};

// True when a stored call time is exactly midnight IST, which means a date with no time was entered
const isMidnightIST = (date) => {
  const { hours, minutes } = istParts(date);
  return hours === 0 && minutes === 0;
};

const formatTimeIST = (date) =>
  new Date(date).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

const formatDateIST = (date = new Date()) =>
  new Date(date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' });

module.exports = {
  istParts,
  istDateKey,
  istDateKeyDaysAgo,
  getTodayRangeIST,
  isMidnightIST,
  formatTimeIST,
  formatDateIST,
};
