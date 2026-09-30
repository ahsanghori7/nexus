import React, { useState, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import { useParams, useNavigate } from 'react-router-dom';
import downloadPrequal from 'v1/global/helpers/getPrequalDoc';
import Subscription from 'v2/helpers/user/subscription';
import i18next from 'v2/helpers/i18n';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';
import { getCompanyLogo } from 'v2/helpers/user';
import { responseAlert } from 'v1/global/components/clink-alert';
import SubMenuSVG from 'v1/global/public/images/svg/submenu-dropdown.svg';
import moment from 'moment';
import { numToPrice } from 'v1/quotes-tender/helpers/price';
import getQuoteFilesSummary from 'v1/quotes-tender/helpers/quoteFiles';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { AwardPackage, WithdrawAward } from './modal/award';
import IssueOrder from './modal/order';
import EditQuote from './modal/edit';
import DeleteQuote from './modal/delete';
import LazyImage from './LazyImage';

const subscriptionHelper = new Subscription();
let QuoteOptions = (props) => {
  const {
    pid,
    qid,
    isAwardedToQuote,
    packageAwarded,
    compliant,
    zip,
    subcontractor,
    draftInfo,
    tid,
    has_boq_quotes,
    flagBoq,
    can_issue_order,
    dispatch,
    showSnackbar,
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [creatingTR, setCreatingTR] = useState(false);
  const open = Boolean(anchorEl);
  const { checkFeature } = useFeatureFlag();
  const hasTenderRecommendation = checkFeature('TENDER_RECOMMENDATION');
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const canIssueOrder = useMemo(() => {
    if (hasTenderRecommendation) {
      return can_issue_order && !isAwardedToQuote && !packageAwarded;
    }
    return !isAwardedToQuote && !packageAwarded;
  }, [
    can_issue_order,
    hasTenderRecommendation,
    isAwardedToQuote,
    packageAwarded,
  ]);

  const context = useContext('clink');
  const { actions } = context;

  const toggleComplianceCallback = useCallback(() => {
    dispatch(
      actions.toggleCompliant({
        data: { toggle: !compliant },
        id: qid,
        pid,
        tenderId: tid,
      }),
    );
    handleClose();
  }, [dispatch, actions, compliant, qid, pid, tid]);

  const labelCompliant = useMemo(() => {
    return compliant === 0
      ? 'Quotation is compliant'
      : 'Quotation is non-compliant';
  }, [compliant]);

  const { id, type_id: typeId } = subcontractor;
  const { slug } = useParams();
  const navigate = useNavigate();

  const compareQuotes = useCallback(
    () => navigate(`/main-contractor/project/${slug}/boq/${tid}/quote/${qid}`),
    [slug, tid, qid, navigate],
  );

  const viewTenderRecommendation = useCallback(() => {
    if (pid && !creatingTR) {
      setCreatingTR(true);
      dispatch(
        actions.createTenderRecommendationForm({
          project_id: pid,
          data: {
            tender_id: tid,
            transaction_id: qid,
            exec_summary: '',
            final_comment: '',
            status: 'Draft',
          },
        }),
      ).then((res) => {
        if (res?.payload?.id) {
          navigate(
            `/main-contractor/project/${slug}/tender_recommendation/${tid}/${res?.payload?.id}`,
          );
        } else {
          showSnackbar?.(
            res?.payload || i18next.t('new-tender-recommendation-error-message'),
            'error',
          );
        }
      }).finally(() => setCreatingTR(false));
    }
  }, [slug, pid, tid, qid, navigate, actions, dispatch, showSnackbar, creatingTR]);

  const viewQuoteDocument = useCallback(() => {
    if (zip) {
      window.open(zip, '_blank');
    } else {
      const optionsError = {
        title: 'Documents not found',
        message: 'There is no documents for this quote',
        type: 'info',
      };
      responseAlert({ ...optionsError });
    }
  }, [zip]);

  const hasProperAccount = useMemo(
    () => id && typeId && !subscriptionHelper.isExternal(typeId),
    [id, typeId],
  );

  const viewPrequalDocument = useCallback(
    () => (hasProperAccount ? downloadPrequal(id) : null),
    [hasProperAccount, id],
  );

  const addCloseModal = (cb) => () => {
    handleClose();
    cb();
  };
  return (
    <>
      <IconButton
        sx={{ width: 40, height: 40 }}
        aria-label="Quote Options"
        type="button"
        name="quote_options"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <SubMenuSVG />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <EditQuote {...props} handleClose={addCloseModal} tenderId={tid} />
        <MenuItem onClick={toggleComplianceCallback}>{labelCompliant}</MenuItem>
        {canIssueOrder && (
          <IssueOrder
            {...props}
            handleClose={addCloseModal}
            draftInfo={draftInfo}
          />
        )}
        <MenuItem onClick={addCloseModal(viewQuoteDocument)}>
          View quote document
        </MenuItem>
        {hasProperAccount && (
          <MenuItem onClick={addCloseModal(viewPrequalDocument)}>
            View prequal document
          </MenuItem>
        )}
        {has_boq_quotes && flagBoq && (
          <MenuItem onClick={addCloseModal(compareQuotes)}>
            {i18next.t('view-quote')}
          </MenuItem>
        )}

        {hasTenderRecommendation && (
          <MenuItem onClick={addCloseModal(viewTenderRecommendation)} disabled={creatingTR}>
            {creatingTR ? 'Creating...' : 'Create ' + i18next.t('tender-recommendation')}
          </MenuItem>
        )}

        {!isAwardedToQuote && (
          <DeleteQuote {...props} handleClose={addCloseModal} tenderId={tid} />
        )}
      </Menu>
    </>
  );
};

QuoteOptions = connect()(QuoteOptions);

function getFinalPrice(props) {
  const { packageAwarded, price, order_price: orderPrice } = props;
  return packageAwarded && parseFloat(orderPrice) > 0 ? orderPrice : price;
}

// transaction.source values → display labels; null means the quote predates
// source tracking (or per-file capture), so the cells fall back to an em-dash.
const SOURCE_LABELS = {
  'Prosper Submission': 'Prosper',
  'C-Link Upload': 'Manual',
};

const emptyCell = (
  <Typography variant="body2" color="text.secondary">
    —
  </Typography>
);

const Quote = (props) => {
  const context = useContext('clink');
  const { actions } = context;

  const { id, tid, pid, packageAwarded, showSnackbar } = props;
  const {
    id: quoteId,
    measured_work: measuredWork,
    other_items: otherItems,
    prelims,
    price,
    selectedQuote,
    programme,
    subcontractor,
    order_price: orderPrice,
    draft_order,
    draft_documents,
    source,
    filesMeta,
    dispatch,
  } = props;

  const updateSelectedQuote = useCallback(
    (qid, toggle) => {
      dispatch(
        actions.toggledSelected({
          data: { toggle },
          id: qid,
          pid,
          tenderId: tid,
        }),
      );
    },
    [dispatch, actions, pid, tid],
  );

  const handleChange = (e) => {
    e.preventDefault();
    updateSelectedQuote(id, Number(e.target.checked));
    if (Boolean(selectedQuote) && Number(id) !== Number(selectedQuote)) {
      updateSelectedQuote(selectedQuote, 0);
    }
  };

  const name = subcontractor?.name;
  const sid = subcontractor?.id;
  const logo = getCompanyLogo(sid);
  const isAwardedToQuote = parseFloat(orderPrice) > 0;
  const finalPrice = getFinalPrice(props);

  let checked = false;
  if (Number(selectedQuote) && Number(quoteId) === Number(selectedQuote)) {
    checked = true;
  }

  const draftInfo = [draft_order, draft_documents];
  const filesSummary = getQuoteFilesSummary(filesMeta);
  const sourceLabel = source ? SOURCE_LABELS[source] ?? source : null;
  return (
    <TableRow>
      <TableCell>
        <Grid container spacing={2} alignItems="center">
          <Grid>
            <LazyImage
              src={logo}
              alt="Subcontractor logo"
              width={40}
              height={40}
            />
          </Grid>
          <Grid>
            <Typography fontWeight={600}>{name}</Typography>
          </Grid>
        </Grid>
      </TableCell>
      <TableCell>
        {filesSummary ? (
          <Tooltip title={filesSummary.names.join(', ')}>
            <Typography variant="body2">
              {filesSummary.primaryName}
              {filesSummary.extraCount > 0 && ` +${filesSummary.extraCount}`}
            </Typography>
          </Tooltip>
        ) : (
          emptyCell
        )}
      </TableCell>
      <TableCell>
        {filesSummary ? (
          <Typography variant="body2">
            {moment(filesSummary.latestUpload, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY')}
          </Typography>
        ) : (
          emptyCell
        )}
      </TableCell>
      <TableCell>
        {sourceLabel ? (
          <Chip label={sourceLabel} size="small" variant="outlined" />
        ) : (
          emptyCell
        )}
      </TableCell>
      <TableCell>
        <FormControlLabel
          fontWeight={600}
          control={
            <Checkbox
              onChange={handleChange}
              checked={checked}
              value={checked}
              name="price_select"
            />
          }
          label={numToPrice(finalPrice)}
        />
      </TableCell>
      <TableCell>
        <Typography fontWeight={600}>{numToPrice(measuredWork)}</Typography>
      </TableCell>
      <TableCell>
        <Typography fontWeight={600}>{numToPrice(prelims)}</Typography>
      </TableCell>
      <TableCell>
        <Typography fontWeight={600}>{numToPrice(otherItems)}</Typography>
      </TableCell>
      <TableCell>
        <Typography fontWeight={600}>{programme}</Typography>
      </TableCell>
      <TableCell>
        <Grid container spacing={2} alignItems="center">
          <Grid>
            {!packageAwarded && (
              <AwardPackage
                id={id}
                tid={tid}
                pid={pid}
                price={price}
                subcontractor={subcontractor}
              />
            )}
          </Grid>
          <Grid>
            {packageAwarded && isAwardedToQuote && (
              <WithdrawAward id={id} tid={tid} pid={pid} />
            )}
          </Grid>
          <Grid>
            <QuoteOptions
              {...props}
              pid={pid}
              isAwardedToQuote={isAwardedToQuote}
              packageAwarded={packageAwarded}
              draftInfo={draftInfo}
              showSnackbar={showSnackbar}
            />
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
};

export default connect()(Quote);
