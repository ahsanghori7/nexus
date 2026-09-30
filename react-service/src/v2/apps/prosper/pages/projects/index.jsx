import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import isNil from 'lodash/isNil';
import chunk from 'lodash/chunk';
import { useContext } from 'hooks/context';
import { getUrl } from 'v2/helpers/url';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import OpportunityCard from 'v2/apps/shared/components/cards/big/OpportunityCard';
import Loading from 'v2/apps/shared/components/Loading';
import LoadMore from 'v2/apps/prosper/shared/load_more';
import Container from './Container.styled';
import Opportunities from './Opportunities.styled';
import FilterHeader from './FilterHeader';

const CHUNKS = 6;
const Projects = ({
  opportunities,
  filters,
  subcontractor,
  account,
  dispatch,
}) => {
  const [css] = useState({ color: 'black' });
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;
  const { trades: accountTrades } = subcontractor;
  const { projects, status: statusProjects } = opportunities;
  const { distance } = account;
  const { selected, loaded } = filters;
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(actions.fetchOpportunities());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const regionFilters = {
      data: projects,
      stateFilter: 'regions',
      idKey: 'region',
      labelKey: 'region',
    };
    const typeFilters = {
      data: projects,
      stateFilter: 'types',
      idKey: 'type',
      labelKey: 'type',
    };
    const phaseFilters = {
      data: projects,
      stateFilter: 'phase',
      idKey: 'phase',
      labelKey: 'phase',
    };
    dispatch(actions.initFilter(regionFilters));
    dispatch(actions.initFilter(typeFilters));
    dispatch(actions.initFilter(phaseFilters));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  useEffect(() => {
    const tradeFilters = {
      data: Object.keys(accountTrades).map((id) => {
        const [tradeObj] = accountTrades[id];
        return {
          id,
          label: (tradeObj && tradeObj.label) || '',
        };
      }),
      stateFilter: 'trades',
      idKey: 'id',
      labelKey: 'label',
    };
    dispatch(actions.initFilter(tradeFilters));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountTrades]);

  const loadMore = () => {
    dispatch(actions.increaseLoaded(projects));
  };

  const projectsToShow = projects
    .filter((project) => {
      if (!Object.values(project.packages).length) {
        return false;
      }
      const regionFilter = isNil(selected.region)
        ? true
        : project.region === selected.region.label;
      const typeFilter = isNil(selected.type)
        ? true
        : project.type === selected.type.label;
      const statusFilter = isNil(selected.phase)
        ? true
        : project.phase === selected.phase.label;
      const statusTrades = isNil(selected.trades)
        ? true
        : Object.values(project.packages)
            .flatMap((p) => p.packages)
            .includes(Number(selected.trades.id));

      return regionFilter && typeFilter && statusFilter && statusTrades;
    })
    .map((item) => {
      const { packages } = item;
      const newOpportunity = Object.values(packages).some((e) =>
        moment(e.published_at).isAfter(moment().subtract(7, 'days'))
      );
      return { ...item, isNew: newOpportunity };
    })
    .sort((a, b) => {
      if (a.isNew && !b.isNew) {
        return -1;
      }
      if (!a.isNew && b.isNew) {
        return 1;
      }
      return 0;
    });

  useEffect(() => {
    if (projectsToShow.length) {
      const projectsIds = projectsToShow.map((cd) => cd.id);
      Promise.all(
        chunk(projectsIds, CHUNKS).map((ids) =>
          dispatch(actions.distance({ projects: ids }))
        )
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, projects]);

  return (
    <Container className="find-opportunities-filters" align="text-align: end">
      <FilterHeader />
      <Loading status={statusProjects} />
      {!statusProjects && (
        <Opportunities justify={!projectsToShow.length}>
          {!projectsToShow.length && (
            <Typography
                variant="boldTitle"
                component="p"
                sx={{
                  fontSize: '14pt',
                  lineHeight: 1.25,
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: 350,
                  marginTop: 7,
                  ...css,
                }}
              >
                {t('no-opportunities-message-2')}
                <Link href={getUrl('SITE_PROSPER', 'resources')}>
                  {t('resources').toLowerCase()}
                </Link>
              </Typography>
          )}
          {projectsToShow.slice(0, loaded).map((card) => {
            const [distanceData] = distance.filter(
              (d) => Number(d.project_id) === Number(card.id)
            );
            return (
              <OpportunityCard
                key={card.id}
                item={card}
                distanceData={distanceData}
              />
            );
          })}
        </Opportunities>
      )}
      <LoadMore data={projectsToShow} loaded={loaded} onLoad={loadMore} />
    </Container>
  );
};

const mapStateToProps = (state) => {
  return {
    opportunities: state.opportunities,
    filters: state.filters,
    subcontractor: state.subcontractor,
    account: state.account,
  };
};

export default connect(mapStateToProps)(Projects);
