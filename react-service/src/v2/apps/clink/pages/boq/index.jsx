import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import useTheme from 'v2/apps/shared/components/muiTheme';
import { useContext } from 'hooks/context';
import { BoqContainer } from 'v2/apps/clink/pages/tender-analysis/styled/mui';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { BoqHeader } from './BoqHeader';

const BOQ = ({ boq, project, dispatch, contextType = 'clink' }) => {
  const myRef = useRef(null);
  const theme = useTheme(contextType);
  const { slug, tid } = useParams();
  const [currentTender, setCurrentTender] = useState(null);
  const context = useContext(contextType);
  const { actions } = context;
  const { entities, loading, units, projectStatuses } = boq;
  const isBoqListLoading = Boolean(
    boq?.uiLoading?.boqList ||
      String(loading?.message || '').toLowerCase() === 'loading boq list'
  );
  const { data } = project;

  useEffect(() => {
    dispatch(actions.fetchBoQList(slug));
    dispatch(actions.fetchUnits());
    dispatch(actions.fetchProjectStatuses());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tid && data) {
      const { tender = [] } = data;
      const [selectedTender] = tender.filter(
        (t) => Number(t.id) === Number(tid)
      );
      setCurrentTender(selectedTender || null);
    }
  }, [tid, data]);

  const hasEntities = entities && Boolean(entities.length);

  // On refresh, `entities=[]` initially. Show a single page-level skeleton until the BoQ list request finishes,
  // to avoid stacking different skeletons (empty-state + cards + grid) as state trickles in.
  if (isBoqListLoading && !hasEntities) {
    return (
      <BoqContainer>
        <Box data-testid="boq-page-skeleton" sx={{ px: 0, py: 2 }}>
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ borderRadius: '12px', mb: 2 }}
          />
          <Skeleton
            variant="rectangular"
            height={520}
            sx={{ borderRadius: '12px' }}
          />
        </Box>
      </BoqContainer>
    );
  }

  const entitiesContent =
    (hasEntities && [
      ...entities.map((entity) => ({
        tid: entity.tender.id || 0,
        label: entity.tender.label || '',
        entity,
        slug,
        theme,
        units,
        projectStatuses,
      })),
    ]) ||
    [];

  return (
    <BoqContainer>
      <BoqHeader
        data={data}
        myRef={myRef}
        currentTender={currentTender}
        slug={slug}
        tabsArray={entitiesContent}
        entities={(hasEntities && entities) || []}
        reset={() => dispatch(actions.fetchBoQList(slug))}
        hasEntities={hasEntities}
        loading={loading}
        isBoqListLoading={isBoqListLoading}
        dispatch={dispatch}
        contextType={contextType}
      />
    </BoqContainer>
  );
};

const mapStateToProps = (state) => {
  return {
    boq: state.boq,
    project: state.project,
    layout: state.layout,
  };
};

export default connect(mapStateToProps)(BOQ);
