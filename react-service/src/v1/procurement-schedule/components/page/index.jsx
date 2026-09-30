import React, { useEffect, useCallback, useRef } from 'react';
import { useContext } from 'v2/hooks/context';
import 'v1/global';
import 'v1/procurement-schedule/public/styles/index.scss';
import { connect } from 'react-redux';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { getFetchError } from 'v1/global/helpers/error';
import ProjectService from 'v1/procurement-schedule/services/project';
import { resetUrl } from 'v2/helpers/url';
import { isTenderAddendumSlug } from 'v1/global/helpers/constants';
import SendDocumentModal from 'v2/apps/shared/components/send-document-modal';
import Packages from './packages';
import Subcontractors from './subcontractor';

const PUBLISHED = 1;

class ProcurementSchedule extends React.PureComponent {
  constructor(props) {
    super(props);

    this.bulkUpdateProjectHistory = this.bulkUpdateProjectHistory.bind(this);
    this.projectService = new ProjectService();
  }

  componentWillUnmount() {
    this.projectService = null;
  }

  // TODO: Move this to the project reducer
  async bulkUpdateProjectHistory(data, actions, packageId, disableAlert = false) {
    const { id: pid } = this.props.project.data;
    const params = {
      pid,
      status: 'added',
      type: 'Enquiry',
    };
    const optionsSuccess = {
      title: 'They’re on!',
      message: 'The selected subcontractors have been added to your schedule.',
      type: 'success',
    };
    await this.projectService.bulkUpdateProjectHistory(
      params,
      data,
      this.props.callbackInit,
      packageId,
      actions,
      optionsSuccess,
      disableAlert,
    );

    // Show snackbar if feature is enabled
    if (this.props.isShortlistedSubcontractorEnabled && this.props.showSnackbar) {
      this.props.showSnackbar(optionsSuccess.message, optionsSuccess.type);
    }
  }

  render() {
    const {
      project,
      clinkAccount,
      supplyChain,
      procurementSchedule,
      callbackInit,
    } = this.props;
    const {
      packages,
      submittingProcurement,
      errorProcurement,
      enquiryProOnLoad,
      interests,
      submittingInterest,
      errorInterest,
    } = procurementSchedule;

    const initialValues = {
      project_name: (project && project.data && project.data.name) || '',
      packages: packages.map((pack) => ({ label: pack.label, value: pack.id })),
      status: (project && project.data && project.data.status) || 0,
      region: (project && project.data && project.data.region) || 0,
    };

    const status = (project && project.data && project.data.status) || 0;
    return (
      <>
        <SendDocumentModal {...enquiryProOnLoad} callback={callbackInit} />
        {!submittingProcurement && errorProcurement && (
          <Alert data-testid="procurement-error-procurement" severity="error">
            {getFetchError('the procurement data')}
          </Alert>
        )}
        {!submittingInterest && errorInterest && (
          <Alert data-testid="procurement-error-interest" severity="error">{getFetchError('the interest data')}</Alert>
        )}
        {submittingInterest && <Skeleton data-testid="procurement-interest-loading" width="1000px" height="500px" />}
        {!submittingInterest && status === PUBLISHED && (
          <Subcontractors
            interests={interests}
            pid={project.data.id}
            slug={(project && project.data && project.data.slug) || ''}
            init={callbackInit}
          />
        )}
        {submittingProcurement && (
          <Grid container data-testid="procurement-packages-loading">
            <Grid container item xs={4}>
              <Stack spacing={1} width="800%">
                <Skeleton variant="rectangular" width={410} height={600} />
              </Stack>
            </Grid>
            <Grid container item xs={8}>
              <Stack spacing={1}>
                <Skeleton variant="rectangular" width={1010} height={600} />
                <Skeleton variant="rectangular" width={1010} height={600} />
                <Skeleton variant="rectangular" width={1010} height={600} />
              </Stack>
            </Grid>
          </Grid>
        )}
        {!submittingProcurement && (
          <Packages
            packages={packages}
            projectData={project.data}
            slug={(project && project.data && project.data.slug) || ''}
            initialValues={initialValues}
            init={callbackInit}
            projectService={this.projectService}
            bulkUpdateProjectHistory={this.bulkUpdateProjectHistory}
            accountInfo={clinkAccount}
            submittingChain={supplyChain?.loading}
            supplyChain={supplyChain?.data}
          />
        )}
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    project: state.project,
    clinkAccount: state.clinkAccount,
    supplyChain: state.supplyChain,
    procurementSchedule: state.procurementSchedule,
  };
};

const Wrapper = (props) => {
  const context = useContext('clink');
  const { actions } = context;
  const { project, dispatch, procurementSchedule } = props;
  const {
    packages,
    submittingProcurement,
    errorProcurement,
    errorInterest,
    deletingShortlisted,
    requestingApproval,
  } = procurementSchedule;


  const prevDeletingRef = useRef();
  const prevRequestingRef = useRef();

  const scrollToPackageFromHash = useCallback(() => {
    const hash = decodeURIComponent(window.location.hash.substring(1)); // Remove the '#' and decode
    if (hash) {
      const targetElement = document.getElementById(hash);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  useEffect(() => {
    // supply chain
    dispatch(actions.fetchAll());
  }, [actions, dispatch]);

  useEffect(() => {
    if (!submittingProcurement && !errorProcurement && !errorInterest) {
      scrollToPackageFromHash();
    }
  }, [
    submittingProcurement,
    errorProcurement,
    errorInterest,
    scrollToPackageFromHash,
  ]);

  const packagesList = procurementSchedule?.packages;
  const packagesLength = packagesList?.length;

  const resetPS = useCallback(() => {
    const projectVersion = project?.data?.version;
    if (projectVersion === 1) {
      dispatch(actions.getProjectProcurement({ pid: project?.data?.id }));
    } else if (projectVersion === 2) {
      dispatch(
        actions.getProjectProcurementOverviewV2({
          project_id: project?.data?.id,
        }),
      );
    }
  }, [actions, dispatch, project?.data?.id, project?.data?.version]);

  useEffect(() => {
    const wasDeleting =
      prevDeletingRef.current === true && deletingShortlisted === false;
    const wasRequesting =
      prevRequestingRef.current === true && requestingApproval === false;

    if ((wasDeleting || wasRequesting) && project?.data?.id) {
      resetPS();
    }

    prevDeletingRef.current = deletingShortlisted;
    prevRequestingRef.current = requestingApproval;
  }, [deletingShortlisted, requestingApproval, project?.data?.id, resetPS]);

  useEffect(() => {
    if (project?.data?.id) {
      dispatch(actions.getProjectInterests({ pid: project?.data?.id }));
      if (!packagesLength) {
        resetPS();
      }
    }
  }, [actions, dispatch, project?.data?.id, packagesLength, resetPS]);

  const callbackInit = useCallback(() => {
    dispatch(actions.openEnquiryPro({}));
    resetPS();
  }, [dispatch, actions, resetPS]);

  const handleOpenEnquiryPro = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tid = urlParams.get('tid');
    if (tid && project?.data?.id && packages?.length > 0) {
      const tenders = packages.filter((i) => Number(i.id) === Number(tid));
      if (tenders.length > 0) {
        const pid = project?.data?.id;
        const did = urlParams.get('did');
        const slug = urlParams.get('slug');
        const packageObj = tenders[0];
        const subcontractors = packageObj?.procurement;
        const hasDocument = packageObj?.has_document;
        const hasTenderAddendum = packageObj?.has_tender_addendum;
        const tenderAddendum = isTenderAddendumSlug(slug);
        dispatch(
          actions.openEnquiryPro({
            pid,
            tid,
            did,
            tenderAddendum,
            hasDocument,
            hasTenderAddendum,
            packageName: packageObj?.label,
          }),
        );
        dispatch(
          actions.setOpenContactsModal({
            pid,
            tid,
            tenderAddendum,
            subcontractors,
            hasDocument,
            hasTenderAddendum,
            packageName: packageObj?.label,
          }),
        );
        resetUrl();
      }
    }
  }, [actions, dispatch, packages, project?.data?.id]);

  useEffect(() => {
    handleOpenEnquiryPro();
    window.addEventListener('popstate', handleOpenEnquiryPro);

    return () => {
      window.removeEventListener('popstate', handleOpenEnquiryPro);
    };
  }, [handleOpenEnquiryPro]);

  if (project?.data?.id) {
    return <ProcurementSchedule {...props} callbackInit={callbackInit} />;
  }

  return null;
};

export default connect(mapStateToProps)(Wrapper);
