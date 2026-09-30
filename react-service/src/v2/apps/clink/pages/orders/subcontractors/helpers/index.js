function getOrderStatusColor(status) {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'rejected') return 'error';
  return 'disabled';
}

function getApproverInitials(firstName, lastName) {
  const firstInitial = firstName?.charAt(0).toUpperCase() || '';
  const lastInitial = lastName?.charAt(0).toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
}

export { getOrderStatusColor, getApproverInitials };
