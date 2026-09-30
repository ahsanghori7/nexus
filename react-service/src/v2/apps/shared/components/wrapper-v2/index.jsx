import React from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Loading from 'v1/global/components/Loading';
import Grid2 from '@mui/material/Grid2';
import { HelpBox } from 'v1/global/components/InfoBoxes';
import { CONSTANTS } from 'clink-components';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const DefaultHead = () => (
  <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.25}>
    <HelpBox />
  </Grid2>
);

const Wrapper = ({
  header,
  leftContent,
  centerContent,
  rightContent,
  error,
  errorMessage = 'An error occurred while fetching the form data.',
  loading,
  helpText,
  severity,
  maxHeightRightContent = { xs: '200px', md: 'initial' },
  component = Paper,
  headerComponent = <DefaultHead />,
}) => {
  let leftSize = { xs: 12, md: 8 };
  let rightSize = { xs: 12, md: 4 };
  let centerSize = {};
  if (centerContent) {
    leftSize = { xs: 12, sm: 6, lg: 7 };
    centerSize = { xs: 12, sm: 6, lg: 3 };
    rightSize = { xs: 12, lg: 2 };
  }
  return (
    <>
      {' '}
      {error && (
        <Alert data-testid="alert-error" severity="error">
          {errorMessage}
        </Alert>
      )}
      {loading && <Loading />}
      {!loading && (
        <Grid2 container spacing={4} flexDirection="column">
          <Grid2>{header}</Grid2>
          <Grid2 container>
            <Grid2 size={leftSize} component={component}>
              {leftContent}
            </Grid2>
            {centerContent && (
              <Grid2 size={centerSize} component={component}>
                {centerContent}
              </Grid2>
            )}
            {rightContent && (
              <Grid2
                size={rightSize}
                component={component}
                container
                flexDirection="column"
                sx={{ maxHeight: maxHeightRightContent }}
              >
                {headerComponent}
                <Grid2 p={1.75}>
                  {helpText && (
                    <Alert
                      data-testid="alert-warning"
                      severity={severity || 'warning'}
                    >
                      {helpText}
                    </Alert>
                  )}
                  {rightContent}
                </Grid2>
              </Grid2>
            )}
          </Grid2>
        </Grid2>
      )}
    </>
  );
};

Wrapper.propTypes = {
  header: PropTypes.node,
  leftContent: PropTypes.node,
  centerContent: PropTypes.node,
  rightContent: PropTypes.node,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  loading: PropTypes.bool,
  helpText: PropTypes.string,
  severity: PropTypes.string,
};

Wrapper.defaultProps = {
  error: false,
  loading: false,
  severity: 'warning',
};

export default Wrapper;
