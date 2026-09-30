import React, { useCallback } from 'react';
import { useContext } from 'v2/hooks/context';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import { CONSTANTS } from 'clink-components';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import AwardSVG from 'v1/quotes-tender/public/images/svg/award.svg';
import PanelAccordion from 'v1/global/components/layout/panel/PanelAccordion';
import AddQuote from './quotes/modal/add';
import Quotes from './quotes';
import MuiComparisonButton from './MuiComparisonButton';
import AnalysisTable from './analyse/table';
import AnalysisErrorView from './analyse/AnalysisErrorView';
import normalizeAnalysisError from './analyse/normalizeAnalysisError';
import {
  analyseFetch,
  analyseStart,
  setAnalysisDataReset,
  setSeconds,
  setCurrentTender,
} from 'v2/store/reducers/clink/analyse-quote';
import { Box } from '@mui/material';
import classes from 'v1/quotes-tender/Common';
import AnalysisToolsPanel from './analyse/AnalysisToolsPanel';
import resolvePackageModalAnalysis from './analyse/resolvePackageModalAnalysis';
import { resolveAnalysisModalOpen } from './analyse/buildQuoteAnalysisSummaryModalNavTitle';
import checkAIEligibility from 'v2/helpers/aiState';
import Snackbar from '@mui/material/Snackbar';

const UNKNOWN_SUBCONTRACTOR = 'Non C-Link Subcontractor';
const MOBILE_WIDTH = 1200;
const ANALYSIS_POLL_SECONDS = 10;
const { clinkGreen } = CONSTANTS.colors.general;

const baseStyles = {
  width: '1000px',
  maxHeight: '100vh',
};

/** Merge live analysis status into the AI modal config (open state is set once from AnalyseQuote). */

const hasAtLeastTwoBoqQuotes = (quotes) => {
  const boqQuotes = Object.values(quotes).filter(
    (quote) => quote.has_boq_quotes,
  );
  return boqQuotes.length >= 2;
};

const PackageHeader = (props) => {
  const context = useContext('clink');
  const styles = classes('green');

  const { actions } = context;
  const {
    label,
    awarded,
    awardedTo,
    pid,
    tid,
    quotes,
    filteredQuotes,
    mobileView,
    init,
    slug,
    flagBoq,
    showComparisonButton,
    dispatch,
    snackbarMessage,
    snackbarSeverity,
    closeSnackbar,
  } = props;

  const awardedNormally = Object.keys(filteredQuotes).filter((quote) => {
    const { order_price: orderPrice } = quotes[quote];
    const isAwardedToQuote = parseFloat(orderPrice) > 0;
    return isAwardedToQuote;
  });

  const quote = Object.values(filteredQuotes).find((fq) => fq.order_price > 0);
  const handleOnClickAward = useCallback(
    (e) => {
      e.stopPropagation();
      if (quote?.id) {
        dispatch(
          actions.withdrawAward({
            id: quote.id,
            tid,
            pid,
          }),
        );
      }
    },
    [quote?.id, dispatch, actions, tid, pid],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Grid2 container spacing={2} justifyContent="space-between" width="100%">
        <Grid2 container>
          {awarded && (
            <Grid2>
              <AwardSVG />
            </Grid2>
          )}
          <Grid2>
            <Typography
              variant="h2"
              sx={{
                margin: 0,
                fontSize: '1.4rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Typography>
            {awarded && (
              <Typography
                variant="p"
                sx={{
                  whiteSpace: 'nowrap',
                }}
              >
                <b
                  style={{
                    color: clinkGreen,
                  }}
                >
                  Package Awarded:
                </b>{' '}
                {awardedNormally.length ? awardedTo : ''}
              </Typography>
            )}
          </Grid2>
        </Grid2>
        <Grid2 container spacing={1}>
          {!mobileView && mobileView !== 0 && (
            <>
              {showComparisonButton && flagBoq && (
                <Grid2>
                  <MuiComparisonButton slug={slug} tid={tid} />
                </Grid2>
              )}
              {!awarded && (
                <Grid2 onClick={(e) => e.stopPropagation()}>
                  <AddQuote
                    pid={pid}
                    tid={tid}
                    init={init}
                    slug={slug}
                    label={label}
                  />
                </Grid2>
              )}
            </>
          )}
          {awarded && (
            <Grid2>
              <Box
                sx={[styles.baseStyles]}
                role="button"
                tabIndex={0}
                aria-label="Unaward"
                onClick={handleOnClickAward}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleOnClickAward(e);
                  }
                }}
              >
                Unaward
              </Box>
            </Grid2>
          )}
        </Grid2>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={Boolean(snackbarMessage)}
          autoHideDuration={5000}
          onClose={closeSnackbar}
        >
          <Alert
            onClose={closeSnackbar}
            severity={snackbarSeverity}
            sx={{ width: '100%', whiteSpace: 'pre-line' }}
            elevation={6}
            variant="filled"
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Grid2>
    </Box>
  );
};

class Package extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowWidth: 0,
      filter: false,
      openModal: false,
      snackbarMessage: '',
      snackbarSeverity: '',
    };

    this.getFilteredQuotes = this.getFilteredQuotes.bind(this);
    this.isFilteredQuote = this.isFilteredQuote.bind(this);
    this.toggleFilter = this.toggleFilter.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.useModal = this.useModal.bind(this);
    this.showSnackbar = this.showSnackbar.bind(this);
    this.closeSnackbar = this.closeSnackbar.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    this.setState({ windowWidth: window.innerWidth });
  }

  handleRetryAnalysis(tid) {
    const { dispatch } = this.props;
    dispatch(setAnalysisDataReset());
    dispatch(setCurrentTender(tid));
    return dispatch(analyseStart({ tid, reset: true })).then((e) => {
      if (e.type !== 'ai/analyseStart/rejected') {
        return dispatch(analyseFetch({ tid })).then(() =>
          dispatch(setSeconds(ANALYSIS_POLL_SECONDS)),
        );
      }

      return e;
    });
  }

  getAwardedToName(quotes) {
    for (const q in quotes) {
      if ({}.hasOwnProperty.call(quotes, q)) {
        const { order_price: orderPrice, subcontractor } = quotes[q];
        if (parseFloat(orderPrice) > 0) {
          const { name } = subcontractor;
          return name;
        }
      }
    }
    return UNKNOWN_SUBCONTRACTOR;
  }

  getFinalPrice(packageAwarded, price, orderPrice) {
    return packageAwarded && parseFloat(orderPrice) > 0 ? orderPrice : price;
  }

  getFilteredQuotes() {
    const { tender } = this.props;
    const { awarded, quotes } = tender;
    const filteredQuotes = {};

    Object.keys(quotes).forEach((quote) => {
      if (!this.isFilteredQuote(quotes[quote])) {
        const { price, order_price: orderPrice } = quotes[quote];
        filteredQuotes[quote] = {
          ...quotes[quote],
          priceToShow: this.getFinalPrice(awarded, price, orderPrice),
        };
      }
    });

    return filteredQuotes;
  }

  useModal(openModal) {
    this.setState({ openModal });
  }

  isFilteredQuote(quote) {
    const { filter } = this.state;
    let filtered = false;
    if (filter !== false) {
      const { compliant, order_price: orderPrice } = quote;
      if (filter === true) {
        const orderPriceFloat = parseFloat(orderPrice);
        if (orderPriceFloat === 0 || isNaN(orderPriceFloat)) {
          filtered = true;
        }
      } else if (filter !== compliant) {
        filtered = true;
      }
    }

    return filtered;
  }

  /**
   * If the same filter has been clicked, then disable the filter, else use new filter
   * @param filter
   */
  toggleFilter(filterValue) {
    this.setState((prev) => {
      return prev.filter === filterValue
        ? { filter: false }
        : { filter: filterValue };
    });
  }

  showSnackbar(message, severity = 'success') {
    this.setState({
      snackbarMessage: message,
      snackbarSeverity: severity,
    });
  }

  closeSnackbar() {
    this.setState({
      snackbarMessage: '',
    });
  }

  render() {
    const {
      id: idLabel,
      tender,
      project,
      templates,
      init,
      clinkAccount,
      analysis,
      dispatch,
      quoteFiles,
    } = this.props;
    const {
      label,
      id,
      quotes,
      has_boq,
      awarded: awardedValue,
      budget,
    } = tender;
    const awarded = Boolean(awardedValue);
    const { windowWidth, openModal } = this.state;
    const { id: pid, slug } = project;
    const quotesTotal = Object.keys(quotes).length;
    const { features = [] } = clinkAccount;
    const hasFeature =
      Boolean(features?.length) &&
      features.filter((f) => f.name && f.name.toLowerCase() === 'boq');
    const flagBoq = has_boq && Boolean(hasFeature?.length);
    const showComparisonButton = hasAtLeastTwoBoqQuotes(quotes);
    const filteredQuotes = this.getFilteredQuotes();
    const filteredQuotesArray = !isEmpty(filteredQuotes)
      ? Object.values(filteredQuotes)
      : [];
    const hasMoreThanFiveQuotes = filteredQuotesArray.length > 5;
    const { aiState, reasons } = checkAIEligibility(
      quotes,
      has_boq,
      quoteFiles,
      id,
    );
    const {
      analysisData,
      failureData,
      hasData,
      analysisError,
    } = resolvePackageModalAnalysis({
      packageId: id,
      openModal,
      analysis,
    });
    const normalizedError =
      failureData && analysisData ? normalizeAnalysisError(analysisData) : null;

    const analysisModalStyle = hasData ? baseStyles : { minWidth: '500px' };
    const resolvedOpenModal = resolveAnalysisModalOpen(openModal, { hasData });

    return (
      <>
        {!has_boq && (
          <Modal
            open={resolvedOpenModal}
            setOpen={this.useModal}
            style={analysisModalStyle}
          >
            {openModal?.children}
            {!openModal?.children && analysisError && (
              <Alert severity="error" sx={{ whiteSpace: 'pre-line' }}>
                {analysisError}
              </Alert>
            )}
            {!openModal?.children && failureData && normalizedError && (
              <AnalysisErrorView
                primaryMessage={normalizedError.primaryMessage}
                suggestions={normalizedError.suggestions}
                errorType={normalizedError.errorType}
                technicalDetails={normalizedError.technicalDetails}
                onRetry={() => this.handleRetryAnalysis(id)}
              />
            )}
            {!openModal?.children && hasData && (
              <AnalysisTable data={analysisData} packageId={id} />
            )}
          </Modal>
        )}
        <PanelAccordion
          key={id}
          id={idLabel}
          title={
            <PackageHeader
              pid={pid}
              tid={id}
              label={label}
              quotes={quotes}
              awarded={awarded}
              filteredQuotes={filteredQuotes}
              awardedTo={awarded ? this.getAwardedToName(quotes) : ''}
              mobileView={Boolean(windowWidth && windowWidth < MOBILE_WIDTH)}
              init={init}
              slug={slug}
              flagBoq={flagBoq}
              showComparisonButton={showComparisonButton}
              dispatch={dispatch}
              snackbarMessage={this.state.snackbarMessage}
              snackbarSeverity={this.state.snackbarSeverity}
              closeSnackbar={this.closeSnackbar}
            />
          }
          defaultExpanded
        >
          <AnalysisToolsPanel
            key={`analysis-tools-${id}-${aiState}-${quotesTotal}`}
            tid={id}
            label={label}
            aiState={aiState}
            reasons={reasons}
            useModal={[openModal, this.useModal]}
            hasMoreThanFiveQuotes={hasMoreThanFiveQuotes}
            quoteCount={filteredQuotesArray.length}
            dispatch={dispatch}
          />
          <Quotes
            tid={id}
            awarded={awarded}
            pid={pid}
            templates={templates}
            quotes={quotes}
            quotesTotal={quotesTotal}
            toggleFilter={this.toggleFilter}
            filteredQuotes={filteredQuotes}
            hasBoq={has_boq}
            flagBoq={flagBoq}
            budget={budget}
            showSnackbar={this.showSnackbar}
          />
          {Boolean(windowWidth && windowWidth < MOBILE_WIDTH) && (
            <div className="mobile-btn-wrapper">
              <div className="add-quote">
                {showComparisonButton && flagBoq && (
                  <MuiComparisonButton slug={slug} tid={id} />
                )}
                {!awarded && (
                  <AddQuote
                    pid={pid}
                    tid={id}
                    init={init}
                    slug={slug}
                    label={label}
                  />
                )}
              </div>
            </div>
          )}
        </PanelAccordion>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  analysis: state.analysis,
  quoteFiles: state?.quotesTender?.quoteFiles || {},
});

export default connect(mapStateToProps)(Package);
