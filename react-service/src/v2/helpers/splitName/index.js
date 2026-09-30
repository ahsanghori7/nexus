const splitName = (name) => {
  if (!name || typeof name !== 'string') return { firstName: '', lastName: '' };
  const trimmed = name.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const names = trimmed.split(/\s+/);
  if (!names.length) return { firstName: '', lastName: '' };
  const firstName = names[0];
  const lastName = names.slice(1).join(' ');
  return { firstName, lastName };
};

export default splitName;
