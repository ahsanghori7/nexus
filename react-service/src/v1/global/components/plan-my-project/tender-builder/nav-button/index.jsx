import React, { useState, useCallback, useEffect } from 'react';
import MuiButton from '@mui/material/Button';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import GreenButton from '../../../general-ui/Buttons';
import { goTo } from 'v2/helpers/url';

const { ghostWhite } = CONSTANTS.colors.general;

const CREATE_PACKAGES_HASH = '#create-packages';

const NavButton = ({ handleClick, handleBack, slug }) => {

  const [page, setPage] = useState(
    window.location.hash === CREATE_PACKAGES_HASH ? 1 : 0
  );

  const updateHash = (newPage) => {
    const baseUrl = `${window.location.pathname}${window.location.search}`;

    window.history.replaceState(
      null,
      '',
      newPage === 1 ? `${baseUrl}${CREATE_PACKAGES_HASH}` : baseUrl
    );
  };

  useEffect(() => {
    const initialPage =
      window.location.hash === CREATE_PACKAGES_HASH ? 1 : 0;

    setPage(initialPage);
    handleClick(initialPage);
  }, [handleClick]);

  const back = useCallback(
    () => goTo(`/projects/${slug}/setup/reference_files`),
    [slug]
  );

  const handleSetPage = () => {
    const newPage = page ? 0 : 1;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setPage(newPage);
    handleClick(newPage);
    updateHash(newPage);
  };

  return (
    <Grid
      sx={{ backgroundColor: ghostWhite, padding: '0 8px 20px' }}
      id="nav-button-main"
      container
      justifyContent="space-between"
    >
      {page ? (
        <Grid item>
          <Button
            style={{ borderRadius: '40px' }}
            variant="outline-info"
            onClick={handleSetPage}
          >
            Previous Step
          </Button>
        </Grid>
      ) : (
        <>
          {!handleBack && (
            <Grid item>
              <MuiButton
                sx={{ mr: 2 }}
                onClick={back}
                variant="contained"
                color="border"
                size="large"
              >
                {i18next.t('go-back')}
              </MuiButton>
            </Grid>
          )}

          {handleBack && (
            <Grid item>
              <Button
                style={{ borderRadius: '40px' }}
                variant="outline-info"
                onClick={handleBack}
              >
                Previous Step
              </Button>
            </Grid>
          )}

          <Grid item>
            <GreenButton
              style={{ borderRadius: '40px' }}
              handleClick={handleSetPage}
              label="Next Step - Create Packages"
              plusIcon={false}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

const mapStateToProps = (state) => ({
  slug: state?.project?.data?.slug || 'undefined',
});

export default connect(mapStateToProps)(NavButton);
