const EXTERNAL = 4;

function showUserName(users) {
  const [user] = users;
  if (user?.display_name) {
    return user.display_name.trim();
  }
  return user ? `${user?.firstname || ''} ${user?.lastname || ''}`.trim() : '';
}

const mapData = (data) => ({
  id: data?.id || 0,
  company_name: data?.name || '',
  contact_name: data?.users ? showUserName(data?.users) : '',
  reg_number: data?.reg_number || '',
  email: data?.email || '',
  phone: data?.mobile || '',
  address: data?.address || '',
  status: data?.status || '',
  trades: data?.trades || [],
  locations: data?.regions || [],
  users: data?.users || [],
  type: data?.type || EXTERNAL,
  subscription_id: data?.subscription_id || 0,
  created_at: data.created_at || '',
});

const getDataFromForm = (data) => {
  const locations = data?.locations?.length
    ? data.locations.map((location) => Number(location.id))
    : [];
  const trades = data?.trades?.length
    ? data.trades.map((trade) => Number(trade.id))
    : [];
  const email = data && (data.email || data['email-no-validation'] || '');
  return {
    data: {
      ...data,
      email,
      locations,
      trades,
    },
  };
};

const transformFormData = (id, data) => {
  const users = {
    id,
    firstname: data.contact_name,
    email: data.email,
    lastname: '',
  };
  return {
    ...data,
    id,
    company: data.company_name,
    users,
  };
};

export { showUserName, mapData, EXTERNAL, getDataFromForm, transformFormData };
