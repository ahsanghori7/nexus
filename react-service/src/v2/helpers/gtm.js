import TagManager from 'react-gtm-module';
import flag from 'v2/helpers/flags';

const gtmId = flag('GMT_ID') || 'GTM-5XMQBXQK';
const defaultDataLayer = {
  userId: '001',
  userProject: 'project',
};

const tagManagerArgs = (dataLayer = defaultDataLayer) => {
  const conf = {
    gtmId,
    dataLayer,
  };
  TagManager.initialize(conf);
};

export default tagManagerArgs;
