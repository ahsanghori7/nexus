import md5 from 'md5';

const getUrl = (id) => {
  const idHash = md5(String(id));
  return {
    account: `account/logo/${idHash}/logo.png`,
    profile: `project/logo/${idHash}/profile.png`,
    company: `account/logo/${idHash}/company.png`,
  };
};

const getBase = (prodMode = false, logoBase = BASE_URLS.S3_URL) => {
  if (!logoBase.endsWith('/')) {
    logoBase = `${logoBase}/`;
  }
  const env = prodMode ? 'production' : ENV;
  return `${logoBase}${env}/`;
};

const getAccountLogo = (id, prodMode = false, logoBase = BASE_URLS.S3_URL) => {
  const urls = getUrl(id);
  const source = urls.account;
  const currentDate = new Date();
  return `${getBase(
    prodMode,
    logoBase,
  )}${source}?current=${currentDate.getTime()}`;
};

const getProfileLogo = (id, prodMode = false, logoBase = BASE_URLS.S3_URL) => {
  const urls = getUrl(id);
  const source = urls.profile;
  const currentDate = new Date();
  return `${getBase(
    prodMode,
    logoBase,
  )}${source}?current=${currentDate.getTime()}`;
};

const getCompanyLogo = (id, prodMode = false, logoBase = BASE_URLS.S3_URL) => {
  const urls = getUrl(id);
  const source = urls.company;
  const currentDate = new Date();
  return `${getBase(
    prodMode,
    logoBase,
  )}${source}?current=${currentDate.getTime()}`;
};

const getMemberLogo = (id, memberId) => {
  const hashId = md5(String(id));
  const hashMemberId = md5(String(memberId));
  const currentDate = new Date();
  return `${getBase(
    ENV === 'production',
  )}account/logo/${hashId}/organisation/${hashMemberId}/logo.png?current=${currentDate.getTime()}`;
};
const getGroupLogo = (
  source,
  prodMode = false,
  logoBase = BASE_URLS.S3_URL,
) => {
  const currentDate = new Date();
  return `${getBase(
    prodMode,
    logoBase,
  )}${source}?current=${currentDate.getTime()}`;
};

export {
  getAccountLogo,
  getProfileLogo,
  getCompanyLogo,
  getMemberLogo,
  getGroupLogo,
};
