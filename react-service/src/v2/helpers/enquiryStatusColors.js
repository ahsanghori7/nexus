import { CONSTANTS } from 'clink-components';

const { japaneseIndigo, blueMagentaViolet } = CONSTANTS.colors.general;
const { prosperBlackStatus, prosperBoxRed, prosperBoxRedStatus, iguanaGreen } =
  CONSTANTS.colors.prosper;

const getStatusColor = (id, badge = true) => {
  switch (Number(id)) {
    case 1:
    case 5:
    case 6:
      return badge ? 'danger' : `${prosperBoxRedStatus}`;
    case 4:
      return badge ? 'pink' : `${prosperBoxRed}`;
    case 2:
      return badge ? 'black' : `${japaneseIndigo}`;
    case 3:
      return badge ? 'prosper-black' : `${prosperBlackStatus}`;
    case 9:
      return badge ? 'prosper-purple' : `${blueMagentaViolet}`;
    case 7:
      return badge ? 'prosper-green' : `${iguanaGreen}`;
    default:
      return '';
  }
};

export default getStatusColor;
