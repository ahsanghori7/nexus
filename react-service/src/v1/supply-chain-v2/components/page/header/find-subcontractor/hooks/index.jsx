import hooksUK from './hooksUK';
import hooksNZ from './hooksNZ';

const SwitchHooks = (accountData) => {
  const { code = '' } = accountData?.country || {};
  switch (code) {
    case 'NZ':
    case 'AUS': {
      return hooksNZ(accountData);
    }
    default:
      return hooksUK(accountData);
  }
};

export default SwitchHooks;
