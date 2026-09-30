import ProjectService from '../../../global/services/project';
import defaultConfig from './config';

class DeleteQuoteService extends ProjectService {
  constructor(config = defaultConfig) {
    super(config);
  }
}

export default DeleteQuoteService;
