// Mock for date helpers
export const expiredDate = jest.fn((date) => {
  if (!date) return false;
  const inputDate = new Date(date);
  const now = new Date();
  return inputDate < now;
});

export const getLondonUTCDate = jest.fn((date) => {
  const d = date ? new Date(date) : new Date();
  const pad = (n) => String(n).padStart(2, '0');

  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
});

export default {
  expiredDate,
  getLondonUTCDate,
};
