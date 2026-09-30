import ProjectService from '../../../global/services/project';

import defaultConfig from './Assets';

class Project extends ProjectService {
  constructor() {
    super(defaultConfig);
    this.updateProjectHistory = this.updateProjectHistory.bind(this);
  }

  setOptions(values) {
    const { formFields } = this;
    formFields[0].options = values.map((value) => ({
      id: value.id,
      value: value.id,
      label: value.company_name,
      name: value.company_name,
    }));
    this.formFields = formFields;
  }

  async updateProjectHistory(
    data = {},
    callback = () => null,
    showAlert = true,
    callMethod = 'GET',
    body = {},
    optionsSuccess = {}
  ) {
    const params = {
      ...data,
      method: 'updateProjectHistory',
    };
    this.method = callMethod;
    return this.projectAction(
      params,
      showAlert,
      callback,
      body,
      optionsSuccess
    );
  }

  bulkUpdateProjectHistory(
    params = {},
    data = [],
    callback = () => null,
    tid = 0,
    actions = null,
    optionsSuccess = {},
    disableAlert = false
  ) {
    const { type } = params;
    const body = {};
    if (type === 'Interest') {
      for (const element of data) {
        const { id, cid } = element;
        if (body[id]) {
          body[id] = [...body[id], Number(cid)];
        } else {
          body[id] = [Number(cid)];
        }
      }
    } else {
      const { supplyChain } = data;
      body[tid] = [];
      for (const element of supplyChain) {
        const { value } = element;
        body[tid] = [...body[tid], Number(value)];
      }
    }
    const fetchParams = {
      ...params,
      method: 'bulkUpdateProjectHistory',
      type,
    };
    this.method = 'POST';
    if (actions !== null) {
      actions.setSubmitting(false);
    }
    const showAlert = !disableAlert;
    return this.projectAction(
      fetchParams,
      showAlert,
      callback,
      body,
      optionsSuccess
    );
  }
}

export default Project;
