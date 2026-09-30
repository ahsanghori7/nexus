import React, { useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { HOOKS, CONSTANTS } from 'clink-components';
import { useContext } from 'hooks/context';
import Grid from '@mui/material/Grid';
import Filter, { FilterContent } from './filters/Filter';
import Filters from './filters';
import OpportunitiesHeader from './OpportunitiesHeader';

const { SM_SCREEN } = CONSTANTS.dimensions;

const FilterHeader = ({ filters, dispatch }) => {
  const context = useContext(global.BASE_DIRS?.V2?.PROSPER || 'prosper');
  const { actions } = context;
  const { selected, list } = filters;
  const { types, phase, trades, regions } = list;
  const refType = useRef(null);
  const refPhase = useRef(null);
  const refTrade = useRef(null);
  const refRegion = useRef(null);
  const refs = {
    type: refType,
    phase: refPhase,
    trades: refTrade,
    region: refRegion,
  };
  const { useWindowDimensions } = HOOKS;
  const { t } = useTranslation();

  const dimensions = useWindowDimensions();
  const yOffset = 5;
  const xOffset = dimensions.width <= SM_SCREEN ? -110 : -170;
  const widthContent = dimensions.width <= SM_SCREEN ? 130 : 200;

  const onSelect = (filter, stateFilter) => {
    dispatch(actions.changeFilter({ filter, stateFilter }));
    refs[stateFilter].current.click();
  };

  return (
    <Grid container justifyContent="space-between">
      <Grid item>
        <OpportunitiesHeader isTitle={false} />
      </Grid>
      <Grid
        item
        sx={{
          width: {
            xs: '100%',
            sm: 'initial',
          },
        }}
      >
        <Filters filterTitle={t('filter-by')}>
          <Filter
            yOffset={yOffset}
            xOffset={xOffset}
            dropdownContentWidth={widthContent}
            ref={refRegion}
            label={
              selected && selected.region ? (
                <span className="max-width-filter">
                  {selected.region.label}
                </span>
              ) : (
                <span className="max-width-filter">{t('region')}</span>
              )
            }
            content={
              <FilterContent
                selected={selected.region}
                options={regions}
                handleClick={(option) => onSelect(option, 'region')}
              />
            }
          />
          <Filter
            yOffset={yOffset}
            xOffset={xOffset}
            dropdownContentWidth={widthContent}
            ref={refType}
            label={
              selected && selected.type ? (
                <span className="max-width-filter">{selected.type.label}</span>
              ) : (
                <span className="max-width-filter">{t('type')}</span>
              )
            }
            content={
              <FilterContent
                selected={selected.type}
                options={types}
                handleClick={(option) => onSelect(option, 'type')}
              />
            }
          />
          <Filter
            yOffset={yOffset}
            xOffset={xOffset}
            dropdownContentWidth={widthContent}
            ref={refTrade}
            label={
              selected && selected.trades ? (
                <span className="max-width-filter">
                  {selected.trades.label}
                </span>
              ) : (
                <span className="max-width-filter">{t('trades')}</span>
              )
            }
            content={
              <FilterContent
                selected={selected.trades}
                options={trades}
                handleClick={(option) => onSelect(option, 'trades')}
              />
            }
          />
          <Filter
            yOffset={yOffset}
            xOffset={xOffset}
            dropdownContentWidth={widthContent}
            ref={refPhase}
            label={
              selected && selected.phase ? (
                <span className="max-width-filter">{selected.phase.label}</span>
              ) : (
                <span className="max-width-filter">{t('status')}</span>
              )
            }
            content={
              <FilterContent
                selected={selected.phase}
                options={phase}
                handleClick={(option) => onSelect(option, 'phase')}
              />
            }
          />
        </Filters>
      </Grid>
    </Grid>
  );
};

const mapStateToProps = (state) => {
  return {
    filters: state.filters,
  };
};

export default connect(mapStateToProps)(FilterHeader);
