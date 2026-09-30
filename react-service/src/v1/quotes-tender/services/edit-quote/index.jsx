import i18next from 'v2/helpers/i18n';
import ProjectService from '../../../global/services/project';
import defaultConfig from './config';

class EditQuoteService extends ProjectService {
  constructor(config = defaultConfig(i18next.t('currency'))) {
    super(config);
  }
}

export default EditQuoteService;
