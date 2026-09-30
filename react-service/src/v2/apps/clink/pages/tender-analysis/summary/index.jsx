import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import Table from 'v2/apps/shared/components/boq/Table';
import TenderAnalysisConfig, {
  Columns,
} from 'v2/apps/shared/components/boq/TenderAnalysisConfig';
import TenderComparisonConfig, {
  Columns as ComparisonColumns,
} from 'v2/apps/shared/components/boq/TenderComparisonConfig';
import Wrapper from 'v2/apps/clink/pages/boq/content/Wrapper';
import {
  TenderSummaryLeft,
  TenderSummaryRight,
} from 'v2/apps/clink/pages/tender-analysis/styled/mui';
import MuiComparisonTable from './MuiComparisonTable';
import TenderBoqDescription from './TenderBoqDescription';

const getWrapperSummary = (navigate) => (props) => (
  <TenderAnalysisConfig {...props} navigate={navigate} />
);
const getWrapperComparisonSummary = (navigate) => (props) => (
  <TenderComparisonConfig {...props} navigate={navigate} />
);

const Summary = ({
  boq,
  items = [],
  quoteTableItems = [],
  navigate = () => null,
  totalBudget,
}) => {
  const [prepareQuotes, setPrepareQuotes] = useState(false);
  const { entity, orderTemplates } = boq;

  // Stupid hack to avoid table to break grid
  useEffect(() => {
    let timer1 = null;
    if (!isEmpty(quoteTableItems) && !prepareQuotes) {
      timer1 = setTimeout(() => {
        setPrepareQuotes(true);
      }, 900);
    }
    return () => {
      clearTimeout(timer1);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteTableItems]);

  const WrapperSummary = getWrapperSummary(navigate);
  const WrapperComparisonSummary = getWrapperComparisonSummary(navigate);

  // Hack to get item type
  const newQuoteTableItems = quoteTableItems.map((qt) => {
    const newRows = qt.rows.map((q) => {
      const { boq_item_id } = q;
      const [item] = items.filter((f) => f.id === boq_item_id);
      if (item && item.type) {
        return {
          ...q,
          type: item.type,
        };
      }
      return q;
    });
    return {
      ...qt,
      rows: newRows,
    };
  });
  return (
    <Wrapper>
      <Grid
        container
        sx={{
          position: ' relative',
        }}
      >
        <TenderSummaryLeft>
          <TenderBoqDescription
            totalBudget={totalBudget}
            packageLabel={entity && entity.tender ? entity.tender.label : ''}
          />
          <Table
            sx={{
              borderRadius: '6px',
              marginTop: '26px',
              mb: 2,
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
              overflowY: 'hidden',
            }}
            Columns={Columns}
            items={items}
            Body={WrapperSummary}
            actions={false}
          />
        </TenderSummaryLeft>
        {prepareQuotes ? (
          <TenderSummaryRight
            arrayLength={newQuoteTableItems.length}
            boqid={entity?.id}
          >
            {newQuoteTableItems.map((quoteTableItem) => {
              const { rows, summaryCurrency, id, subcontractor, programme } =
                quoteTableItem;
              return (
                <MuiComparisonTable
                  quoteTableItem={quoteTableItem}
                  key={id}
                  id={id}
                  orderTemplates={orderTemplates}
                  subcontractor={subcontractor}
                  summaryCurrency={summaryCurrency}
                  Columns={ComparisonColumns}
                  items={rows}
                  programme={programme}
                  Body={WrapperComparisonSummary}
                  pid={entity && entity.tender && entity.tender.project_id}
                  awarded={entity && entity.tender && entity.tender.awarded}
                  entity={entity}
                />
              );
            })}
          </TenderSummaryRight>
        ) : (
          <Skeleton variant="rectangular" width={200} height={620} />
        )}
      </Grid>
    </Wrapper>
  );
};

const mapStateToProps = (state) => {
  return {
    boq: state.boq,
  };
};

export default connect(mapStateToProps)(Summary);
