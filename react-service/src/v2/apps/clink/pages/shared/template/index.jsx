import React from 'react';
import Grid from '@mui/material/Grid';
import { connect } from 'react-redux';
import Loading from 'v2/apps/shared/components/Loading';
import Header from '../Header';

const Template = ({
  project,
  header = null,
  children,
  instructions = true,
}) => {
  const { data, status } = project;

  // eslint-disable-next-line react/no-unstable-nested-components
  const Layout = ({ children: lChildren }) =>
    instructions ? (
      <Grid
        container
        flexDirection="column"
        sx={{
          backgroundColor: 'white',
          background: 'white',
          borderRadius: '5px',
          border: '1px solid #e6e6e6',
          padding: '20px',
        }}
      >
        <Grid item> {lChildren}</Grid>
      </Grid>
    ) : (
      lChildren
    );

  return (
    <>
      <Loading status={status} />
      {!status && data && (
        <Grid container flexDirection="column">
          <Grid item mt={2}>
            <Header>{header}</Header>
          </Grid>
          <Grid item>
            <Layout>{children}</Layout>
          </Grid>
        </Grid>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  project: state.project,
});
export default connect(mapStateToProps)(Template);
