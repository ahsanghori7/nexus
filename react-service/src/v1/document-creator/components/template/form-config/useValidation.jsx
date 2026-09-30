import * as Yup from 'yup';
import { ValidationSchemes } from 'v1/global/services/clink';

function useValidation(fields = []) {
  const valObj = {};
  fields.forEach((field) => {
    if (field?.name && field?.type === 'money') {
      valObj[field.name] = ValidationSchemes.money;
    }
  });

  return Yup.object().shape(valObj);
}

export default useValidation;
