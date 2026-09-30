import { goToNewTab } from 'v2/helpers/url';

const enquiriesActions = [
  {
    id: 1,
    align: 'right',
    text: 'Download tender documents',
    handleAction: (document) => goToNewTab(document),
  },
  { id: 2, text: 'Send a quotation', handleAction: () => null },
];
export default enquiriesActions;
