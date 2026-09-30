import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Table from 'v2/apps/shared/components/boq/Table';
import Actions from './actions';
import Header from './Header';

const MuiComparisonTable = ({
  quoteTableItem = {},
  orderTemplates,
  Columns,
  items,
  Body,
  pid = 0,
  awarded = false,
  entity,
}) => {
  const {
    summaryCurrency = '',
    subcontractor = {},
    programme,
    margin,
    marginCurrency,
    bestPrice,
    bestProgramme,
  } = quoteTableItem;

  const { name } = subcontractor;

  return (
    <Box
      sx={{
        minWidth: '240px',
        border: '1px solid rgba(224, 224, 224, 1)',
        borderBottomWidth: 0,
        borderRadius: '8px',
        mr: 2,
      }}
    >
      <Grid container>
        <Header
          name={name}
          summaryCurrency={summaryCurrency}
          programme={programme}
          margin={margin}
          marginCurrency={marginCurrency}
          bestPrice={bestPrice}
          bestProgramme={bestProgramme}
          subcontractor={subcontractor}
          actions={
            <Actions
              quoteInfo={quoteTableItem}
              orderTemplates={orderTemplates}
              pid={pid}
              awarded={awarded}
              entity={entity}
            />
          }
        />
      </Grid>
      <Grid container>
        <Table
          sx={{
            borderBottomRightRadius: '6px',
            borderBottomLeftRadius: '6px',
            borderBottom: '1px solid rgba(224, 224, 224, 1)',
            overflow: 'hidden',
            '&::WebkitScrollbar': {
              display: 'none',
            },
          }}
          Columns={Columns}
          items={items}
          Body={Body}
          actions={false}
        />
      </Grid>
    </Box>
  );
};

export default MuiComparisonTable;
