import { getBaseUrl } from 'v2/helpers/url';

const commonMapping = {
  ncr: 'ncr',
};

const urlEditMapping = {
  instruction: 'instructions-variations',
  ...commonMapping,
};

const urlPreviewMapping = {
  'instructions-variations': 'instruction',
  instruction: 'instruction',
  ...commonMapping,
};

const getEditUrl = (slug, typeUid, id) =>
  `${getBaseUrl('clink')}/project/${slug}/form_instruction?type=${
    urlEditMapping[typeUid]
  }&id=${id}`;

const getPreviewLink = (type, id) =>
  `/document-creator/${urlPreviewMapping[type]}/${id}/preview`;

export { getEditUrl, getPreviewLink };
