import React, { useCallback, useEffect } from 'react';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';
import isEmpty from 'lodash/isEmpty';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Grid from '@mui/material/Grid';
import { connect } from 'react-redux';
import PublishModal from 'v1/global/components/plan-my-project/tender-builder/content-right/publish-modal';
import PanelAccordion from 'v1/global/components/layout/panel/PanelAccordion';
import CustomStickyContainer from 'v1/global/components/CustomStickyContainer';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';
import TableContent from './table';
import NewSupplyChain from './NewSupplyChain';
import AwardedPackageList from './table/AwardedPackageList';
import ShortlistedSubcontractorsTable from './ShortlistedSubcontractorsTable';
import BulkRequestSupplierApproval from './BulkRequestSupplierApproval';
import ClinkService from '../../../../global/services/clink';
import DateManagement from './date-management';
import { useContext } from 'hooks/context';
import DateManagementV2 from './date-management/v2';
import Documents from './documents';
import i18next from 'i18next';
import { useSnackbar } from 'v2/hooks/useSnackbar';

const { blueMagentaViolet } = CONSTANTS.colors.general;
const { prosperBoxRed } = CONSTANTS.colors.prosper;

/* eslint no-extra-boolean-cast: "off" */
const VIEWED_UID = 'viewed';
const INTEREST_TYPE = 'Interest';

const Packages = (props) => {
  const {
    packages,
    projectData,
    slug,
    initialValues,
    bulkUpdateProjectHistory,
    init,
    projectService,
    accountInfo,
    submittingChain,
    supplyChain,
    contextType = 'clink',
    dispatch,
    clinkAccount,
    shortlistedSubcontractors,
  } = props;
  const context = useContext(contextType);
  const { actions } = context;
  const { showSnackbar } = useSnackbar();
  const { checkFeature } = useFeatureFlag();
  const isShortlistedSubcontractorEnabled = checkFeature(
    'SUBCONTRACTOR_LIST_APPROVAL',
  );

  useEffect(() => {
    if (isShortlistedSubcontractorEnabled && projectData?.id) {
      dispatch(actions.fetchShortlistedSubcontractors(projectData.id));
    }
  }, [dispatch, isShortlistedSubcontractorEnabled, actions, projectData?.id]);
  const addToShortlist = useCallback(
    async (account_ids, packageId) => {
      try {
        await dispatch(
          actions.addToShortlistSubcontractors({
            account_ids,
            projectId: projectData.id,
            tenderId: packageId,
            author_id: clinkAccount?.user?.id,
          }),
          showSnackbar(i18next.t('suppliers-added-shortlist'), 'success'),
        );
      } catch (err) {
        showSnackbar(err?.message || 'Error adding to shortlist', 'error');
      }
    },
    [actions, dispatch, showSnackbar, projectData.id, clinkAccount],
  );

  const { features = [] } = accountInfo;
  const hasBoq =
    features &&
    Boolean(features.length) &&
    features.filter((f) => f.name && f.name.toLowerCase() === 'boq');
  const flagBoq = hasBoq && Boolean(hasBoq.length);
  const DateComponent = flagBoq ? DateManagementV2 : DateManagement;
  const PUBLISHED_STATE = 2;
  const content = (
    <>
      {(!packages || (packages && isEmpty(packages))) && (
        <Alert data-testid="packages-empty-state" variant="primary">
          There aren&apos;t packages for this project.
        </Alert>
      )}
      {packages &&
        !isEmpty(packages) &&
        packages.map((packageData) => {
          const {
            id,
            label,
            awarded,
            is_custom: isCustom,
            has_document: hasDocument,
            has_tender_addendum: hasTenderAddendum,
            packages: tenders,
            procurement,
            awarded_to: packageAwardedTo,
            state,
            reference_no: referenceNo,
          } = packageData;
          const formattedPackageAwarded = Boolean(awarded);
          const formattedHasDocument = Boolean(hasDocument);
          const formattedHasTenderAddendum = Boolean(hasTenderAddendum);
          let formattedData = ClinkService.transformToArray(procurement);
          formattedData = formattedData.filter((subcontractor) => {
            const isInterest = subcontractor.type === INTEREST_TYPE;
            const isViewed = subcontractor.status.uid === VIEWED_UID;
            return !isViewed || (isViewed && !isInterest);
          });

          // Separate shortlisted subcontractors
          const shortlistedData = isShortlistedSubcontractorEnabled
            ? shortlistedSubcontractors?.[id] || []
            : [];

          const header = (
            <Typography variant="title2" sx={{ fontSize: '24px' }}>
              {' '}
              {/* TODO: establish values for fonts in the themes */}
              {label ?? ''}{' '}
              {formattedPackageAwarded && (
                <Badge variant="success">Awarded</Badge>
              )}
              {referenceNo && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    marginTop: '4px',
                  }}
                >
                  {i18next.t('reference-no')}: {referenceNo}
                </Typography>
              )}
            </Typography>
          );
          return (
            <PanelAccordion key={id} id={label} data-testid={`package-accordion-${id}`} title={header} defaultExpanded>
              <DateComponent pid={projectData.id} pack={packageData} />
              {flagBoq && (
                <Documents
                  pack={packageData}
                  slug={slug}
                  awarded={formattedPackageAwarded}
                />
              )}
              {isShortlistedSubcontractorEnabled && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                    {i18next.t('supply-chain')}
                  </Typography>
                  <ShortlistedSubcontractorsTable
                    data={shortlistedData}
                    projectId={projectData.id}
                    tenderId={id}
                    bulkUpdateProjectHistory={bulkUpdateProjectHistory}
                  />
                </>
              )}
              <TableContent
                data={formattedData}
                projectData={projectData}
                packageAwarded={formattedPackageAwarded}
                packageAwardedTo={packageAwardedTo}
                hasDocument={formattedHasDocument}
                hasTenderAddendum={formattedHasTenderAddendum}
                initialValues={initialValues}
                packageData={packageData}
                packageName={label}
                slug={slug}
                isCustom={isCustom}
                callback={init}
                accountInfo={accountInfo}
                isShortlistedSubcontractorEnabled
              />
              {formattedPackageAwarded && (
                <AwardedPackageList procurement={formattedData} />
              )}
              {!formattedPackageAwarded && (
                <Grid container>
                  <Grid item>
                    {submittingChain && (
                      <Skeleton variant="rectangular" height={40} width={100} />
                    )}
                    {!submittingChain && (
                      <NewSupplyChain
                        service={projectService}
                        packageId={id}
                        bulkUpdateProjectHistory={bulkUpdateProjectHistory}
                        subcontractor={procurement}
                        packages={tenders}
                        supplyChain={supplyChain}
                        init={init}
                        addToShortlist={addToShortlist}
                        shortlistedSubcontractors={shortlistedData}
                      />
                    )}
                  </Grid>
                  {state && state !== PUBLISHED_STATE && (
                    <Grid item>
                      <PublishModal
                        sx={{
                          margin: '24px 0',
                          background: `linear-gradient(to right, ${prosperBoxRed}, ${blueMagentaViolet})`,
                          '&:hover': {
                            background: `linear-gradient(to right, ${alpha(
                              prosperBoxRed,
                              0.9,
                            )}, ${alpha(blueMagentaViolet, 0.9)})`,
                          },
                        }}
                        pid={projectData.id}
                        tid={id}
                        openProjectsDashboard={init}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
            </PanelAccordion>
          );
        })}
    </>
  );

  return (
    <CustomStickyContainer
      data-testid="packages-container"
      className="packages-component"
      navData={packages ?? []}
      content={content}
      navAction={
        isShortlistedSubcontractorEnabled && projectData?.id ? (
          <BulkRequestSupplierApproval projectId={projectData.id} />
        ) : null
      }
    />
  );
};

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
  shortlistedSubcontractors: state.project.shortlistedSubcontractors,
});

export default connect(mapStateToProps)(Packages);
