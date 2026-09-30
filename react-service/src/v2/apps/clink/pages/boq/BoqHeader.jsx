import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import Loading from 'v2/apps/shared/components/Loading';
import Add from './add';
import Empty from './add/Empty';
import AddTab, { ADD_LABEL } from './add/Tab';
import SummaryTab, { SUMMARY_LABEL } from './summary/Tab';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import Summary from './summary';
import { useContext } from 'hooks/context';
import SmartBoqBuilderModal from 'v2/apps/clink/pages/boq/smart-builder/SmartBoqBuilderModal';
import { buildGenerateBoqFormData } from 'v2/apps/clink/pages/boq/buildGenerateBoqFormData';
import { generateBoqWithAI } from 'v2/store/reducers/common/boq';
import {
  modalSx,
  newBoqModalCancelSx,
  newBoqModalAcceptSx,
} from 'v2/apps/clink/pages/boq/content/style';
import Container from 'v2/apps/clink/pages/boq/container';

const { boqAccent, white, clinkLightPurple, darkCharcoal } = CONSTANTS.colors.general;

const TabPanel = ({ children, value, index }) => (
  <Box
    sx={{
      display: value === index ? 'block' : 'none',
      padding: '20px 0',
      width: '100%',
    }}
  >
    {children}
  </Box>
);

const MAX_TABS = 4;
const summaryLower = SUMMARY_LABEL.toLocaleLowerCase();
const addLower = ADD_LABEL.toLocaleLowerCase();
const extraTabContent = (hasEntities, navigateToTenderId, isBoqListLoading) => ({
  [summaryLower]: hasEntities ? (
    <Summary theme="clink" navigate={navigateToTenderId} />
  ) : (
    <Empty hasEntities={hasEntities} loading={isBoqListLoading} />
  ),
  [addLower]: <Empty hasEntities={hasEntities} loading={isBoqListLoading} />,
});

const selectedSx = {
  color: boqAccent,
  borderBottom: `2px solid ${boqAccent}`,
};

const resolvePackageTabIndex = (tabsArray, tenderParam, currentTender) => {
  if (!tabsArray.length) return null;

  const routeTenderId = Number(tenderParam);
  if (Number.isFinite(routeTenderId)) {
    const routeIndex = tabsArray.findIndex(
      ({ tid, entity }) =>
        Number(tid) === routeTenderId ||
        Number(entity?.tender_id) === routeTenderId ||
        Number(entity?.tender?.id) === routeTenderId ||
        Number(entity?.id) === routeTenderId
    );
    if (routeIndex >= 0) return routeIndex;
  }

  const tenderId = Number(currentTender?.id);
  if (Number.isFinite(tenderId)) {
    const tenderIndex = tabsArray.findIndex(
      ({ tid, entity }) =>
        Number(tid) === tenderId ||
        Number(entity?.tender_id) === tenderId ||
        Number(entity?.tender?.id) === tenderId
    );
    if (tenderIndex >= 0) return tenderIndex;
  }

  return null;
};

const TabContentSkeleton = () => (
  <Box data-testid="boq-tab-content-skeleton" sx={{ py: 2 }}>
    <Skeleton
      variant="rectangular"
      height={56}
      sx={{ borderRadius: '12px', mb: 2 }}
    />
    <Skeleton
      variant="rectangular"
      height={520}
      sx={{ borderRadius: '12px' }}
    />
  </Box>
);

const BoqHeader = ({
  data = null,
  tabsArray = [],
  currentTender = null,
  slug = '',
  myRef = null,
  entities = [],
  reset = () => null,
  hasEntities = false,
  loading = { message: 'Loading' },
  isBoqListLoading = false,
  dispatch = () => null,
  contextType = 'clink',
}) => {
  const [open, setOpen] = useState(false);
  const [smartBoqModal, setSmartBoqModal] = useState({
    open: false,
    packageId: null,
    packageName: '',
  });
  const context = useContext(contextType);
  const { actions } = context;
  const [tabValue, setTabValue] = useState(false);
  const pendingTabIndexRef = useRef(null);
  const [extraTabValue, setExtraTabValue] = useState(
    hasEntities ? false : addLower
  );
  const { tid: tenderParam } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const pendingTabIndex = pendingTabIndexRef.current;
    const resolvedIndex = resolvePackageTabIndex(
      tabsArray,
      tenderParam,
      currentTender
    );

    // A Redux render can happen before navigate() updates `tid`. Do not let
    // that stale URL select the old panel and suppress the clicked package's
    // API skeleton.
    if (pendingTabIndex !== null) {
      if (resolvedIndex !== pendingTabIndex) return;
      pendingTabIndexRef.current = null;
    }

    if (resolvedIndex !== null) {
      setTabValue(resolvedIndex);
    }
  }, [tabsArray, tenderParam, currentTender]);

  useEffect(() => {
    let extra = false;
    if (tenderParam === summaryLower) {
      extra = summaryLower;
      setTabValue(false);
    }
    if (!extra && !hasEntities) {
      extra = addLower;
    }
    setExtraTabValue(extra);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEntities, tenderParam]);

  const navigateTabs = (tab) => {
    setExtraTabValue(false);
    const tid = tab?.entity?.tender?.id ?? tab?.entity?.tender_id ?? tab?.tid;
    if (tid == null) return;
    navigate(`/main-contractor/project/${slug}/boq/${tid}`);
  };

  const navigateExtraTabs = (label) => {
    switch (label.toLocaleLowerCase()) {
      case 'add':
        // eslint-disable-next-line no-unused-expressions
        myRef?.current?.click();
        // When packages already exist, "Add" should only open the dialog.
        // It must NOT switch away from the currently selected trade tab (otherwise content becomes blank).
        if (!hasEntities) {
          setExtraTabValue(label.toLocaleLowerCase());
          setTabValue(false);
        }
        break;
      case 'summary':
        navigate(`/main-contractor/project/${slug}/boq/summary`);
        setExtraTabValue(label.toLocaleLowerCase());
        setTabValue(false);
        break;
      default:
        setTabValue(false);
        break;
    }
  };

  const navigateAfterAdding = (id) => {
    navigate(`/main-contractor/project/${slug}/boq/${id}`);
    setExtraTabValue(false);
  };

  const navigateToTenderId = (tid) => {
    navigate(`/main-contractor/project/${slug}/boq/${tid}`);
    setExtraTabValue(false);
  };

  const newTabConfig = (newValue) => {
    pendingTabIndexRef.current = newValue;
    setTabValue(newValue);
    const newTabInfo = tabsArray[newValue];
    navigateTabs(newTabInfo);
  };

  const handleOnChange = (_event, newValue, callback = newTabConfig) => {
    const currentTenderId = currentTender?.id;
    const [selectedTender] =
      (currentTenderId &&
        entities.filter(
          (e) => Number(e.tender_id) === Number(currentTenderId)
        )) ||
      [];

    const hasEntryChanges =
      selectedTender &&
      !isEqual(selectedTender.nextEntries, selectedTender.entries);
    const hasNoteChanges =
      selectedTender && !isEqual(selectedTender.nextNote, selectedTender.note);
    const hasUnsavedChanges = hasNoteChanges || hasEntryChanges;
    if (hasUnsavedChanges) {
      setOpen({
        id: 'edit-bow',
        navTitle: 'boq-leave-warn-title',
        title: 'boq-leave-warn-body',
        cancel: 'cancel',
        confirm: 'confirm',
        handleAccept: () => {
          setOpen(false);
          callback(newValue);
        },
      });
    } else {
      callback(newValue);
    }
  };

  const handleExtraTabs = (label) => {
    handleOnChange(null, label, navigateExtraTabs);
  };

  const handleOpenSmartBoqBuilder = (entity) => {
    setSmartBoqModal({
      open: true,
      packageId: entity?.id ?? null,
      packageName: entity?.tender?.label || '',
    });
  };

  const handleCloseSmartBoqBuilder = () => {
    setSmartBoqModal((prev) => ({ ...prev, open: false }));
  };

  const handleGenerateWithAI = async (file, selectedSheets = []) => {
    const { packageId, packageName } = smartBoqModal;
    if (!packageId) {
      throw new Error('Missing package id');
    }
    const formData = buildGenerateBoqFormData({
      file,
      selectedSheets,
      packageName,
      packageId,
    });
    const result = await dispatch(
      actions.generateBoqWithAI({ packageId, body: formData })
    );
    if (generateBoqWithAI.rejected.match(result)) {
      throw result.error || new Error(String(result.payload || 'generate failed'));
    }
    if (
      generateBoqWithAI.fulfilled.match(result) &&
      typeof result.payload === 'string'
    ) {
      throw new Error(result.payload);
    }
    if (result?.error) {
      throw result.error;
    }
    return result;
  };

  useEffect(() => {
    if (!smartBoqModal.open) return;
    handleCloseSmartBoqBuilder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, extraTabValue]);

  const hasManyTabs = tabsArray.length > MAX_TABS;
  const extraTabsProps = {
    ...(hasManyTabs && {
      variant: 'scrollable',
      scrollButtons: true,
      allowScrollButtonsMobile: true,
    }),
  };

  return (
    <>
      <Modal
        open={open}
        setOpen={setOpen}
        style={modalSx}
        cancelStyleProp={newBoqModalCancelSx}
        acceptStyleProp={newBoqModalAcceptSx}
      />
      {smartBoqModal.open ? (
        <SmartBoqBuilderModal
          key={smartBoqModal.packageId}
          open
          onClose={handleCloseSmartBoqBuilder}
          onGenerate={handleGenerateWithAI}
          packageName={smartBoqModal.packageName}
        />
      ) : null}
      {Boolean(data) && (
        <Add
          data={data}
          myRef={myRef}
          entities={entities}
          reset={reset}
          navigateAfterAdding={navigateAfterAdding}
        />
      )}
      <Box
        sx={{
          width: '100%',
        }}
      >
        {Boolean(loading?.message) &&
        !['loading boq list', 'updating boq entity'].includes(
          String(loading.message || '').toLowerCase()
        ) ? (
          <Loading status={loading.message} />
        ) : null}
        <>
            <Box
              sx={{
                backgroundColor: white,
                border: `1px solid ${clinkLightPurple}`,
                borderRadius: '8px',
              }}
            >
              <AppBar
                position="static"
                sx={{
                  backgroundColor: white,
                  color: darkCharcoal,
                  minHeight: 'auto',
                  borderRadius: '8px',
                  boxShadow: 'none',
                }}
              >
                <Grid container justifyContent="space-between">
                  <Grid item xs={3} sm={2} lg={1}>
                    <SummaryTab
                      handleTabClick={handleExtraTabs}
                      sx={summaryLower === extraTabValue ? selectedSx : {}}
                    />
                  </Grid>
                  <Grid item xs={6} sm={8} lg={9.8}>
                    <Tabs
                      value={tabValue}
                      onChange={handleOnChange}
                      aria-label="tabs boq"
                      {...extraTabsProps}
                      sx={{
                        backgroundColor: white,
                        color: darkCharcoal,
                        borderRadius: '8px',
                        '& .MuiTabs-root': {
                          paddingBottom: 0,
                        },
                        '& .MuiTab-root': {
                          color: darkCharcoal,
                        },
                        '& .Mui-selected.MuiTab-root': {
                          color: boqAccent,
                        },
                        '& .MuiTabs-indicator': {
                          backgroundColor: boqAccent,
                        },
                      }}
                    >
                      {tabsArray.map((tab) => (
                        <Tab key={tab.label} label={tab.label} />
                      ))}
                    </Tabs>
                  </Grid>
                  <Grid item xs={3} sm={2} lg={1.2}>
                    <AddTab
                      handleTabClick={handleExtraTabs}
                      sx={addLower === extraTabValue ? selectedSx : {}}
                    />
                  </Grid>
                </Grid>
              </AppBar>
            </Box>
            {!extraTabValue &&
              hasEntities &&
              typeof tabValue !== 'number' && <TabContentSkeleton />}
            {!extraTabValue &&
              hasEntities &&
              tabsArray.map((tab, index) => (
                <TabPanel key={tab.label} value={tabValue} index={index}>
                  {tab.entity != null ? (
                    <Container
                      key={tab.entity.id}
                      slug={tab.slug}
                      entity={tab.entity}
                      theme={tab.theme}
                      units={tab.units}
                      projectStatuses={tab.projectStatuses}
                      enable={tabValue === index}
                      onOpenSmartBoqBuilder={handleOpenSmartBoqBuilder}
                    />
                  ) : (
                    <TabContentSkeleton />
                  )}
                </TabPanel>
              ))}
            {extraTabValue &&
              extraTabContent(hasEntities, navigateToTenderId, isBoqListLoading) && (
              <TabPanel value={0} index={0}>
                  {
                    extraTabContent(hasEntities, navigateToTenderId, isBoqListLoading)[
                      extraTabValue
                    ]
                  }
                </TabPanel>
            )}
        </>
      </Box>
    </>
  );
};

export { BoqHeader, resolvePackageTabIndex };
