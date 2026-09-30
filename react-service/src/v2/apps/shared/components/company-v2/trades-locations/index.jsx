import React, { useEffect, useState } from 'react';
import uniqBy from 'lodash/uniqBy';
import { Box } from '@mui/material';
import SelectDialog from 'v2/apps/shared/components/select';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { MuiSubtitle } from '../Mui.styled';

const { white } = CONSTANTS.colors.general;

const sortSelectedFirst = (selected) => (a, b) => {
  const aIn = selected.includes(a.id);
  const bIn = selected.includes(b.id);

  if (aIn && !bIn) {
    return -1;
  }

  if (!aIn && bIn) {
    return 1;
  }

  return 0;
};

const TradesLocations = ({
  id,
  data,
  contextType,
  handleOnSubmit,
  attributes,
  dispatch,
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
    window.scrollTo(0, 0);
  }, []);

  const [currentValueTrades, setCurrentValueTrades] = useState(trades);
  const [currentValueRegions, setCurrentValueRegions] = useState(regions);
  const [currentValueTypes, setCurrentValueTypes] = useState(types);

  let sortedTrades = [];
  if (currentValueTrades && tradesOptions) {
    const compareTrades = sortSelectedFirst(
      currentValueTrades.map((i) => i.id),
    );
    sortedTrades = [...tradesOptions].sort(compareTrades);
  }

  let sortedRegions = [];
  if (currentValueRegions && regionsOptions) {
    const compareRegions = sortSelectedFirst(
      currentValueRegions.map((i) => i.id),
    );
    sortedRegions = [...regionsOptions].sort(compareRegions);
  }

  let sortedTypes = [];
  if (currentValueTypes && typesOptions) {
    const compareTypes = sortSelectedFirst(currentValueTypes.map((i) => i.id));
    sortedTypes = [...typesOptions].sort(compareTypes);
  }

  useEffect(() => {
    if (!loading1 && !loading2 && !loading3 && !regionsOptions.length) {
      dispatch(actions.fetchAttrRegions());
      dispatch(actions.fetchAttrTrades(id));
      dispatch(actions.fetchAttrProjectType());
    }
  }, [dispatch, actions, id, loading1, loading2, loading3, regionsOptions]);

  const handleTrades = (dataT) => {
    setCurrentValueTrades(dataT);
    handleOnSubmit({
      trades: dataT,
      types: currentValueTypes,
      regions: currentValueRegions,
    });
  };

  const handleTypes = (dataT) => {
    setCurrentValueTypes(dataT);
    handleOnSubmit({
      types: dataT,
      trades: currentValueTrades,
      regions: currentValueRegions,
    });
  };

  const handleRegions = (dataR) => {
    setCurrentValueRegions(dataR);
    handleOnSubmit({
      regions: dataR,
      types: currentValueTypes,
      trades: currentValueTrades,
    });
  };

  return (
    <Box
      sx={{
        marginTop: '20px',
      }}
    >
      <Box
        sx={{
          minHeight: '450px',
          '& .MuiButton-root': {
            padding: 0,
            backgroundColor: white,
            '&:hover': { backgroundColor: white },
          },
        }}
      >
        <MuiSubtitle>{t('trades')}</MuiSubtitle>
        <SelectDialog
          title={t(`trades-cover`, {
            interpolation: { escapeValue: false },
          })}
          options={uniqBy(sortedTrades, 'label')}
          name="trades"
          placeholder={t('find-trade-placeholder', {
            interpolation: { escapeValue: false },
          })}
          defaultValues={currentValueTrades}
          updateValues={handleTrades}
        />
        <MuiSubtitle>{t('locations')}</MuiSubtitle>
        <SelectDialog
          title={t(`locations`)}
          options={uniqBy(sortedRegions, 'label')}
          name="regions"
          placeholder={t('find-trade-placeholder', {
            interpolation: { escapeValue: false },
          })}
          defaultValues={currentValueRegions}
          updateValues={handleRegions}
          disableSearch
          activeSelectAll
        />
        <MuiSubtitle>{t('profile-company-types')}</MuiSubtitle>
        <SelectDialog
          title={t(`project-types-cover`, {
            interpolation: { escapeValue: false },
          })}
          options={uniqBy(sortedTypes, 'label')}
          name="types"
          placeholder={t('find-trade-placeholder', {
            interpolation: { escapeValue: false },
          })}
          defaultValues={currentValueTypes}
          updateValues={handleTypes}
          disableSearch
          activeSelectAll
        />
      </Box>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  attributes: state.attributes,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(TradesLocations);
