const boolStrings = ['true', 'false'];
function flag(key, flags = FLAGS) {
  const flagCheck = flags || {};
  const trimKey = (typeof key === 'string' && key.trim()) || '';
  if (boolStrings.includes(flagCheck[trimKey])) {
    return String(flagCheck[trimKey]) === 'true';
  }
  return flagCheck[trimKey];
}

export default flag;
