import GlobalService, { getConfig } from '../../clink';
import TENDER_BUILDER_PUBLISH from '../config/tender-builder/Publish';

const defaultConfig = getConfig({
  initialValues: TENDER_BUILDER_PUBLISH.INITIAL_VALUES,
  formFields: TENDER_BUILDER_PUBLISH.FORM_FIELDS,
  validationSchema: TENDER_BUILDER_PUBLISH.VALIDATION_SCHEMA,
  method: 'POST',
  key: 'publish-form',
});

class Publish extends GlobalService {
  constructor(pid = 0, config = defaultConfig) {
    super(config);
    this._pid = pid;
  }

  get pid() {
    return this._pid;
  }

  set pid(pid) {
    this._pid = pid;
  }

  async submit(data, actions, options) {
    this.submitUrl = `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=publish&pid=${this.pid}`;
    return super.submit(data, actions, options);
  }
}

export default Publish;
