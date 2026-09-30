import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'clink-components';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';

const AdminLayout = ({
  routerConfig,
  admin,
  dispatch,
  contextType = 'admin',
}) => {
  const context = useContext(contextType);
  const { actions, headerLogo, headerContent } = context;

  useEffect(() => {
    dispatch(actions.fetchAdminInfo());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const layoutProps = {
    routerConfig,
    headerLogo,
    headerContent,
    profileData: admin,
  };
  return (
    <Layout layoutProps={layoutProps}>
      <Outlet />
    </Layout>
  );
};

const mapStateToProps = (state) => ({
  admin: state.admin,
});

export default connect(mapStateToProps)(AdminLayout);
