import GlobalService, { getConfig } from '../clink';

const defaultConfig = getConfig({
  method: 'GET',
  key: 'GetAddress',
});

class GetAddress extends GlobalService {
  constructor(config = defaultConfig) {
    super(config);
  }

  async asyncCall(postcode) {
    this.submitUrl = `${GET_ADDRESS.HOST}${postcode}?api-key=${GET_ADDRESS.API_KEY}&expand=true`;
    return super.asyncCall();
  }
}

export default GetAddress;
