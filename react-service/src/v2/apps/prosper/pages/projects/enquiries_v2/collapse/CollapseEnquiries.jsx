import React from 'react';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Skeleton from '@mui/material/Skeleton';
import { getStatus } from 'v2/helpers/status/enquiries';
import Subheader from 'v2/apps/prosper/shared/Subheader';
import Header from '../Header';
import ExpandCollapse from './ExpandCollapse';
import Content from '../Content';
import Progress from '../Progress';
import ActionButtonContent from '../actions/ActionButtonContent';
import AcceptDeclineEnquiry from '../actions/AcceptDeclineEnquiry';
import SignOrder from '../actions/SignOrder';

const CollapseEnquiries = ({
  list,
  expanded,
  handleChangeExpanded,
  handleAction,
  handleClose,
  openConfirm,
  accept,
  decline,
  handleOpen,
  setOpenConfirm,
  hasMore,
  fetchMoreData,
  isAIAvailable,
  onAIAnalysisClick,
  tenderInsights,
  enableAIFeatures,
  getAIButtonState,
}) => {
  const { t } = useTranslation();
  return (
    <List data-testid="collapse-enquiries-list" disablePadding>
      <InfiniteScroll
        dataLength={list.length}
        next={fetchMoreData}
        hasMore={!hasMore}
        loader={<Skeleton variant="rectangular" width="100%" height={100} />}
      >
        {list.map((i) => {
          const dataStatus = getStatus(i);
          return (
            <ListItem key={i.id} data-testid={`collapse-enquiry-item-${i.id}`}>
              <Card sx={{ width: '100%' }}>
                <Header
                  title={i.project}
                  subheader={i.package}
                  showAIBadge={isAIAvailable ? isAIAvailable(i) : false}

                  ActionCollapse={
                    <ExpandCollapse
                      id={i.id}
                      expanded={expanded}
                      handleChangeExpanded={handleChangeExpanded}
                    />
                  }
                />
                {expanded && !expanded.includes(i.id) && <Subheader data={i} />}
                <Collapse
                  in={expanded ? expanded.includes(i.id) : false}
                  timeout="auto"
                  unmountOnExit
                >
                  <Grid container sx={{ flexDirection: 'column' }}>
                    <Content data={i} idContact={i.author_id} />
                    <Progress
                      data={i}
                      showAIButton={enableAIFeatures}
                      aiButtonDisabled={getAIButtonState ? getAIButtonState(i).disabled : true}
                      aiButtonTooltipTitle={getAIButtonState ? getAIButtonState(i).tooltipTitle : null}
                      onAIAnalysisClick={onAIAnalysisClick}
                      hasViewedAIResults={
                        tenderInsights?.insights?.[i?.id]?.status === 'success'
                      }
                    />
                    {dataStatus.status === 'TENDER_RECEIVED' && (
                      <AcceptDeclineEnquiry
                        data={i}
                        accept={accept}
                        decline={decline}
                        handleOpen={handleOpen}
                        setOpenConfirm={setOpenConfirm}
                        openConfirm={openConfirm}
                        handleClose={handleClose}
                      />
                    )}
                    {dataStatus.status !== 'AWARDED' &&
                      dataStatus.status !== 'PENDING_SIGNATURE' &&
                      dataStatus.status !== 'ORDER_SIGNED' &&
                      dataStatus.status !== 'ORDER_REJECTED' &&
                      dataStatus.status !== 'ORDER_RETRACTED' &&
                      dataStatus.status !== 'INTEREST_DECLINED' &&
                      dataStatus.status !== 'TENDER_DECLINED' &&
                      dataStatus.status !== 'TENDER_RECEIVED' &&
                      dataStatus.status !== 'UNSUCCESSFUL' &&
                      dataStatus.status !== 'OTHER_STATUS' && (
                        <ActionButtonContent
                          label={
                            dataStatus.status === 'TENDER_ACCEPTED'
                              ? t('text-create-quote')
                              : null
                          }
                          data={i}
                          handleAction={handleAction}
                        />
                      )}
                    {dataStatus.status === 'PENDING_SIGNATURE' && (
                      <SignOrder data={i} />
                    )}
                  </Grid>
                </Collapse>
              </Card>
            </ListItem>
          );
        })}
      </InfiniteScroll>
    </List>
  );
};

export default CollapseEnquiries;
