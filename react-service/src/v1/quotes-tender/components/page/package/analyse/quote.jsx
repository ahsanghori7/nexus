/**
 * Legacy header "Analyse Quote with AI" control.
 * Tender run/poll logic is mirrored in TenderAnalysisToolCard + useTenderAnalysisPoll.
 */
import React, { useEffect, useState } from 'react';
import i18next from 'v2/helpers/i18n';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useContext } from 'hooks/context';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import classes from 'v1/quotes-tender/Common';

const SECONDS = 10;
const AnalyseQuote = ({ tid, label, dispatch, useModal = [], analysis, hasMoreThanFiveQuotes, aiState }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();

  const handleOpenConfirmModal = () => setOpenConfirmModal(true);
  const handleCloseConfirmModal = () => setOpenConfirmModal(false);

  const handleMenuClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const { seconds, currentTender } = analysis;
  // eslint-disable-next-line no-unused-vars
  const [__, setOpen] = useModal;
  const context = useContext('clink');
  const { actions } = context;
  const styles = classes('red')
  // Retrieve existing data from localStorage
  const existingData = JSON.parse(localStorage.getItem('analyseQuote')) || [];
  const analysisStarted = existingData.includes(tid);

  useEffect(() => {
    let interval;
    if (Number(tid) === Number(currentTender)) {
      if (seconds > 0) {
        interval = setInterval(() => {
          dispatch(actions.setSeconds(seconds - 1));
        }, 1000);
      }
      if (seconds === 0) {
        dispatch(actions.analyseFetch({ tid })).then((e) => {
          const { payload } = e;
          const pendingData =
            payload &&
            (payload.status === 'STARTED' || payload.status === 'PENDING');
          if (pendingData) {
            dispatch(actions.setSeconds(SECONDS));
          } else {
            dispatch(actions.setSeconds(-1));
          }
        });
      }
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const handleClick = (event, skipCheck = false) => {
    event.preventDefault();
    event.stopPropagation();

    if (hasMoreThanFiveQuotes) {
      // Set modal state
      setOpen({
        id: 'ai-warning',
        navTitle: 'ai-warning',
        children: i18next.t('ai-warning-text'),
        backdropClick: true,
      });
      return;
    }

    // Set modal state
    setOpen({
      id: 'analyse-quote-with-ai',
      navTitle: 'ai-analysis-in-progress',
      title: label || t('ai-quote-analysis-title-fallback'),
      description: t('ai-quote-analysis-in-progress'),
      backdropClick: true,
      callbackClose: () => dispatch(actions.setAnalysisDataReset()),
    });

    dispatch(actions.setCurrentTender(tid));
    // Check if tid already exists in the array
    if (skipCheck || !analysisStarted) {
      dispatch(actions.analyseStart({ tid, reset: skipCheck })).then((e) => {
        if (e.type !== 'ai/analyseStart/rejected') {
          dispatch(actions.analyseFetch({ tid })).then(() =>
            dispatch(actions.setSeconds(SECONDS)),
          );
        }
      });
    } else {
      dispatch(actions.analyseFetch({ tid })).then(() =>
        dispatch(actions.setSeconds(SECONDS)),
      );
    }
  };

  const restartAnalysis = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenConfirmModal();
  };

  const handleConfirmRestartAnalysis = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleMenuClose(); // Close the menu
    handleCloseConfirmModal(); // Close the confirmation modal
    handleClick(e, true); // Proceed with the original action
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  // Empty state - hide button completely
  if (aiState === 'empty') {
    return null;
  }

  // Ineligible state - show disabled button with tooltip
  if (aiState === 'ineligible') {
    return (
      <Box
        sx={[styles.baseStyles, styles.disabledStyles]}
        role="button"
        tabIndex={0}
        aria-label={i18next.t('analyse-quote-with-ai')}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e);
          }
        }}
      >
        {i18next.t('analyse-quote-with-ai')}
      </Box>
    );
  }

  if (!analysisStarted) {
    return (
      <Box
        sx={[styles.baseStyles]}
        role="button"
        tabIndex={0}
        aria-label={i18next.t('analyse-quote-with-ai')}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e);
          }
        }}
      >
        {i18next.t('analyse-quote-with-ai')}
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={[styles.baseStyles]}
        role="button"
        tabIndex={0}
        aria-label={i18next.t('view-ai-results')}
        onClick={handleMenuClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleMenuClick(e);
          }
        }}
      >
        {i18next.t('view-ai-results')}
      </Box>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={handleClick}>View</MenuItem>
        <MenuItem onClick={restartAnalysis}>Restart analysis</MenuItem>
      </Menu>
      <Modal
        open={openConfirmModal}
        onClose={handleCloseConfirmModal}
        aria-labelledby="restart-analysis-modal-title"
        aria-describedby="restart-analysis-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="restart-analysis-modal-title" variant="h6" component="h2">
            {i18next.t('confirm-restart-analysis-title', 'Confirm Restart Analysis')}
          </Typography>
          <Typography id="restart-analysis-modal-description" sx={{ mt: 2 }}>
            {i18next.t('confirm-restart-analysis-message', 'Are you sure you want to restart the analysis? This action cannot be undone and the previous analysis will be erased..')}
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseConfirmModal} sx={{ mr: 1 }}>
              {i18next.t('cancel', 'Cancel')}
            </Button>
            <Button onClick={handleConfirmRestartAnalysis} variant="contained" color="primary">
              {i18next.t('confirm', 'Confirm')}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default connect()(AnalyseQuote);
