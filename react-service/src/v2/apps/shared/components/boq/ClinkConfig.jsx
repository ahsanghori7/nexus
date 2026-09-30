import React from 'react';
import capitalize from 'lodash/capitalize';
import Box from '@mui/material/Box';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import TableTooltip from './TableTooltip';
import BoqMultilineCell from './BoqMultilineCell';
import { normalizeBoqLineBreaks } from './boqLineText';

const { clinkGray: headerIconGray } = CONSTANTS.colors.general;

const ITEM_NO = 'item_no';
const DESC = 'description';
const QTY = 'quantity';
const UNIT = 'unit_id';
const RATE = 'budget_rate';
const TOTAL = 'budget_total';
const NOTE = 'tenderee_note';

const CustomHeaderTable = ({ headerName = '', description = '' }) => (
  <Box
    className="MuiDataGrid-columnHeaderTitle"
    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
  >
    {description ? (
      <TableTooltip
        content={
          <InfoOutlined
            sx={{ fontSize: 16, color: headerIconGray, opacity: 0.85, flexShrink: 0 }}
            aria-hidden
          />
        }
        title={description}
      />
    ) : null}
    <span>{headerName}</span>
  </Box>
);

const MAPPING_COLUMN_CLINK = {
  [ITEM_NO]: 'Item No',
  [DESC]: 'Description',
  [QTY]: 'Quantity',
  [UNIT]: 'Unit',
  [RATE]: 'Budget Rate',
  [TOTAL]: 'Budget Total',
  [NOTE]: 'Notes',
};

const columnsGrid = (valueOptions = []) => [
  {
    field: ITEM_NO,
    headerName: MAPPING_COLUMN_CLINK[ITEM_NO],
    headerAlign: 'left',
    align: 'left',
    flex: 100,
    editable: true,
    renderCell: (params) => {
      const rawValue = params?.value;
      if (!rawValue || !String(rawValue).length) {
        return '-';
      }
      return <BoqMultilineCell value={rawValue} />;
    },
  },
  {
    field: DESC,
    headerName: MAPPING_COLUMN_CLINK[DESC],
    headerAlign: 'left',
    align: 'left',
    flex: 280,
    editable: true,
    renderCell: (params) => {
      const type = params?.row?.type?.toLowerCase();
      const needCapitalize = type === 'section' || type === 'grouped_heading';
      const rawValue = params?.value?.length ? params.value : '';
      if (!rawValue) {
        return '-';
      }
      const value = normalizeBoqLineBreaks(rawValue);
      const displayValue = needCapitalize ? capitalize(value) : value;
      return <BoqMultilineCell value={displayValue} />;
    },
  },
  {
    field: QTY,
    headerName: MAPPING_COLUMN_CLINK[QTY],
    headerAlign: 'right',
    align: 'right',
    type: 'number',
    flex: 123,
    editable: true,
    valueFormatter: (value) => {
      if (value === null || value === undefined || value === '') return '';
      const n = Number(value);
      return Number.isFinite(n) ? n.toFixed(2) : String(value);
    },
  },
  {
    field: UNIT,
    headerName: MAPPING_COLUMN_CLINK[UNIT],
    headerAlign: 'left',
    align: 'left',
    type: 'singleSelect',
    flex: 65,
    editable: true,
    valueOptions,
    renderCell: (params) => params?.formattedValue || '-',
  },
  {
    field: RATE,
    headerName: MAPPING_COLUMN_CLINK[RATE],
    description: i18next.t('boq-budget-rate-description'),
    headerAlign: 'right',
    align: 'right',
    type: 'number',
    flex: 95,
    editable: true,
    renderCell: (params) =>
      params?.value &&
      parseCurrency(params.value, currencyConfig[i18next.t('currency')]),
    renderHeader: (params) => {
      const { colDef } = params;
      const { headerName = '', description = '' } = colDef;
      return (
        <CustomHeaderTable headerName={headerName} description={description} />
      );
    },
  },
  {
    field: TOTAL,
    headerName: MAPPING_COLUMN_CLINK[TOTAL],
    description: i18next.t('boq-budget-total-description'),
    headerAlign: 'right',
    align: 'right',
    type: 'number',
    flex: 95,
    editable: true,
    renderCell: (params) =>
      params?.value &&
      parseCurrency(params.value, currencyConfig[i18next.t('currency')]),
    renderHeader: (params) => {
      const { colDef } = params;
      const { headerName = '', description = '' } = colDef;
      return (
        <CustomHeaderTable headerName={headerName} description={description} />
      );
    },
  },
  {
    field: NOTE,
    headerName: MAPPING_COLUMN_CLINK[NOTE],
    headerAlign: 'left',
    align: 'left',
    flex: 124,
    editable: true,
    renderCell: (params) => {
      const { value } = params;
      if (value == null || value === '') {
        return '-';
      }
      return <BoqMultilineCell value={value} />;
    },
  },
];

export default columnsGrid;
