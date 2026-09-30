import admin from './admin';
import adminProsper from './adminProsper';
import prosper from './prosper';
import clink from './clink';

const config = {
  admin,
  adminProsper: {
    ...admin,
    ...adminProsper,
    pages: {
      ...admin.pages,
      ...adminProsper.pages,
    },
  },
  prosper,
  clink,
};

export default config;
