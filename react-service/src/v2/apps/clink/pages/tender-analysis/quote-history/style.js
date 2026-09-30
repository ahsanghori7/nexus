import { CONSTANTS } from 'clink-components';

const { black } = CONSTANTS.colors.general;
const { boqScratch } = CONSTANTS.s3;

const doubleItemProps = {
  xs: 12,
  sm: 8,
};
const subItemProps = {
  xs: 12,
  sm: 6,
};
const titleProps = {
  fontSize: '14px',
  color: black,
  fontWeight: 'bold',
  textAlign: 'center',
};
const titleSx = { fontSize: '15px', pb: 0.5, ...titleProps };
const buttonBaseSx = {
  display: 'block',
  '&::after': {
    content: '""',
    display: 'block',
    width: '100%',
    height: '150px',
    marginRight: 1,
    backgroundImage: `url('${boqScratch}')`,
    backgroundSize: 'cover',
  },
};

export { doubleItemProps, subItemProps, titleProps, titleSx, buttonBaseSx };
