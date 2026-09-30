import Relay from 'v2/services/relay';
import flag from 'v2/helpers/flags';

const fetchData = (
  resource,
  params = {},
  method = '',
  version = RELAY.VERSION,
  host = RELAY.HOST
) =>
  new Relay(resource, version, host)
    .get(method, params)
    .then((result) => result.json());

const postData = (
  resource,
  data = {},
  method = '',
  params = {},
  version = RELAY.VERSION,
  host = RELAY.HOST
) => new Relay(resource, version, host).post(data, method, params);

const postFormData = (
  resource,
  data = {},
  method = '',
  params = {},
  version = RELAY.VERSION,
  host = RELAY.HOST
) => new Relay(resource, version, host).postForm(data, method, params);

const patchData = (
  resource,
  data = {},
  method = '',
  params = {},
  version = RELAY.VERSION,
  host = RELAY.HOST
) => new Relay(resource, version, host).patch(data, method, params);

const patchFormData = (
  resource,
  data = {},
  method = '',
  params = {},
  version = RELAY.VERSION,
  host = RELAY.HOST
) => new Relay(resource, version, host).patchForm(data, method, params);

const deleteData = (
  resource,
  data = {},
  method = '',
  params = {},
  version = RELAY.VERSION,
  host = RELAY.HOST
) => new Relay(resource, version, host).deleter(method, params, data);

const analytics = (type = '', idUser = 0, idAccount = 0, call = () => null) => {
  if (!flag('TRACKING')) {
    return call();
  }
  const analyticsData = {
    ...(Boolean(type) && { type }),
    ...(Boolean(idUser) && { user_id: idUser }),
    ...(Boolean(idAccount) && { user_account_id: idAccount }),
  };
  return postData(`analytics`, analyticsData, 'tracking').then(call);
};

export {
  fetchData,
  postData,
  postFormData,
  patchData,
  patchFormData,
  deleteData,
  analytics,
};
