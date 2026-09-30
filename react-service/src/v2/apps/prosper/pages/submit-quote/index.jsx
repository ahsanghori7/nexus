import React, { useEffect, useState } from 'react';
import isEqual from 'lodash/isEqual';
import isArray from 'lodash/isArray';
import { useParams } from 'react-router-dom';
import { goTo } from 'v2/helpers/url';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import i18next from 'v2/helpers/i18n';
import DataGrid from 'v2/apps/shared/components/boq/data-grid';
import columnsGrid from 'v2/apps/shared/components/boq/ProsperConfig';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import InfoModal from 'v2/apps/shared/components/InfoModal';
import {
  SubmitQuoteHeader,
  HeaderTextarea,
  ExclusionNote,
  Footer,
} from './mui.styled';
import Loading from 'v2/apps/shared/components/Loading';
import FileUploader from './FileUploader';
import { modalSx, acceptStyle, cancelStyle } from './style';
import { CONSTANTS } from 'clink-components';

const { white } = CONSTANTS.colors.general;

const ITEM = 'item';
const DELETE_STATUS = 4;
const GROUPED_HEADING = 'grouped_heading';
const acceptedColumns = ['__reorder__', 'item_no', 'description', 'actions'];

const buttonSx = {
  padding: '10px 12px 6px 12px',
  width: '80px',
  margin: '12px 12px 12px 0',
};
const buttonContainerSx = {
  backgroundColor: white,
  border: '1px solid rgba(224, 224, 224, 1)',
  borderTopLeftRadius: '6px',
  borderTopRightRadius: '6px',
  borderBottom: 0,
};

const SubmitQuote = ({
  boq,
  subcontractor,
  dispatch,
  contextType = 'prosper',
}) => {
  const context = useContext(contextType);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [files, setFiles] = useState([]);
  const [hasFiles, setHasFiles] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [updatedEntries, setUpdatedEntries] = useState([]);
  const { actions } = context;
  const {
    units,
    entity = {},
    loadedQuotes,
    loading,
    published,
    quotes,
    editingQuote,
  } = boq;
  const [currentQuote] = quotes && quotes.length ? quotes : [];

  const hasPublishedVersion = Boolean(currentQuote?.status_id) || false;
  const { accountId } = subcontractor;
  const saved = entity?.saved ?? false;
  const sent = entity?.sent ?? false;
  const tenderId = entity && entity.tender_id ? entity.tender_id : false;
  const nextEntries = entity ? entity.nextEntries : {};

  const totalPrice =
    updatedEntries && isArray(updatedEntries) && updatedEntries.length
      ? updatedEntries.reduce(
          (total, entry) =>
            entry.type === 'item'
              ? (entry.price || Number(entry.quantity) * Number(entry.rate)) +
                total
              : total,
          0
        )
      : 0;
  const text = (entity && entity.note && entity.note.text) || '';
  const exclusionNote = entity?.exclusion_note || '';
  const programmeWeeks = entity?.programme_weeks || '';
  const originalQuoteExclusion = entity && entity.original_quote_exclusion;
  const originalProgramme = entity?.original_programme || '';

  const [programme, setProgramme] = useState(
    entity?.programme || programmeWeeks?.text || ''
  );

  const [quoteExclusion, setQuoteExclusion] = useState(
    entity?.quote_exclusion || exclusionNote?.text || ''
  );
  useEffect(() => {
    if (entity) {
      setProgramme(entity.programme);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.programme]);

  useEffect(() => {
    if (entity) {
      setQuoteExclusion(entity.quote_exclusion);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.quote_exclusion]);

  const hasEntryChanges =
    entity &&
    entity.nextEntries &&
    entity.entries &&
    !isEqual(entity.nextEntries, entity.entries);

  const hasQuoteExclusionChanges = quoteExclusion !== originalQuoteExclusion;
  const hasProgrammeChanges = programme !== originalProgramme;

  const editedQuote =
    hasEntryChanges || hasQuoteExclusionChanges || hasProgrammeChanges;

  const callback = (value) =>
    dispatch(actions.setSubmitQuoteVars({ key: 'saved', value }));

  const { slug, tid } = useParams();

  useEffect(() => {
    if (slug && tid) {
      dispatch(
        actions.fetchBoQByTenderId({
          keepLoading: true,
          projectSlug: slug,
          tid,
        })
      );
      dispatch(actions.fetchUnits());
      dispatch(actions.fetchProjectStatuses());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, tid]);

  useEffect(() => {
    if (entity && entity.id && !loadedQuotes) {
      dispatch(actions.fetchBoQQuotes(entity.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  useEffect(() => {
    if (entity && entity.entries) {
      setEntries(entity.entries);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedQuotes]);

  useEffect(() => {
    if (quotes && quotes.length) {
      const [quote] = quotes;
      const { document = [] } = quote;
      setFiles(document);
    }
  }, [quotes]);

  const isEditable = (params) => {
    if (sent && hasPublishedVersion && !editingQuote) {
      return false;
    }
    if (params) {
      const { row } = params;
      const { type } = row;
      return type === ITEM;
    }
    return true;
  };

  const handleUpdateBoQ = () => {
    const formData = new FormData();
    [...updatedEntries].forEach((e, i) => {
      formData.append(`quoteItems[${i}]['id']`, e.boq_quote_item_id || null);
      formData.append(`quoteItems[${i}]['boq_item_id']`, e.id);
      formData.append(`quoteItems[${i}]['rate']`, Number(e.rate));
    });
    formData.append(`programme[id]`, programmeWeeks?.id || 0);
    formData.append(`programme[text]`, programme || '');
    formData.append(`note[id]`, exclusionNote?.id || 0);
    formData.append(`note[text]`, quoteExclusion || '');
    return dispatch(
      actions.quoteItems({ boq_id: entity.id, sid: accountId, body: formData })
    )
      .then(() => {
        const formDataFiles = new FormData();
        [...files].forEach((f, i) => {
          const { file } = f;
          formDataFiles.append(`document[${i}]`, file);
        });
        [...deletedFiles].forEach((deleteFileId, i) => {
          formDataFiles.append(`delete_document[${i}]`, deleteFileId);
        });
        return dispatch(
          actions.quoteItemsDocs({
            boq_id: entity.id,
            sid: accountId,
            body: formDataFiles,
          })
        );
      })
      .then(() => callback(true));
  };

  const handlePublish = () => {
    if (hasPublishedVersion) {
      setOpen({
        id: 'resend-quote',
        title: 'resend-quote-title',
        navTitle: 'resend-quote',
        cancel: 'cancel',
        confirm: 'confirm',
        backdropClick: true,
        textArea: true,
        handleAccept: (reasonText = '') => {
          dispatch(
            actions.republishQuote({
              boq_id: entity.id,
              sid: accountId,
              reason: reasonText,
            })
          )
            .then(() => dispatch(actions.setEditingQuoteMode({ value: false })))
            .then(() =>
              dispatch(actions.setSubmitQuoteVars({ key: 'sent', value: true }))
            )
            .then(() => setOpen(false));
        },
      });
    } else {
      dispatch(
        actions.publishQuote({ boq_id: entity.id, sid: accountId })
      ).then(() =>
        dispatch(actions.setSubmitQuoteVars({ key: 'sent', value: true }))
      );
    }
  };

  const handleEdit = () => {
    dispatch(actions.setEditingQuoteMode({ value: true }));
  };

  const handleLocalUpdate = (key) => (e) => {
    dispatch(
      actions.setSubmitQuoteVars({
        key,
        value: e.target.value,
      })
    );
    callback(false);
  };

  const setRows = (rows) => dispatch(actions.setSelectedEntries({ rows }));

  return (
    <>
      {loading && loading.message ? (
        <Loading status={loading.message} />
      ) : (
        <Grid m="auto" pl={10} pr={10}>
          <Grid sx={buttonContainerSx} container justifyContent="end">
            {!editingQuote && hasPublishedVersion ? (
              <Grid item>
                <Button sx={buttonSx} variant="outlined" onClick={handleEdit}>
                  {i18next.t('edit')}
                </Button>
              </Grid>
            ) : (
              <Grid item>
                <Button
                  sx={buttonSx}
                  variant="outlined"
                  onClick={handleUpdateBoQ}
                  disabled={hasPublishedVersion && !editedQuote && !hasFiles}
                >
                  {i18next.t('save')}
                </Button>
                <Button
                  sx={buttonSx}
                  variant="contained"
                  color="secondary"
                  onClick={handlePublish}
                  disabled={!saved}
                >
                  {i18next.t(hasPublishedVersion ? 'resend' : 'send')}
                </Button>
              </Grid>
            )}
          </Grid>
          <SubmitQuoteHeader>
            {i18next.t('boq-tender-notes-title')}
          </SubmitQuoteHeader>
          <HeaderTextarea
            value={text}
            customStyles={{ borderTop: 0 }}
            rows={4}
            readOnly
          />
          <DataGrid
            useRows={[nextEntries, setRows]}
            columns={columnsGrid}
            entries={entries}
            units={units}
            isCellEditable={isEditable}
            getRowClassName={(params) => {
              let extraClasses = '';
              if (params) {
                const { row } = params;
                const status = row && row.status;
                extraClasses =
                  Number(status) === DELETE_STATUS ? ' hide-row' : '';
              }
              return `boq--${params.row.type}${extraClasses}`;
            }}
            rowReordering={false}
            updatedEntriesCallback={setUpdatedEntries}
            callback={() => callback(false)}
            noAction
            hideFooter
            isProsper
            getCellClassName={(params) => {
              if (params) {
                const { row, field } = params;
                const { type } = row;
                const showCell =
                  field === '__reorder__' ||
                  field === 'description' ||
                  type === ITEM ||
                  (acceptedColumns.includes(field) && type === GROUPED_HEADING);
                if (showCell) {
                  return 'show';
                }
              }
              return 'hide';
            }}
          />
          <Footer
            programme={programme}
            setProgramme={handleLocalUpdate('programme')}
            total={totalPrice}
            readOnly={hasPublishedVersion && !editingQuote}
          />
          <ExclusionNote
            text={quoteExclusion}
            onChange={handleLocalUpdate('quote_exclusion')}
            readOnly={hasPublishedVersion && !editingQuote}
          />
          <FileUploader
            readOnly={hasPublishedVersion && !editingQuote}
            files={files}
            setFiles={setFiles}
            setHasFiles={setHasFiles}
            deletedFiles={deletedFiles}
            setDeletedFiles={setDeletedFiles}
          />
        </Grid>
      )}
      <Modal
        open={open}
        setOpen={setOpen}
        style={modalSx}
        acceptStyleProp={acceptStyle}
        cancelStyleProp={cancelStyle}
      />
      {published && (
        <InfoModal
          theme="c-link"
          message={i18next.t('quote-successfully-sent')}
          closeLabel={i18next.t('close')}
          disableEscapeKeyDown
          onHidden={() => {
            let url = '/projects/enquiries';
            if (tenderId) {
              url = `/projects/enquiries?enquiry_id=${tenderId}`;
            }
            goTo(url);
          }}
        />
      )}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    subcontractor: state.subcontractor,
    boq: state.boq,
  };
};

export default connect(mapStateToProps)(SubmitQuote);
