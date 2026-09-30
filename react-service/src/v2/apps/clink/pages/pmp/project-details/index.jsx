import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Wrapper from 'v2/apps/shared/components/wrapper-v2';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import SiteDetails, {
  Search,
  OpeningHours,
  SiteConstraints,
} from './site-constraints';
import ClientInformation from './client-information';
import MembersSection from './member-selection';
import InsuranceRequirements from './InsuranceRequirements';
import Others from './Others';
import MainContractStructure from './main-contract-structure';
import KeyDates from './key-dates-periods';
import NoticesAddresses from './notices-addresses';
import PaymentTerms from './payment-terms';
import LegalDisputeTerms from './legal-dispute-terms';
import DesignWarranties from './design-warranties';
import CommercialTerms from './commercial-terms';
import useUpdateProject from './hooks';
import UnsavedChangesModal from './UnsavedChangesModal';
import { useBlockNavigation } from './helpers';

const ProjectDetails = ({ project, constants, clinkAccount, dispatch }) => {
  const isUk = clinkAccount?.country?.code === 'UK';
  const [search, setSearch] = useState(isUk);
  const handleSearch = (value) => {
    if (isUk) {
      setSearch(value);
    }
  };
  const navigate = useNavigate();
  const useUpdate = useUpdateProject(dispatch, project?.data);
  const { siteDetailsRef, clientDetailsRef, insuranceRequirementsRef } =
    useUpdate;
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const retryNavigationRef = useRef(null);
  const ignoreBlockRef = useRef(false);
  const context = useContext('clink');
  const { actions } = context;

  const goBack = useCallback(() => {
    if (useUpdate?.isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    navigate(
      `/main-contractor/projects/${project?.data?.slug || undefined}/setup/project_team`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.data?.slug, useUpdate?.isDirty, navigate]);

  useEffect(() => {
    if (!constants?.project?.type) {
      dispatch(actions.fetchConstants());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constants?.project?.type]);

  // Block ANY navigation away; show modal if dirty
  useBlockNavigation((tx) => {
    // if we're explicitly leaving, let this one pass through
    if (ignoreBlockRef.current) {
      ignoreBlockRef.current = false;
      tx.retry();
      return;
    }
    if (useUpdate?.isDirty) {
      retryNavigationRef.current = tx.retry;
      setShowUnsavedModal(true);
    } else {
      tx.retry();
    }
  }, !!useUpdate?.isDirty);

  return (
    <>
      <UnsavedChangesModal
        open={showUnsavedModal}
        onLeave={() => {
          const go = retryNavigationRef.current
            || (() => navigate(`/main-contractor/projects/${project?.data?.slug || undefined}/setup/project_team`));
          retryNavigationRef.current = null;
          ignoreBlockRef.current = true;
          setShowUnsavedModal(false);
          go();
        }}
        onSave={async () => {
          await useUpdate?.handleUpdateProject?.();
          setShowUnsavedModal(false);
          retryNavigationRef.current = null;
        }}
      />
      <div ref={siteDetailsRef} data-section="site-details">
        <Wrapper
          rightContent={i18next.t('helper-site-details')}
          loading={!project?.data}
          leftContent={
            <>
              {search ? (
                <Search useUpdateProject={useUpdate} />
              ) : (
                <SiteDetails useUpdateProject={useUpdate} />
              )}
              {isUk && (
                <Button
                  data-testid="project-details-site-search-toggle-button"
                  variant="text"
                  onClick={() => handleSearch(!search)}
                  sx={{ m: 2 }}
                >
                  {search
                    ? i18next.t('enter-address-manually')
                    : i18next.t('search-spostcode')}
                </Button>
              )}
              <OpeningHours useUpdateProject={useUpdate} />
              <SiteConstraints useUpdateProject={useUpdate} />
            </>
          }
        />
      </div>
      {project?.data && (
        <>
          <div ref={clientDetailsRef} data-section="client-details">
            <Wrapper
              rightContent={i18next.t('helper-client-info')}
              leftContent={
                <ClientInformation useUpdate={useUpdate} isUk={isUk} />
              }
            />
          </div>
          <div data-section="main-contract-structure">
            <Wrapper
              leftContent={
                <MainContractStructure useUpdateProject={useUpdate} />
              }
              rightContent={i18next.t('helper-main-contract')}
            />
          </div>
          <div
            ref={insuranceRequirementsRef}
            data-section="insurance-requirements"
          >
            <Wrapper
              rightContent={i18next.t('helper-insurance-req')}
              leftContent={
                <InsuranceRequirements
                  useUpdateProject={useUpdate}
                  constants={constants}
                />
              }
            />
          </div>
          <div data-section="notices-addresses">
            <Wrapper
              rightContent={i18next.t('helper-addresses-notices')}
              leftContent={<NoticesAddresses useUpdateProject={useUpdate} />}
            />
          </div>
          <div data-section="key-dates">
            <Wrapper
              rightContent={i18next.t('helper-key-dates')}
              leftContent={<KeyDates useUpdateProject={useUpdate} />}
            />
          </div>
          <div data-section="payment-terms">
            <Wrapper
              rightContent={i18next.t('helper-payment-terms')}
              leftContent={<PaymentTerms useUpdateProject={useUpdate} />}
            />
          </div>
          <div data-section="legal-dispute-terms">
            <Wrapper
              rightContent={i18next.t('helper-legal-dispute')}
              leftContent={<LegalDisputeTerms useUpdateProject={useUpdate} />}
            />
          </div>
          <div data-section="design-warranties">
            <Wrapper
              rightContent={i18next.t('helper-design-warranties')}
              leftContent={<DesignWarranties useUpdateProject={useUpdate} />}
            />
          </div>
          <div data-section="commercial-terms">
            <Wrapper
              rightContent={i18next.t('helper-commercial-terms')}
              leftContent={<CommercialTerms useUpdateProject={useUpdate} />}
            />
          </div>
          <div data-section="others">
            <Wrapper
              rightContent={i18next.t('helper-others')}
              leftContent={<Others useUpdateProject={useUpdate} />}
            />
          </div>
          <div data-section="members">
            <Wrapper
              rightContent={i18next.t('helper-your-project-team-details')}
              leftContent={<MembersSection />}
            />
          </div>
          <Grid container justifyContent="space-between" spacing={2} pt={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                data-testid="project-details-go-back-button"
                onClick={goBack}
                variant="contained"
                color="border"
                size="large"
              >
                {i18next.t('go-back')}
              </Button>
            </Grid>
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{ textAlign: { xs: 'left', md: 'right' } }}
            >
              <Button
                data-testid="project-details-save-button"
                onClick={async () => {
                  ignoreBlockRef.current = true;
                  await useUpdate.handleUpdateProject();
                }}
                variant="contained"
                color="primary"
                size="large"
              >
                {i18next.t('save')}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} />
          </Grid>
        </>
      )}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    project: state.project,
    constants: state.constants,
    clinkAccount: state.clinkAccount,
  };
};

export default connect(mapStateToProps)(ProjectDetails);
