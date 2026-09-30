import ProjectService from '../../../global/services/project';
import defaultConfig from './config';

class AddTenderTemplate extends ProjectService {
  constructor(config = defaultConfig) {
    super(config);
  }
}

export default AddTenderTemplate;
