import { getRelayUrl } from 'v2/helpers/url';
import GlobalService from '../../../global/services/clink';
import defaultConfig from './config';

class SelectTemplate extends GlobalService {
  constructor(type = 'tenders', config = defaultConfig) {
    super(config);
    this.fetchAll = this.fetchAll.bind(this);
    this.updateOptions = this.updateOptions.bind(this);
    this._type = type;
  }

  get type() {
    return this._type;
  }

  set type(type) {
    this._type = type;
  }

  fetchAll() {
    this.method = 'GET';
    this.submitUrl = getRelayUrl('template', 'fetchAll', { type: this.type });
    return this.asyncCall();
  }

  updateOptions(options = []) {
    const [templates] = this.formFields;
    const newTemplates = {
      ...templates,
      options: options.map((opt) => ({
        id: opt.id,
        value: opt.id,
        label: opt.name,
      })),
    };
    this.formFields = [newTemplates];
    return true;
  }

  submit(value, actions, callback = () => null) {
    actions.setSubmitting(false);
    const { template } = value;
    callback(template);
  }
}

export default SelectTemplate;
