import * as Yup from 'yup';
import moment from 'moment';
import { companyExistsAsync, emailExistsAsync } from './async';
import intersectionByPackage from '../../../helpers/intersection-by-package';

const MIN_LENGHT = 1;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // TODO: 4Mb as max size allowed for testing. Replace for real value
const SUPPORTED_FORMATS = [
  // TODO: Just JPG images allowed for testing. Replace for real value
  'image/jpg',
  'image/jpeg',
  // "image/gif",
  // "image/png"
];

const valRequired = (yup) => yup.required('This field is required');

const htmlText = valRequired(Yup.string()).test({
  message: 'Too Short!',
  test: (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length >= MIN_LENGHT;
  },
});
const basicText = valRequired(Yup.string())
  .trim()
  .min(MIN_LENGHT, 'Too Short!');
const basicDate = valRequired(Yup.date());
const dateExpired = basicDate.test({
  message: 'Date expired',
  test: (v) => {
    const today = moment();
    const date = moment(v);
    const diff = date.diff(today, 'days');
    return !(diff < 0);
  },
});

const required = valRequired(Yup.string());

const file = Yup.mixed()
  .test('fileSize', 'File too large', (value) => {
    let valid = true;
    if (value && value.files.length) {
      Array.prototype.forEach.call(value.files, (f) => {
        if (f.size > MAX_FILE_SIZE) {
          valid = false;
        }
      });
    }

    return valid;
  })
  .test(
    'fileFormat',
    `Unsupported Format (Allowed: ${SUPPORTED_FORMATS.join(', ')})`,
    (value) => {
      let valid = true;
      if (value && value.files.length) {
        Array.prototype.forEach.call(value.files, (f) => {
          if (!SUPPORTED_FORMATS.includes(f.type)) {
            valid = false;
          }
        });
      }
      return valid;
    }
  );
const requiredFile = valRequired(file);
const email = valRequired(Yup.string()).email('Invalid email');

const requiredNumber = valRequired(Yup.number())
  .typeError('Please specify a number')
  .min(1, 'The minimum is 1');

const money = valRequired(Yup.string()).test({
  message: 'Invalid Money Format',
  test: (v) => {
    let valid = false;
    if (v) {
      const test = v
        .replace(/[0-9.£]+/g, '')
        .replace(/[0-9.$]+/g, '')
        .replace(/[0-9.€]+/g, '');
      valid = test.length === 0;
      const decimal = v.indexOf('.');
      if (decimal !== -1) {
        if (decimal === 1 || v.length - decimal > 3) {
          valid = false;
        }
      }
    }
    return valid;
  },
});

const moneyNoZero = money.test({
  message: 'Zero is not valid',
  test: (v) => {
    const test = v
      .replace(/[£]+/g, '')
      .replace(/[$]+/g, '')
      .replace(/[€]+/g, '');
    return Number(test) !== 0;
  },
});

const select = Yup.object().shape({
  label: valRequired(Yup.string()),
});
const arrayRequired = Yup.array().ensure().min(1, 'Pick at least 1');
const tenderBuilderCheckboxes = (groups, customTenders) =>
  arrayRequired.test('required', 'Pick at least 1', (value) => {
    let valid = true;
    const arrayGroups = Object.values(groups);
    const arrayCustom = Object.values(customTenders);
    const arraySelected = Object.values(value);

    if (arrayGroups.length && arrayCustom.length) {
      // from the custom tenders, we get the tenders we selected,
      // by matching package ids
      const intersectionByPack = intersectionByPackage(
        arrayCustom,
        arrayGroups
      );

      valid = !(intersectionByPack.length === arraySelected.length);
    }
    return valid;
  });
const multiDropzoneRequired = Yup.object().test(
  'required',
  'Pick at least 1',
  (value) => {
    let valid = true;
    const arrayValues = Object.values(value);
    // Check if not empty
    arrayValues.forEach((files) => {
      valid = valid && files.length;
    });
    if (valid) {
      // Check if one of the dropzones only have error files
      arrayValues.forEach((files) => {
        const findFileValid = files.some((f) => !f.error);
        valid = valid && findFileValid;
      });
    }
    return valid;
  }
);

// async validation

const companyExists = companyExistsAsync(basicText);
const emailExists = emailExistsAsync(email);

export default {
  htmlText,
  basicText,
  basicDate,
  dateExpired,
  companyExists,
  required,
  file,
  requiredFile,
  email,
  emailExists,
  select,
  arrayRequired,
  multiDropzoneRequired,
  money,
  moneyNoZero,
  requiredNumber,
  tenderBuilderCheckboxes,
};
