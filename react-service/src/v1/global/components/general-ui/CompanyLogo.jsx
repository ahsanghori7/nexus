import { Image } from 'react-bootstrap';
import getAccountLogo from '../../helpers/user';

const CompanyLogo = (id, name) => {
  const logo = getAccountLogo(id);
  return <Image src={logo} alt={name} />;
};

export default CompanyLogo;
