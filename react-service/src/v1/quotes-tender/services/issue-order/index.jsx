import ProjectService from 'v1/global/services/project';
import defaultConfig from './config';

class IssueOrderService extends ProjectService {
  constructor(initialValues = {}, config = defaultConfig) {
    super(config);

    const { templates, callback } = initialValues;
    const options = Object.keys(templates).map((key) => {
      const { name, id } = templates[key];
      return {
        id,
        value: id,
        label: name,
      };
    });
    const [newFormField] = [...this.formFields];
    newFormField.options = options;
    newFormField.callback = callback;
    this.formFields = [newFormField];
  }
}

export default IssueOrderService;
