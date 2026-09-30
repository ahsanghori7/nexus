import React, { useMemo, useEffect, useState } from 'react';
import { getProjectUrl } from 'v2/helpers/url';
import Alert from '@mui/material/Alert';
import { Link } from 'react-router-dom';
import { useContext } from 'hooks/context';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { TA_LABEL } from 'v1/global/helpers/constants';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
// TODO: Replace DocController to redux
import DocController from 'v1/global/services/documents/DocumentCreatorSend';
import { analytics } from 'v1/global/helpers/services';
import Contacts from './Contacts';
import SelectTender from './SelectTender';
import Snackbar from '@mui/material/Snackbar';

const { clinkRed } = CONSTANTS.colors.general;

const RedAsterisk = () => <span style={{ color: clinkRed }}>*</span>;
const TENDER_TEMPLATE_PUBLISHED = 1;

const SendDocumentModal = ({
  loading = false,
  templates = [],
  contacts,
  open,
  slug,
  dispatch,
  orders = false,
  did = 0,
  selectedTemplate,
  callback,
  handleSend,
  isUnifiedPage = false,
  projectEnquiries,
}) => {
  const [message, setMessage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    if (!orders && open && open?.pid && open?.tid) {
      dispatch(
        actions.fetchTenderTemplates({
          pid: open.pid,
          tid: open.tid,
          status: TENDER_TEMPLATE_PUBLISHED,
          approval_status: 'Approved',
        }),
      );
    }
  }, [open, dispatch, actions, orders]);

  const filteredDocs = useMemo(
    () =>
      templates.filter((d) =>
        open && open?.tenderAddendum
          ? d.name === TA_LABEL
          : d.name !== TA_LABEL,
      ),
    [templates, open],
  );

  const title = useMemo(() => {
    if (open && open?.tenderAddendum) {
      return i18next.t('send-tender-addendum');
    }
    const label = orders ? 'send-order' : 'send-enquiry';
    return i18next.t(label);
  }, [open, orders]);

  const subcontractors = useMemo(() => {
    // For unified page (tender enquiries), extract from projectEnquiries
    if (isUnifiedPage && projectEnquiries?.tenders && open?.tid) {
      const tender = projectEnquiries.tenders[open.tid];
      if (tender?.subcontractors) {
        const subs = tender.subcontractors;
        if (typeof subs === 'object' && !Array.isArray(subs)) {
          return Object.values(subs);
        }
        return Array.isArray(subs) ? subs : [];
      }
      return [];
    }

    // Default behavior for non-unified pages
    const subs = open?.subcontractors;
    if (subs && typeof subs === 'object' && !Array.isArray(subs)) {
      return Object.values(subs);
    }
    return subs || [];
  }, [isUnifiedPage, projectEnquiries, open?.tid, open?.subcontractors]);

  const suids = useMemo(() => {
    if (!contacts) {
      return [];
    }
    const selectedIds = [];
    Object.values(contacts).forEach((contactArray) => {
      contactArray.forEach((contact) => {
        if (contact.selected) {
          selectedIds.push(contact.id);
        }
      });
    });
    return selectedIds;
  }, [contacts]);

  const sids = useMemo(() => {
    if (!contacts) {
      return [];
    }
    const selectedIds = [];
    Object.values(contacts).forEach((contactArray) => {
      contactArray.forEach((contact) => {
        if (contact.selected) {
          selectedIds.push(contact.account_id);
        }
      });
    });
    return selectedIds;
  }, [contacts]);

  const documentId = useMemo(() => {
    const newDid = orders ? templates[0]?.id : (open?.did || did);
    return selectedTemplate || newDid;
  }, [did, orders, selectedTemplate, templates, open?.did]);

  const disabled = useMemo(() => {
    return loading || submitting || !sids.length || !documentId || message;
  }, [documentId, loading, message, sids.length, submitting]);

  const handleClose = () => {
    dispatch(actions.setOpenContactsModal(false));
    dispatch(actions.setTenderTemplates([]));
    dispatch(actions.setSelectedTemplate(0));
    dispatch(actions.setContacts({}));
    setMessage(false);
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sids.length || !documentId) {
      setMessage({
        severity: 'error',
        message: i18next.t('no-documents-available'),
      });
      return;
    }

    setSubmitting(true);

    if (orders) {
      handleSend(sids);
      return;
    }

    const body = {
      sids,
      suids,
      did: documentId,
      tid: open.tid,
    };

    const callbackSuccess = () => {
      setSubmitting(false);
      const promises = body.sids.map(
        // eslint-disable-next-line no-promise-executor-return
        (sid) =>
          new Promise(() => {
            analytics('history.enquiry.sent', Number(sid));
          }),
      );
      Promise.all(promises);
      callback();
      setSnackbarOpen(true);
      setSnackbarSeverity('success');
      setSnackbarMessage(i18next.t('enquiry-sent-success-msg'));
      handleClose();
    };
    const callbackError = (error = null) => {
      setSubmitting(false);
      setSnackbarOpen(true);
      setSnackbarSeverity('error');
      setSnackbarMessage(
        error?.status === 429 && error?.message ? error.message : i18next.t('oops'),
      );
      handleClose();
    };
    DocController(JSON.stringify(body), callbackSuccess, callbackError);
  };

  if (!loading && !orders && filteredDocs.length === 0) {
    const url = getProjectUrl(slug, `issue_enquiry`, { tid: open?.tid });
    return (
      <Dialog
        open={Boolean(open)}
        onClose={handleClose}
        fullScreen={fullScreen}
      >
        <DialogTitle variant="h5" fontWeight="bold">
          {title}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">
            <Typography>{ open?.hasDocument && !open?.tenderAddendum ? i18next.t('no-approved-tender-documents') : '' }</Typography>
            <Typography>{ open?.hasTenderAddendum && open?.tenderAddendum ? i18next.t('no-approved-tender-addendum') : '' }</Typography>
            <Typography>{ !open?.hasTenderAddendum && open?.tenderAddendum ? i18next.t('no-documents-available-ta') : '' }</Typography>
            <Typography>{ !open?.hasDocument && !open?.tenderAddendum ? i18next.t('no-documents-available-td') : '' }</Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button color="error" variant="contained" onClick={handleClose}>
            {i18next.t('close')}
          </Button>
          {
            !open?.hasDocument && !open?.tenderAddendum && (
              <Button to={url} LinkComponent={Link} variant="contained">
                {i18next.t('create-tender-document')}
              </Button>
            )
          }
          {
            !open?.hasTenderAddendum && open?.tenderAddendum && (
              <Button to={url} LinkComponent={Link} variant="contained">
                {i18next.t('create-tender-addendum')}
              </Button>
            )
          }
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog
        open={Boolean(open)}
        onClose={handleClose}
        fullScreen={fullScreen}
      >
        <DialogTitle variant="h5" fontWeight="bold">
          {title}
        </DialogTitle>
        <DialogContent>
          {loading && (
            <Grid
              container
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Grid sx={{ width: '100%' }}>
                <LinearProgress />
              </Grid>
            </Grid>
          )}
          {!loading && (
            <>
              <Grid container spacing={2} flexDirection="column" mb={2}>
                <Grid sx={{ width: '100%' }}>
                  <Typography fontWeight={700}>
                    {i18next.t('select-tender-documents')} <RedAsterisk />
                  </Typography>
                </Grid>
                <Grid sx={{ width: '100%' }}>
                  <SelectTender did={documentId} />
                </Grid>
              </Grid>
              <Grid container spacing={2} flexDirection="column">
                <Grid>
                  <Typography fontWeight={700}>
                    {i18next.t('your-selected-specialists')} <RedAsterisk />
                  </Typography>
                </Grid>

                {subcontractors.length === 0 ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography color={clinkRed} component="p">{i18next.t('no-subcractor-assigned')}</Typography>
                    <Typography component="p">{i18next.t('close-and-add-subcontractor')}</Typography>
                  </Alert>
                ) : (
                  <Grid>
                    {subcontractors.map((subcontractor) => (
                      <Contacts
                        key={subcontractor?.id || subcontractor?.sub_id}
                        subcontractor={subcontractor}
                        isUnifiedPage={isUnifiedPage}
                      />
                    ))}
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="error" variant="contained" onClick={handleClose}>
            {i18next.t('close')}
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={disabled}
            onClick={handleSubmit}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {title}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            whiteSpace: 'pre-line',
            '& .MuiAlert-icon': {
              alignSelf: 'center',
            },
            '& .MuiAlert-action': {
              alignSelf: 'center',
            },
          }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

const mapStateToProps = (state) => ({
  loading: state?.tenderTemplates?.loading,
  open: state?.contacts?.open,
  templates: state?.tenderTemplates?.tenderTemplates,
  selectedTemplate: state?.contacts?.selectedTemplate,
  contacts: state.supplyChain.contacts,
  slug: state?.project?.data?.slug,
  projectEnquiries: state?.project?.projectEnquiries,
});

export default connect(mapStateToProps)(SendDocumentModal);
