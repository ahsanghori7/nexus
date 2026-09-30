import { HELPERS } from 'clink-components';

const { PasswordValidation } = HELPERS;

function validation(e, name) {
  const { value } = e.target;
  if (!value) {
    return `${name} is required`;
  }
  return false;
}

const handleChange = (
  e,
  setError,
  label,
  setPasswordErrors = null,
  setPassword = null
) => {
  let error = validation(e, label);
  if (setPasswordErrors && setPassword) {
    const errors = PasswordValidation.testPassword(e.target.value);
    setPasswordErrors(errors);
    if (errors && !errors.length) {
      setPassword(e.target.value);
    }
    if (errors.length) {
      error = 'The password is not in the proper format';
    }
  }
  setError(error);
};

export { handleChange };
