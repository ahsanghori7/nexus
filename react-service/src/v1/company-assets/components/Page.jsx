import React, { useEffect } from 'react';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import 'v1/global';
import 'v1/company-assets/public/styles/index.scss';
import IconFOlder from 'v1/global/public/images/svg/icon-folder.svg';
import Wrapper from 'v2/apps/shared/components/wrapper-v2';
import Table from './Table';

const Folder = ({ label, link }) => (
  <Link className="folder" to={link} style={{ textDecoration: 'none' }}>
    <div className="folder-icon">
      <IconFOlder />
    </div>
    <div className="folder-label">{label}</div>
  </Link>
);

const FolderList = () => {
  const folders = COMPANY_ASSETS;

  const getFolderLink = (folder, prefix) => {
    const slug = folder.label.replaceAll(' ', '-').toLowerCase();
    return `${prefix}${slug}`;
  };

  return (
    <div className="folder-wrapper">
      {folders.map((folder) => (
        <Folder
          key={folder.label}
          label={folder.label}
          link={getFolderLink(folder, `${BASE_URLS.COMPANY_ASSETS}/`)}
        />
      ))}
    </div>
  );
};

const leftContent = (
  <Table title="Documents">
    <FolderList />
  </Table>
);

const CompanyAssets = ({ dispatch }) => {
  const context = useContext('clink');
  const { actions } = context;
  useEffect(() => {
    dispatch(actions.resetProject());
    dispatch(actions.resetQuotesTender());
    dispatch(actions.restartOrders());
    dispatch(actions.restartProcurement());
    dispatch(actions.setBreadcrumbs([]));
    dispatch(actions.setProjectName(false));
    dispatch(actions.setSlug(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Wrapper
      helpText="This is where you are able to view and edit document templates."
      leftContent={leftContent}
      severity="info"
    />
  );
};

export default connect()(CompanyAssets);
