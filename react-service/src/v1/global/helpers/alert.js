import { responseAlert } from 'v1/global/components/clink-alert';

const defaultOptionsSuccess = {
  title: 'Success',
  message: 'Action finished successfully!',
  type: 'success',
};

const defaultOptionsError = {
  title: 'Error',
  message: 'Something went wrong',
  type: 'error',
};

function alert(
  response,
  callback,
  optionsSuccess = defaultOptionsSuccess,
  optionsError = defaultOptionsError
) {
  let message = 'Critical Error, no api response';
  if (!response) {
    responseAlert({ ...optionsError, message });
  } else if (response && response.error) {
    message = `Fetch failed: ${response.error}`;
    responseAlert({ ...optionsError, message });
  } else if (response.success) {
    responseAlert(optionsSuccess);
    if (callback) {
      callback();
    }
  } else {
    responseAlert(optionsError);
  }
}

export default alert;
