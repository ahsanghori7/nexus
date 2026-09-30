import ReactHtmlParser from 'react-html-parser';
import DOMPurify from 'dompurify';
import isString from 'lodash/isString';

export const renderHtmlInText = (text) =>
  /^/.test(text) ? ReactHtmlParser(text) : text;

export const renderTextWithoutHtml = (html) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = DOMPurify.sanitize(html);
  return tmp.textContent || tmp.innerText || '';
};

export function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str));
}

export function UnicodeDecodeB64(str) {
  return decodeURIComponent(atob(str));
}

export function getAddress(address) {
  if (address && isString(address)) {
    return address;
  }
  return (
    (address &&
      `${address.premises || ''} ${address.address_line_1 || ''}, ${
        address.locality || ''
      }, ${address.postal_code || ''}`) ||
    ''
  );
}

export function exportAttribute(dataForm, attributeName, defaultValue = null) {
  if (!dataForm || typeof dataForm !== 'object') {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(dataForm, attributeName)
    ? dataForm[attributeName]
    : defaultValue;
}
