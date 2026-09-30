import flag from 'v2/helpers/flags';
import Relay from 'v1/global/services/Relay';

const analyticsRelay = new Relay('analytics', 'track');
const postData = (data) => analyticsRelay.post(data);

const analytics = (type = '', idAccount = 0, call = () => {}) => {
  if (!flag('TRACKING')) {
    return call();
  }
  const analyticsData = {
    ...(Boolean(type) && { type }),
    ...(Boolean(idAccount) && { account_id: idAccount }),
  };
  return postData(analyticsData).then(call);
};

export { postData, analytics };
