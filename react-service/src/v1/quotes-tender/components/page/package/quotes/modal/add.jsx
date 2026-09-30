import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import AddIcon from '@mui/icons-material/Add';
import SearchSvg from 'v1/global/public/images/svg/icon-search.svg';
import scrollToPackageSection from '../../scrollToPackageSection';

import AddQuoteService from 'v1/quotes-tender/services/add-quote';

import { modalRenderer, formRenderer, ButtonRenderer } from './index';
import { analytics } from 'v1/global/helpers/services';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import classes from 'v1/quotes-tender/Common';

class AddQuote extends React.Component {
  constructor(props) {
    super(props);
    this.state = { contractors: [], loading: false };
    this.addQuoteService = new AddQuoteService();
  }

  componentWillUnmount() {
    this.addQuoteService = null;
  }

  render() {
    const { label, submitQuote, fetchContractors } = this.props;
    const { contractors, loading } = this.state;
    const styles = classes('green');

    return modalRenderer(
      'Add Quote Information',
      `To add a quotation to this package, Choose a Subcontractor and enter quotation details`,
      (buttonProps) => {
        const { handleClick } = buttonProps;
        const clickAndLoad = async (e) => {
          e.stopPropagation();
          this.setState({ loading: true });

          try {
            const contractorsResponse = await fetchContractors();

            if (contractorsResponse && Object.values(contractorsResponse).length) {
              this.setState({ contractors: contractorsResponse?.payload?.data }, () =>
                handleClick(e),
              );
            } else {
              const optionsError = {
                title: 'Cannot Add Quotation',
                message: 'No subcontractors available to add a quotation',
                type: 'error',
              };
              this.addQuoteService.alert({}, null, {}, optionsError);
            }
          } finally {
            this.setState({ loading: false });
          }
        };
        return (
          <Box
            sx={[styles.baseStyles, loading && styles.disabledStyles]}
            role="button"
            tabIndex={loading ? -1 : 0}
            aria-label="Add Quote"
            onClick={!loading ? clickAndLoad : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                clickAndLoad(e);
              }
            }}
          >
            <Box sx={styles.buttonContentStyles}>
              {loading ? (
                <CircularProgress
                  sx={{
                    marginRight: '8px',
                    color: 'inherit',
                  }}
                  size={22}
                />
              ) : (
                <AddIcon />
              )}
              <span>Add quotation</span>
            </Box>
          </Box>
        );
      },
      (addProps) => {
        const { setShow } = addProps;
        const buttons = {
          submitButton: (addButtonProps) =>
            ButtonRenderer('Add quotation', addButtonProps, 'success'),
          closeButton: (closeProps) =>
            ButtonRenderer(
              'Close',
              { ...closeProps, ...{ onClick: () => setShow(false) } },
              'error',
            ),
        };

        const { formFields } = this.addQuoteService;
        let normalized = [];
        if (Array.isArray(contractors)) {
          normalized = contractors;
        } else if (contractors && typeof contractors === 'object') {
          normalized = Object.values(contractors);
        }
        formFields[0].options = normalized.map((c) => ({
          value: c.id,
          label: c.company_name,
        }));
        formFields[0].innerIcon = (
          <SearchSvg className="select-react-icon-placeholder" />
        );

        return formRenderer(this.addQuoteService, buttons, (data) => {
          const newFiles = {};
          data.files.forEach((file, index) => {
            const key = `file${index}`;
            newFiles[key] = file.file;
          });
          const QuoteData = { ...data, ...newFiles };
          delete QuoteData.files;

          QuoteData.subcontractor_id = data.subcontractor_id.value;
          QuoteData.subcontractor_label = data.subcontractor_id.label;

          return analytics(
            'history.quote.added',
            Number(data.subcontractor_id.value),
            submitQuote(QuoteData).then((result) => {
              if (result?.type?.endsWith('/rejected')) {
                return result;
              }
              setShow(false);
              scrollToPackageSection(label);
            }),
          );
        });
      },
      'add-quote-modal',
    );
  }
}

const Wrapper = ({ dispatch, pid, tid, ...rest }) => {
  const context = useContext('clink');
  const { actions } = context;

  const submitQuote = useCallback(
    (data) =>
      dispatch(actions.postQuote({ data, pid, tid })).then((result) => {
        // Per-file metadata rows are written server-side during the upload;
        // refresh them so the File/Uploaded columns populate without a reload.
        // Only refresh on a successful upload — the postQuote thunk resolves
        // with a numeric status on non-200/network failure, so we check that
        // the payload is a JSON object (the response body) before refreshing.
        // A rejected refresh after a failed upload would otherwise clear
        // existing quoteDocuments state and regress the columns until reload.
        if (result?.payload && typeof result.payload === 'object') {
          dispatch(actions.fetchQuoteDocuments(pid));
        }
        return result;
      }),
    [dispatch, actions, pid, tid],
  );

  const fetchContractors = useCallback(
    () => dispatch(actions.fetchAll({ term: rest.label, pid})),
    [dispatch, actions, rest?.label, pid],
  );

  return (
    <AddQuote
      {...rest}
      pid={pid}
      tid={tid}
      submitQuote={submitQuote}
      fetchContractors={fetchContractors}
    />
  );
};

export default connect()(Wrapper);
