import isEmpty from 'lodash/isEmpty';

const DEFAULT_MAX_SIZE_MB = 100;
const DEFAULT_ACCEPTED_IMG = ['image/jpeg', 'image/png'];
const DEFAULT_ACCEPTED_TYPE = [
  ...DEFAULT_ACCEPTED_IMG,
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-word.document.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'application/vnd.ms-excel.template.macroEnabled.12',
  'application/pdf',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  'application/vnd.ms-powerpoint.template.macroEnabled.12',
  'image/vnd.dwg',
  'image/vnd.dxf',
  'application/vnd.ms-outlook',
  'message/rfc822',
];

const sizeFileIsCorrect = (file, maxSize = DEFAULT_MAX_SIZE_MB) =>
  file && file.size && file.size / 1024 / 1024 <= maxSize;

const typeFileIsAccepted = (file, acceptedTypes = DEFAULT_ACCEPTED_TYPE) => {
  let fileType = file && file.type;
  if (
    isEmpty(fileType) &&
    file &&
    file.name !== null &&
    file.name !== undefined &&
    file.name.endsWith('.msg')
  ) {
    fileType = 'application/vnd.ms-outlook';
  }
  if (
    isEmpty(fileType) &&
    file &&
    file.name !== null &&
    file.name !== undefined &&
    file.name.endsWith('.dwg')
  ) {
    fileType = 'image/vnd.dwg';
  }
  if (
    isEmpty(fileType) &&
    file &&
    file.name !== null &&
    file.name !== undefined &&
    file.name.endsWith('.dxf')
  ) {
    fileType = 'image/vnd.dxf';
  }
  return fileType && acceptedTypes.includes(fileType);
};

export {
  sizeFileIsCorrect,
  typeFileIsAccepted,
  DEFAULT_MAX_SIZE_MB,
  DEFAULT_ACCEPTED_TYPE,
  DEFAULT_ACCEPTED_IMG,
};
