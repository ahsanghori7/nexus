import React, { useState, useEffect, useMemo, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import ListItemButton from '@mui/material/ListItemButton';
import Loading from 'v2/apps/shared/components/Loading';
import useExpanded from 'v2/hooks/useExpanded';
import { CONSTANTS } from 'clink-components';
import Subheader from 'v2/apps/prosper/shared/Subheader';
import { analytics } from 'v2/services/helpers';
import { getStatus } from 'v2/helpers/status/enquiries';
import Subscription from 'v2/helpers/user/subscription';
import { getQueryStringVars } from 'v2/helpers/url';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import Container, { StyledEnquiryModal } from '../Container.styled';
import EnquiryModal from './enquiry-modal';
import Header from './Header';
import Content from './Content';
import Progress from './Progress';
import ActionButtonContent from './actions/ActionButtonContent';
import SignOrder from './actions/SignOrder';
import CollapseEnquiries from './collapse/CollapseEnquiries';
import ProjectContent from './ProjectContent';
import AcceptDeclineEnquiry from './actions/AcceptDeclineEnquiry';
import NoView from './NoView';
import DocumentHistory from './document-history';
import flag from 'v2/helpers/flags';
import AIAnalysisModal from './components/AIAnalysisModal';
import {
  fetchTenderInsights,
  createTenderInsights,
} from 'v2/store/reducers/prosper/tender-insights';

const { white } = CONSTANTS.colors.general;
const { blackPearl, prosperPurple } = CONSTANTS.colors.prosper;

const subscriptionHelper = new Subscription();
const EnquiriesV2 = ({ enquiries, subcontractor, tenderInsights, dispatch }) => {
  const [selectedTender, setSelectedTender] = useState(null);
  const [finishSelected, setFinishSelected] = useState(true);
  const [openedTender, setOpenedTender] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const { t } = useTranslation();
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const {
    latest,
    current: enquiriesList,
    status: statusEnquiries,
    documents: documentsUnused,
  } = enquiries;
  const { actions } = context;
  useEffect(() => {
    if (subcontractor.id) {
      dispatch(actions.fetchEnquiries());
      dispatch(actions.fetchDocumentsHistory());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcontractor.id]);

  useEffect(() => {
    if (finishSelected && enquiriesList && enquiriesList.length) {
      const { enquiry_id } = getQueryStringVars();
      const [tender] = enquiriesList;
      if (tender) {
        let newSelectedTender = tender;
        if (enquiry_id) {
          const [newSelected] = enquiriesList.filter(
            (e) => Number(e.id) === Number(enquiry_id),
          );
          newSelectedTender = newSelected || tender;
        }
        setSelectedTender(newSelectedTender);
        setFinishSelected(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiriesList]);

  const Item = styled(Paper)(({ theme: clinkTheme }) => ({
    backgroundColor: clinkTheme.palette.mode === 'dark' ? blackPearl : white,
    ...clinkTheme.typography.body2,
    padding: clinkTheme.spacing(1),
    textAlign: 'center',
    color: clinkTheme.palette.text.secondary,
    display: 'flex',
  }));

  const { expanded, handleChangeExpanded } = useExpanded(selectedTender);
  const [selected] = expanded;
  const [data] = selected
    ? enquiriesList.filter((e) => Number(e.id) === Number(selected))
    : [null];

  const enableAIFeatures = flag('TENDER_INSIGHTS') || false;

  const getAIButtonState = useCallback((tender) => {
    if (!enableAIFeatures || !tender) {
      return { disabled: true, tooltipTitle: null };
    }

    const document = tender?.document;
    const enquiry = document?.enquiry;

    let hasEnquiry = false;
    if (enquiry === null || enquiry === undefined) {
      hasEnquiry = false;
    } else if (Array.isArray(enquiry)) {
      hasEnquiry = enquiry.length > 0 && enquiry.some(item => item !== null && item !== undefined);
    } else if (typeof enquiry === 'object') {
      hasEnquiry = Object.keys(enquiry).length > 0;
    } else {
      hasEnquiry = Boolean(enquiry);
    }

    if (!hasEnquiry) {
      return {
        disabled: true,
        tooltipTitle: t("text-tender-document-needed-for-ai")
      };
    }

    return { disabled: false, tooltipTitle: null };
  }, [enableAIFeatures, t]);

  const selectedTenderAIState = useMemo(() => {
    const tenderToCheck = data || selectedTender;
    const state = getAIButtonState(tenderToCheck);
    return state;
  }, [data, selectedTender, getAIButtonState]);

  useEffect(() => {
    if (data?.id && enableAIFeatures && selectedTenderAIState.disabled === false) {
      const tenderId = data.id;
      const currentInsightData = tenderInsights?.insights?.[tenderId];
      if (
        !currentInsightData ||
        currentInsightData.status === 'idle' ||
        (currentInsightData.status === 'error' && currentInsightData.status !== 'loading' && currentInsightData.status !== 'creating')
      ) {
        dispatch(fetchTenderInsights({ tenderId }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, enableAIFeatures]);

  const dataStatus = getStatus(data);

  const callback = () => {
    switch (dataStatus.status) {
      case 'TENDER_RECEIVED':
        setOpenConfirm(true);
        break;
      case 'TENDER_ACCEPTED':
        setOpenedTender(data);
        break;
      default:
        break;
    }
  };

  const showPage = enquiriesList && Boolean(enquiriesList.length);
  const noViewPage =
    (subscriptionHelper.isTokenUser(subcontractor.subscription_id) ||
      subscriptionHelper.isActivatedSupplyChain(
        subcontractor.subscription_id,
      )) &&
    !statusEnquiries &&
    !showPage;

  // Infinite Scroll
  const hasMore = latest.length === enquiriesList.length;
  const fetchMoreData = () => {
    if (hasMore) {
      return;
    }
    // a fake async api call like which sends
    // 20 more records in .5 secs
    setTimeout(() => {
      dispatch(actions.nextBatch());
    }, 500);
  };


  const handleAIAnalysisClick = () => {
    if (data?.id) {
      const tenderId = data.id;
      const currentInsightData = tenderInsights?.insights?.[tenderId];

      if (!currentInsightData || currentInsightData.status === 'error' || currentInsightData.status === 'idle') {
        dispatch(createTenderInsights({ tenderId }));
      }
    }
    setAiModalOpen(true);
  };

  const handleAIModalClose = () => {
    setAiModalOpen(false);
  };

  // TODO: Check if we re-instated the tender download
  // const checkTenderDownloaded = () =>
  //   analytics('history.enquiry.downloaded', data.author_id, data.group_id, () =>
  //     dispatch(actions.tenderIsDownloaded())
  //   );

  const hiddenStatuses = [
    'AWARDED',
    'PENDING_SIGNATURE',
    'ORDER_SIGNED',
    'ORDER_REJECTED',
    'ORDER_RETRACTED',
    'INTEREST_DECLINED',
    'TENDER_DECLINED',
    'TENDER_RECEIVED',
    'UNSUCCESSFUL',
    'OTHER_STATUS',
  ];
  const showButton = !hiddenStatuses.includes(dataStatus.status);

  let showBoqLink = false;
  if (selected) {
    const flagBoq = data?.document?.enquiry?.has_boq;
    const acceptedStatuses = ['QUOTE_SENT', 'TENDER_ACCEPTED'];
    showBoqLink =
      showButton &&
      dataStatus &&
      dataStatus.status &&
      acceptedStatuses.includes(dataStatus.status) &&
      flagBoq;
  }
  const { slug, id: tenderId } = data || {};
  const redirect = `enquiries/submit-quote/${slug}/${tenderId}`;
  return (
    <>
      <Container className="enquiries-filters">
        <Loading status={statusEnquiries} />
        {noViewPage && <NoView subcontractor={subcontractor} />}
        {!statusEnquiries && showPage && (
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={5}>
              <Grid item xs={12} display={{ xs: 'block', lg: 'none' }}>
                <CollapseEnquiries
                  list={enquiriesList}
                  fetchMoreData={fetchMoreData}
                  hasMore={hasMore}
                  expanded={expanded}
                  handleChangeExpanded={handleChangeExpanded}
                  handleAction={callback}
                  handleOpen={() => {
                    setOpenConfirm(true);
                  }}
                  handleClose={() => setOpenConfirm(false)}
                  openConfirm={openConfirm}
                  setOpenConfirm={() => setOpenConfirm(true)}
                  isAIAvailable={(enquiry) => !getAIButtonState(enquiry).disabled && (getStatus(enquiry)?.index ?? -1) >= 2}
                  enableAIFeatures={enableAIFeatures}
                  onAIAnalysisClick={handleAIAnalysisClick}
                  getAIButtonState={getAIButtonState}
                  tenderInsights={tenderInsights}
                  accept={() =>
                    analytics(
                      'history.enquiry.accepted',
                      data.author_id,
                      data.group_id,
                      () =>
                        dispatch(
                          actions.patchEnquiriesStatus({
                            enquiryId: data.id,
                            status: { id: 4, label: 'Tender Received' },
                          }),
                        ),
                    )
                  }
                  decline={() => {
                    analytics(
                      'history.enquiry.declined',
                      data.author_id,
                      data.group_id,
                      () =>
                        dispatch(
                          actions.patchEnquiriesStatus({
                            enquiryId: data.id,
                            status: { id: 2, label: 'Dismissed' },
                          }),
                        ),
                    );
                    setOpenConfirm(false);
                  }}
                  showBoqLink={showBoqLink}
                />
              </Grid>
              <Grid item lg={4} display={{ xs: 'none', lg: 'block' }}>
                <List
                  data-testid="enquiry-list"
                  id="scrollableDiv"
                  disablePadding
                  sx={{
                    backgroundColor: white,
                    maxHeight: 654,
                    overflow: 'auto',
                  }}
                >
                  <InfiniteScroll
                    scrollableTarget="scrollableDiv"
                    dataLength={enquiriesList.length}
                    next={fetchMoreData}
                    hasMore={!hasMore}
                    loader={
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={100}
                      />
                    }
                  >
                    {enquiriesList.map((i) => (
                      <ListItemButton
                        key={i.id}
                        data-testid={`enquiry-list-item-${i.id}`}
                        sx={{ padding: '0px' }}
                        selected={expanded ? expanded.includes(i.id) : false}
                        onClick={() => handleChangeExpanded(i.id)}
                      >
                        <Card
                          sx={{
                            width: '100%',
                            borderRadius: 0,
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Header
                            title={i.project}
                            subheader={i.package}
                          />
                          <Subheader data={i} />
                        </Card>
                      </ListItemButton>
                    ))}
                  </InfiniteScroll>
                </List>
              </Grid>
              <Grid item lg={8} display={{ xs: 'none', md: 'block' }}>
                {Boolean(selected) && (
                  <Item>
                    <Grid item md={6}>
                      {data && (
                        <>
                          <Header
                            title={data.project}
                            subheader={data.package}
                            showAIBadge={!selectedTenderAIState.disabled && (dataStatus?.index ?? -1) >= 2}
                            aiBadgeVariant="full"
                          />
                          <Content
                            data={data}
                            idContact={data.author_id}
                            subcontractor={subcontractor}
                          />
                          <Progress
                            data={data}
                            showAIButton={enableAIFeatures}
                            aiButtonDisabled={selectedTenderAIState.disabled}
                            aiButtonTooltipTitle={selectedTenderAIState.tooltipTitle}
                            onAIAnalysisClick={handleAIAnalysisClick}
                            hasViewedAIResults={
                              tenderInsights?.insights?.[data?.id]?.status === 'success' &&
                              !!tenderInsights?.insights?.[data?.id]?.data
                            }
                          />
                          {showBoqLink && (
                            <List sx={{ padding: '16px', float: 'left' }}>
                              <ListItem>
                                <FormatListNumberedIcon
                                  sx={{ color: prosperPurple }}
                                />
                                <Link
                                  data-testid="boq-link"
                                  rel="noopener"
                                  target="_blank"
                                  href={redirect}
                                  sx={{ marginLeft: '4px' }}
                                >
                                  {t('access-digital-price-breakdown')}
                                </Link>{' '}
                              </ListItem>
                            </List>
                          )}
                        </>
                      )}
                      {data && dataStatus.status === 'TENDER_RECEIVED' && (
                        <AcceptDeclineEnquiry
                          data={data}
                          accept={() =>
                            analytics(
                              'history.enquiry.accepted',
                              data.author_id,
                              data.group_id,
                              () =>
                                dispatch(
                                  actions.patchEnquiriesStatus({
                                    enquiryId: data.id,
                                    status: { id: 4, label: 'Tender Received' },
                                  }),
                                ),
                            )
                          }
                          decline={() => {
                            analytics(
                              'history.enquiry.declined',
                              data.author_id,
                              data.group_id,
                              () =>
                                dispatch(
                                  actions.patchEnquiriesStatus({
                                    enquiryId: data.id,
                                    status: { id: 2, label: 'Dismissed' },
                                  }),
                                ),
                            );
                            setOpenConfirm(false);
                          }}
                          handleOpen={() => {
                            setOpenConfirm(true);
                          }}
                          setOpenConfirm={setOpenConfirm}
                          openConfirm={openConfirm}
                          handleClose={() => setOpenConfirm(false)}
                        />
                      )}
                      {showButton && (
                        <ActionButtonContent
                          label={
                            dataStatus.status === 'TENDER_ACCEPTED'
                              ? t('text-create-quote')
                              : null
                          }
                          data={data}
                          handleAction={callback}
                        />
                      )}
                      {data && dataStatus.status === 'PENDING_SIGNATURE' && (
                        <SignOrder data={data} />
                      )}
                    </Grid>
                    <Grid item md={6} sx={{ justifyContent: 'center' }}>
                      <ProjectContent data={data} />
                    </Grid>
                  </Item>
                )}
              </Grid>
              <Grid item lg={4} xs={0} />
              <Grid item lg={8} display={{ xs: 'none', md: 'block' }}>
                {Boolean(selected) && (
                  <DocumentHistory
                    selected={data}
                    documents={documentsUnused}
                    tenderId={selected}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
      {openedTender && (
        <StyledEnquiryModal>
          <EnquiryModal
            subcontractor={subcontractor}
            enquiry={openedTender}
            dispatch={dispatch}
            openModalClass="auto-open-btn"
            externalOpen
            hideDefaultOpenModalContent
            onHidden={() => setOpenedTender(null)}
          />
        </StyledEnquiryModal>
      )}
      <AIAnalysisModal
        open={aiModalOpen}
        onClose={handleAIModalClose}
        tenderId={data?.id}
        projectName={data?.project}
        documents={documentsUnused}
        enquiry={data?.document?.enquiry}
      />
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    enquiries: state.enquiries,
    subcontractor: state.subcontractor,
    subscription: state.subscription,
    account: state.account,
    tenderInsights: state.tenderInsights,
  };
};
export default connect(mapStateToProps)(EnquiriesV2);
