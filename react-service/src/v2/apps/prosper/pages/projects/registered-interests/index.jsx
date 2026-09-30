import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import isNil from 'lodash/isNil';
import { useTranslation } from 'react-i18next';
import Filter, {
  FilterContent,
} from 'v2/apps/prosper/pages/projects/filters/Filter';
import Loading from 'v2/apps/shared/components/Loading';
import LoadMore from 'v2/apps/prosper/shared/load_more';
import { useContext } from 'v2/hooks/context';
import Filters from 'v2/apps/prosper/pages/projects/filters';
import Container from 'v2/apps/prosper/pages/projects/Container.styled';
import { StyledRegisteredWrapper } from './styled';
import Interest from './Interest';

const RegisteredInterests = ({
  interests,
  filters,
  dispatch,
  resource,
  method,
  version = 'v1',
}) => {
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;
  const { latest, status: statusInterests } = interests;
  const { selected, list, loaded } = filters;
  const { enquiriesStatus } = list;
  const refStatus = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(actions.fetchInterests({ resource, method }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const enquiryStatusFilters = {
      data: latest.flatMap((interest) => interest.tenderTags),
      stateFilter: 'enquiriesStatus',
      idKey: 'status_id',
      labelKey: 'status',
    };
    dispatch(actions.initFilter(enquiryStatusFilters));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest]);

  const onSelect = (filter) => {
    dispatch(actions.changeFilter({ filter, stateFilter: 'enquiryStatus' }));
    refStatus.current.click();
  };

  const loadMore = () => {
    dispatch(actions.increaseLoaded(latest));
  };

  const interestsToShow = latest.filter((i) =>
    isNil(selected.enquiryStatus)
      ? true
      : i.tenderTags.map((p) => p.status).includes(selected.enquiryStatus.label)
  );

  return (
    <Container className="registered-filters" align="text-align: end">
      <Filters filterTitle={t('filter-by')}>
        <Filter
          yOffset={5}
          xOffset={-140}
          dropdownContentWidth={170}
          ref={refStatus}
          label={
            selected && selected.enquiryStatus ? (
              <span className="max-width-filter">
                {selected.enquiryStatus.label}
              </span>
            ) : (
              <span className="max-width-filter">
                {t('text-interest-status')}
              </span>
            )
          }
          content={
            <FilterContent
              selected={selected.enquiryStatus}
              options={enquiriesStatus}
              handleClick={(option) => onSelect(option)}
            />
          }
        />
      </Filters>
      <Loading status={statusInterests} />
      {!statusInterests && (
        <StyledRegisteredWrapper version={version}>
          {interestsToShow.slice(0, loaded).map((card) => (
            <Interest key={card.id} item={card} version={version} />
          ))}
        </StyledRegisteredWrapper>
      )}
      <LoadMore data={interestsToShow} loaded={loaded} onLoad={loadMore} />
    </Container>
  );
};

const mapStateToProps = (state) => {
  return {
    filters: state.filters,
    interests: state.interests,
  };
};

export default connect(mapStateToProps)(RegisteredInterests);
