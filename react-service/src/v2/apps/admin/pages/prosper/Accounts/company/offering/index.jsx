import React, { useEffect } from 'react';
import uniqBy from 'lodash/uniqBy';
import Subscription from 'v2/helpers/user/subscription';
import { Button, Panel } from 'clink-components';
import AutocompleteMui from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import CircularProgress from '@mui/material/CircularProgress';
import { StyledWithMarginAndLoader, StyledWrapper } from '../Theme.styled';
import { StyledOfferingColumns } from './styled';

const subscriptionHelper = new Subscription();
const CompanyOffering = ({
  id,
  data,
  subcontractor,
  contextType,
  selectOption,
  handleOnSubmit,
  dispatch,
  loading,
  attributes,
}) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;
  const { trades, regions, types } = data;
  const {
    regions: regionsOptions,
    trades: tradesOptions,
    projectType: typesOptions,
    loading1,
    loading2,
    loading3,
  } = attributes;

  useEffect(() => {
    if (!loading1 && !loading2 && !loading3 && !regionsOptions.length) {
      dispatch(actions.fetchAttrRegions());
      dispatch(actions.fetchAttrTrades(id));
      dispatch(actions.fetchAttrProjectType());
    }
  }, [dispatch, actions, id, loading1, loading2, loading3, regionsOptions]);

  const Trades = (
    <AutocompleteMui
      multiple
      filterSelectedOptions
      value={uniqBy(trades, 'label')}
      options={uniqBy(tradesOptions, 'label')}
      label={
        contextType === 'prosper'
          ? t(`profile-add-company-trades`)
          : t(`profile-company-trades`)
      }
      onChange={(event, newValue) => {
        selectOption(newValue, 'trades');
      }}
      data-testid="offering-autocomplete-trades"
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={t('search-trades')}
          data-testid="offering-textfield-trades-search"
        />
      )}
    />
  );
  let handleSelectRegion = (selected) => selectOption(selected, 'regions');
  if (
    subcontractor &&
    subscriptionHelper.isRegional(subcontractor.subscription_id)
  ) {
    handleSelectRegion = () => null;
  }
  const Regions = (
    <AutocompleteMui
      multiple
      filterSelectedOptions
      value={uniqBy(regions, 'label')}
      options={uniqBy(regionsOptions, 'label')}
      label={
        contextType === 'prosper'
          ? t(`profile-add-company-regions`)
          : t(`profile-company-regions`)
      }
      onChange={(event, newValue) => handleSelectRegion(newValue)}
      data-testid="offering-autocomplete-regions"
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={t('search-regions')}
          data-testid="offering-textfield-regions-search"
        />
      )}
    />
  );
  const Types = (
    <AutocompleteMui
      multiple
      filterSelectedOptions
      value={uniqBy(types, 'label')}
      options={uniqBy(typesOptions, 'label')}
      label={
        contextType === 'prosper'
          ? t(`profile-add-company-types`)
          : t(`profile-company-types`)
      }
      onChange={(event, newValue) => selectOption(newValue, 'types')}
      data-testid="offering-autocomplete-types"
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={t('search-types')}
          data-testid="offering-textfield-types-search"
        />
      )}
    />
  );

  const disabled = !(
    trades &&
    regions &&
    types &&
    trades.length &&
    regions.length &&
    types.length
  );
  return (
    <Panel
      id="offering"
      className="offering"
      headerContent={<h2>{t('profile-company-offering')}</h2>}
    >
      <StyledWrapper>
        {contextType === 'prosper' ? (
          <StyledOfferingColumns
            data-testid="trades-column"
            className="offering-column"
          >
            {Trades}
          </StyledOfferingColumns>
        ) : (
          Trades
        )}
        {contextType === 'prosper' ? (
          <StyledOfferingColumns
            data-testid="regions-column"
            className="offering-column"
          >
            {Regions}
          </StyledOfferingColumns>
        ) : (
          Regions
        )}
        {contextType === 'prosper' ? (
          <StyledOfferingColumns
            data-testid="types-column"
            className="offering-column"
          >
            {Types}
          </StyledOfferingColumns>
        ) : (
          Types
        )}
        <StyledWithMarginAndLoader className="offering-save-column">
          {loading && <CircularProgress className="my-company-loading" />}
          <Button
            id="submit-button"
            type="button"
            layout="square"
            color="prosperGreenButton"
            disabled={disabled}
            handleClick={() => handleOnSubmit({ trades, regions, types })}
            data-testid="offering-button-save"
          >
            {t('save')}
          </Button>
        </StyledWithMarginAndLoader>
      </StyledWrapper>
    </Panel>
  );
};

const mapStateToProps = (state) => ({
  attributes: state.attributes,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(CompanyOffering);
