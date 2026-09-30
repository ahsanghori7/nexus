import ProjectService from 'v1/global/services/project';
import defaultConfig from './config';

class AwardPackageService extends ProjectService {
  constructor(config = defaultConfig) {
    super(config);
  }
}

export default AwardPackageService;
