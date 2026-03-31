function normalizeDate(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfDay(dateInput) {
  const date = normalizeDate(dateInput);
  return date;
}

function endOfDay(dateInput) {
  const date = normalizeDate(dateInput);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

function formatDateKey(dateInput) {
  const date = normalizeDate(dateInput);
  return date.toISOString().slice(0, 10);
}

function hoursBetween(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return 0;
  return Number((ms / (1000 * 60 * 60)).toFixed(2));
}

module.exports = {
  normalizeDate,
  startOfDay,
  endOfDay,
  formatDateKey,
  hoursBetween,
};
