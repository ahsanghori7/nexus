import GlobalService, { getConfig } from '../../clink';
import ADD_DEPENDENCY from '../config/add-dependency';
import { mapping } from './helper';

const defaultConfig = getConfig({
  initialValues: ADD_DEPENDENCY.INITIAL_VALUES,
  formFields: ADD_DEPENDENCY.FORM_FIELDS,
  validationSchema: ADD_DEPENDENCY.VALIDATION_SCHEMA,
  method: 'GET',
  key: 'tender-form',
});

class DependencyForm extends GlobalService {
  constructor(rest, dependency, index, date, useDependencies) {
    super(defaultConfig);
    this.setOptions = this.setOptions.bind(this);

    this.setOptions(rest, dependency, index, date, useDependencies);
  }

  get tid() {
    return this._tid;
  }

  set tid(tid) {
    this._tid = tid;
  }

  setOptions(rest, dependency, index, date, useDependencies) {
    const [dependencies, setDependencies] = useDependencies;
    const [name, dates] = this.formFields;
    const extra = {};
    if (!index) {
      extra.isDisabled = true;
    }
    const extraInitial = {};
    if (!index && date) {
      extraInitial.dependency = mapping[date];
      extraInitial.name = dependency;
    }
    if (index && dependencies[index]) {
      const state = dependencies[index];
      extraInitial.dependency = mapping[state.date];
      if (state.id && state.label && state.name) {
        extraInitial.name = state;
      }
    }
    this.formFields = [
      {
        ...name,
        options: rest.map((opt) => ({
          id: opt.id,
          value: opt.id,
          label: opt.label,
        })),
        ...extra,
        callback: (props) => {
          const { val } = props;
          const auxDep = [...dependencies];
          auxDep[index] = {
            ...auxDep[index],
            key: index,
            label: val.label,
            name: val.label,
            id: val.id || val.value,
          };
          setDependencies(auxDep);
        },
      },
      {
        ...dates,
        ...extra,
        isDisabled: true,
        callback: (props) => {
          const { val } = props;
          const auxDep = [...dependencies];
          auxDep[index] = {
            ...auxDep[index],
            key: index,
            date: val.id || val.value,
          };
          setDependencies(auxDep);
        },
      },
    ];
    this.initialValues = {
      ...this.initialValues,
      ...extraInitial,
    };
  }
}

export default DependencyForm;
