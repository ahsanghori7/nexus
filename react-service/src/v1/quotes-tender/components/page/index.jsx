import React, { useEffect, useMemo } from 'react';
import { useContext } from 'hooks/context';
import 'v1/global';
import 'v1/quotes-tender/public/styles/index.scss';
import { connect } from 'react-redux';
import Grid from '@mui/material/Grid';
import Alert from 'react-bootstrap/Alert';
import Loading from 'v1/global/components/Loading';
import CustomStickyContainer from 'v1/global/components/CustomStickyContainer';
import { getBudgetSummary } from 'v2/store/reducers/clink/project/helper';
import Summary from './Summary';
import Header from './header';
import Package from './package';
import mergeQuotesWithQuoteFiles from './mergeQuotesWithQuoteFiles';

class QuotesAndTenderLegacy extends React.PureComponent {
  componentDidUpdate(prevProps) {
    // Jump to the selected package (#example from url to id="example" div)
    if (
      prevProps.loading !== this.props.loading &&
      !this.props.loading &&
      !this.props.error
    ) {
      this.scrollToPackageFromHash();
    }
  }

  scrollToPackageFromHash() {
    const hash = decodeURIComponent(window.location.hash.substring(1));
    if (hash) {
      const targetElement = document.getElementById(hash);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  render() {
    const {
      clinkAccount,
      project,
      error,
      loading,
      templates,
      quotesData,
      dataToShow,
      summary,
    } = this.props;
    const gia = project?.gia || 0;
    const { id: pid } = project;
    return (
      <Grid container id="qat-container" flexDirection="column">
        {!loading && !error && (
          <Grid item className="page-header">
            <Header gia={gia} pid={pid} quotesData={quotesData} />
          </Grid>
        )}
        {loading && <Loading />}
        {error && (
          <Alert variant="danger">
            An error occurred while fetching the quotes data
          </Alert>
        )}
        {!loading && !error && (
          <Grid item>
            <Summary gia={gia} summary={summary} />
            <CustomStickyContainer
              className="data-component"
              navData={dataToShow}
              content={dataToShow.map((tender) => {
                return (
                  <Package
                    key={tender.id}
                    id={tender.label}
                    templates={templates}
                    project={project}
                    tender={tender}
                    clinkAccount={clinkAccount}
                  />
                );
              })}
            />
          </Grid>
        )}
      </Grid>
    );
  }
}

const Wrapper = ({ project, dispatch, quotesData, files, documents, ...rest }) => {
  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    if (project?.data?.id && project?.data?.name !== quotesData?.name) {
      dispatch(actions.fetchQuoteFiles(project?.data?.id));
      dispatch(actions.fetchQuoteDocuments(project?.data?.id));
      dispatch(actions.fetchQuotes(project?.data?.id));
    }
  }, [project?.data?.id, dispatch, actions, quotesData?.name, project?.data?.name]);

  useEffect(() => {
    dispatch(actions.fetchTemplates());
  }, [dispatch, actions]);

  const newQuotesData = useMemo(
    () => mergeQuotesWithQuoteFiles(quotesData, files, documents),
    [quotesData, files, documents],
  );

  const dataToShow = useMemo(() => {
    if (!newQuotesData?.tenders) {
      return [];
    }
    const tenders = newQuotesData?.tenders || {};
    const response = Object.keys(tenders).filter(
      (tender) => tenders[tender]?.label,
    );
    return response
      .sort(
        (tenderA, tenderB) =>
          (tenders[tenderA] &&
            tenders[tenderA]?.label &&
            tenders[tenderA]?.label
              .toLowerCase()
              .localeCompare(tenders[tenderB].label.toLowerCase())) ||
          '',
      )
      .map((tender) => tenders[tender]);
  }, [newQuotesData?.tenders]);

  const summary = useMemo(() => getBudgetSummary(quotesData), [quotesData]);

  if (!project?.data?.id) {
    return null;
  }
  return (
    <QuotesAndTenderLegacy
      {...rest}
      project={project.data}
      quotesData={newQuotesData}
      dataToShow={dataToShow}
      summary={summary}
    />
  );
};

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
  project: state.project,
  files: state?.quotesTender?.quoteFiles || {},
  documents: state?.quotesTender?.quoteDocuments || {},
  quotesData: state?.quotesTender?.quotesData || {},
  loading: state?.quotesTender?.loading || false,
  error: state?.quotesTender?.error || false,
  templates: state?.templates?.list || [],
});

export default connect(mapStateToProps)(Wrapper);
