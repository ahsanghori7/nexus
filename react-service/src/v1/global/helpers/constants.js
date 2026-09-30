const ETYPE_PROJECT = 'project';
const ETYPE_TENDER = 'tender';
const INFO_CLINK_EMAIL = 'info@c-link.com';
const TA_LABEL = 'Tender Addendum';
const TA_SLUG = 'tender_addendum';
const DOMESTIC_SHORT_ORDER_SLUG = 'domestic_short_order_minor_works';
const isTenderAddendumSlug = (slug) =>
  typeof slug === 'string' && slug.includes(TA_SLUG);
const TYPE_STRUCTURAL = { id: 1, name: 'structural' };
const TYPE_CONTRACTUAL = { id: 2, name: 'contractual' }; // TODO: Check contractual id

const DIFF_TYPE_DAY = 'day';
const DIFF_TYPE_WEEK = 'week';
const DIFF_TYPE_MONTH = 'month';

const DATE_FORMAT = 'dd/MM/yyyy';
const DATE_FORMAT_PLACEHOLDER = 'DD / MM / YYYY';

export {
  ETYPE_PROJECT,
  ETYPE_TENDER,
  INFO_CLINK_EMAIL,
  TA_LABEL,
  TA_SLUG,
  DOMESTIC_SHORT_ORDER_SLUG,
  isTenderAddendumSlug,
  TYPE_STRUCTURAL,
  TYPE_CONTRACTUAL,
};
export { DIFF_TYPE_DAY, DIFF_TYPE_WEEK, DIFF_TYPE_MONTH };
export { DATE_FORMAT, DATE_FORMAT_PLACEHOLDER };
