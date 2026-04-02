function pad(num) {
  return String(num).padStart(2, '0');
}

function safeDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input === 'string' || typeof input === 'number') return new Date(input);
  if (input && typeof input === 'object' && input.$date) return new Date(input.$date);
  return new Date(input);
}

function formatDateKey(input) {
  const date = safeDate(input) || new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTime(input) {
  const date = safeDate(input);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${formatDateKey(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatMonthDay(input) {
  const date = safeDate(input);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainSeconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  if (minutes > 0) return `${minutes}m ${pad(remainSeconds)}s`;
  return `${remainSeconds}s`;
}

function isSameDay(left, right) {
  return formatDateKey(left) === formatDateKey(right);
}

function sumProgress(progressMap = {}) {
  return Object.values(progressMap).reduce((total, current) => total + (Number(current) || 0), 0);
}

function buildMonthCalendar(baseDate = new Date(), marks = {}) {
  const current = safeDate(baseDate) || new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const firstDay = monthStart.getDay();
  const totalDays = monthEnd.getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ empty: true, key: `empty-${i}` });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    cells.push({
      key: dateKey,
      day,
      dateKey,
      hasCheckIn: !!((marks[dateKey] || {}).checkIn),
      hasQuest: !!((marks[dateKey] || {}).quest),
      count: (marks[dateKey] || {}).count || 0,
      isToday: isSameDay(date, new Date()),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ empty: true, key: `tail-${cells.length}` });
  }

  return {
    year,
    month: month + 1,
    cells,
  };
}

module.exports = {
  buildMonthCalendar,
  formatDateKey,
  formatDateTime,
  formatDuration,
  formatMonthDay,
  isSameDay,
  safeDate,
  sumProgress,
};
