import { getConfig } from '../../../global/services/clink';

const defaultConfig = getConfig({
  submitUrl: '',
  method: 'DELETE',
});

export default defaultConfig;
