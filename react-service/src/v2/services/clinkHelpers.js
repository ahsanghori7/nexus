import {
  fetchData as fetch,
  postData as post,
  postFormData as postForm,
  patchData as patch,
  deleteData as deleter,
} from 'v2/services/helpers';

const CLINK_RESOURCE = 'relay';

const fetchData = (action, method, params = {}) =>
  fetch(CLINK_RESOURCE, { action, method, ...params }, '', '', '');

const postData = (action, method, data, params = {}) =>
  post(CLINK_RESOURCE, data, '', { action, method, ...params }, '', '', '');

const postFormData = (action, method, data, params = {}) =>
  postForm(CLINK_RESOURCE, data, '', { action, method, ...params }, '', '', '');

const patchData = (action, method, data, params = {}) =>
  patch(CLINK_RESOURCE, data, '', { action, method, ...params }, '', '', '');

const deleteData = (action, method, params) =>
  deleter(CLINK_RESOURCE, {}, '', { action, method, ...params }, '', '', '');

export { fetchData, postData, postFormData, patchData, deleteData };
