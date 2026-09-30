import { getRelayUrl } from 'v2/helpers/url';

const downloadPrequal = (id) => {
  const link = document.createElement('a');
  link.href = getRelayUrl('account', 'downloadPrequalification', { id });
  link.dispatchEvent(new MouseEvent('click'));
};

export default downloadPrequal;
