import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Loader } from 'clink-components';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useContext } from 'hooks/context';
import Template from 'v2/apps/clink/pages/shared/template';
import SimpleAccordion from 'v2/apps/clink/pages/shared/Accordion';
import JumpTo from 'v2/apps/clink/pages/orders/JumpTo';
import Subcontractors from 'v2/apps/clink/pages/orders/subcontractors';
import { getUrl } from 'v2/helpers/url';
import DownloadButton from 'v1/transactions/components/shared/DownloadButton';

const Orders = ({
  contextType = 'clink',
  project,
  orders,
  quoteFiles,
  dispatch,
  clinkAccount,
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const context = useContext(contextType);
  const { actions } = context;
  const { slug } = params;
  const { data } = project;
  const pid = data && data.id ? data.id : null;
  const { list: listOrders, loading } = orders;

  useEffect(() => {
    if (project?.data?.id && !listOrders?.length) {
      dispatch(actions.fetchOrders(project?.data?.id)).then(() => {
        dispatch(actions.fetchQuoteFiles(pid));
      });
    } else if (project?.data?.id && listOrders?.length) {
      const hasQuoteFiles = quoteFiles && Object.keys(quoteFiles).length > 0;
      if (!hasQuoteFiles) {
        dispatch(actions.fetchQuoteFiles(pid));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.data?.id]);

  useEffect(() => {
    if (pid && listOrders?.length) {
      dispatch(actions.assignedOrderApprovers(pid));
    }
  }, [pid, dispatch, actions, listOrders?.length]);

  const withdrawSentOrder = ({ id, pid: projectId, tid, did }) =>
    dispatch(actions.withdrawSentOrder({ id, pid: projectId, tid, did }));
  const deleteOrder = ({ qid, pid: projectId, tid, did }) =>
    dispatch(actions.deleteOrder({ qid, pid: projectId, tid, did }));
  const markAsSignOrder = ({ id, pid: projectId, tid }) =>
    dispatch(actions.markAsSignOrder({ id, pid: projectId, tid }));
  const sendApprovalReminder = ({ approver_id, did }) =>
    dispatch(actions.sendApprovalReminder({ approver_id, did }));
  const withdrawOrderApproval = ({ did }) =>
    dispatch(actions.withdrawOrderApproval({ did }));

  const fetchOrderLogs = (document_id) =>
    dispatch(actions.fetchOrderLogs(document_id));

  const reloadOrders = () =>
    dispatch(actions.fetchOrders(pid)).then(() => {
      dispatch(actions.assignedOrderApprovers(pid));
      dispatch(actions.fetchQuoteFiles(pid));
    });

  return (
    <Template instructions={false} transparent>
      {Boolean(loading) && <Loader />}
      <Grid container>
        {listOrders && !Boolean(listOrders.length) && !Boolean(loading) && (
          <Grid item xs={12}>
            <Paper
              data-testid="orders-empty-state"
              sx={{ textAlign: 'center', p: 3 }}
            >
              <Typography variant="h4" paddingBottom={2}>
                {t('no-orders-available')}
              </Typography>
              <Typography paddingBottom={1}>
                {t('please-issue-order')}
              </Typography>
              <Button
                data-testid="orders-quotes-link"
                href={`/main-contractor/project/${slug}/quotes_tender`}
              >
                {t('quotes-and-analysis')}
              </Button>
            </Paper>
          </Grid>
        )}
        {listOrders && Boolean(listOrders.length) && (
          <>
            <Grid
              item
              sx={{
                width: '300px',
                boxSizing: 'border-box',
                paddingRight: '50px',
              }}
            >
              <JumpTo entries={listOrders} />
            </Grid>
            <Grid
              item
              xs
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'end',
              }}
            >
              {listOrders && Boolean(listOrders.length) && (
                <Box mb={1}>
                  <DownloadButton
                    data-testid="orders-download-report"
                    downloadLink={getUrl(
                      'CLINK_APP_HOST',
                      `/reports/order/${pid}`,
                    )}
                  >
                    DOWNLOAD ORDER REPORT
                  </DownloadButton>
                </Box>
              )}
              {listOrders &&
                listOrders.map((order) => {
                  if (!order.tender) {
                    return null;
                  }
                  const { entries, tender } = order;
                  const { label, id } = tender;
                  const quoteFilesForTender =
                    (quoteFiles && quoteFiles[id]) || {};

                  return (
                    <SimpleAccordion
                      data-testid={`orders-tender-accordion-${id}`}
                      title={label || ''}
                      key={id || ''}
                      id={(label || '').replace(/\s+/g, '-').toLowerCase()}
                    >
                      {entries && (
                        <Subcontractors
                          pid={pid}
                          entryData={entries}
                          quoteFilesForTender={quoteFilesForTender}
                          tender={tender}
                          withdrawSentOrder={withdrawSentOrder}
                          markAsSignOrder={markAsSignOrder}
                          deleteOrder={deleteOrder}
                          userInfo={clinkAccount}
                          sendApprovalReminder={sendApprovalReminder}
                          withdrawOrderApproval={withdrawOrderApproval}
                          reloadOrders={reloadOrders}
                          fetchOrderLogs={fetchOrderLogs}
                        />
                      )}
                    </SimpleAccordion>
                  );
                })}
            </Grid>
          </>
        )}
      </Grid>
    </Template>
  );
};

const mapStateToProps = (state) => {
  return {
    project: state.project,
    orders: state.order,
    quoteFiles: state?.quotesTender?.quoteFiles,
    subcontractor: state.subcontractor,
    clinkAccount: state.clinkAccount,
  };
};

export default connect(mapStateToProps)(Orders);
