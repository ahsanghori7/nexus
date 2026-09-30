import React from 'react';
import capitalize from 'lodash/capitalize';
import i18next from 'v2/helpers/i18n';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import TableTooltip from './TableTooltip';
import highlightTooltip from './HighlightTooltip';

const ITEM_NO = 'item_no';
const DESC = 'description';
const QTY = 'quantity';
const UNIT = 'unit_id';
const RATE = 'rate';
const PRICE = 'price';
const NOTE = 'tenderee_note';

const MAPPING_COLUMN_PROSPER = {
  [ITEM_NO]: 'Item',
  [DESC]: 'Description',
  [QTY]: 'Quantity',
  [UNIT]: 'Unit',
  [RATE]: 'Rate',
  [PRICE]: 'Price',
  [NOTE]: 'Note',
};

const PRELIMS = 'Prelims';
const MEASURED_WORK = 'Measured work';
const OTHER_ITEMS = 'Other items';
const SECTIONS_CONTENT = [PRELIMS, MEASURED_WORK, OTHER_ITEMS];

const columnsGrid = (valueOptions = []) => [
  {
    field: ITEM_NO,
    headerName: MAPPING_COLUMN_PROSPER[ITEM_NO],
    flex: 50,
    headerAlign: 'left',
    align: 'left',
  },
  {
    field: DESC,
    headerName: MAPPING_COLUMN_PROSPER[DESC],
    flex: 250,
    headerAlign: 'left',
    align: 'left',
    renderCell: (params) => {
      const { row } = params;
      const highlightTooltipContent = highlightTooltip(row);

      const { description, type } = row;
      if (!description) {
        return highlightTooltipContent || '';
      }
      const desc = ['grouped_heading', 'section'].includes(type.toLowerCase())
        ? capitalize(description)
        : description;
      if (
        SECTIONS_CONTENT.map((section) => section.toLowerCase()).includes(
          desc.toLowerCase()
        )
      ) {
        return (
          <>
            {highlightTooltipContent}
            <TableTooltip
              content={<b>{capitalize(desc)}</b>}
              title={<b>{capitalize(desc)}</b>}
            />
          </>
        );
      }
      return (
        <>
          {highlightTooltipContent}
          <TableTooltip content={desc} title={desc} />
        </>
      );
    },
  },
  {
    field: QTY,
    headerName: MAPPING_COLUMN_PROSPER[QTY],
    type: 'number',
    flex: 50,
    headerAlign: 'left',
    align: 'left',
  },
  {
    field: UNIT,
    headerName: MAPPING_COLUMN_PROSPER[UNIT],
    type: 'singleSelect',
    flex: 50,
    valueOptions,
    headerAlign: 'left',
    align: 'left',
  },
  {
    field: RATE,
    headerName: MAPPING_COLUMN_PROSPER[RATE],
    headerAlign: 'left',
    align: 'left',
    type: 'number',
    flex: 50,
    editable: true,
    renderCell: (params) => {
      const { rate } = params.row;
      const value = parseCurrency(rate, currencyConfig[i18next.t('currency')]);
      return value;
    },
  },
  {
    field: PRICE,
    headerName: MAPPING_COLUMN_PROSPER[PRICE],
    type: 'number',
    headerAlign: 'left',
    align: 'left',
    flex: 50,
    renderCell: (params) => {
      const { quantity, rate } = params.row;
      const total = Number(quantity) * rate;
      const value = parseCurrency(total, currencyConfig[i18next.t('currency')]);
      return value;
    },
  },
  {
    field: NOTE,
    headerName: MAPPING_COLUMN_PROSPER[NOTE],
    headerAlign: 'left',
    align: 'left',
    flex: 250,
    renderCell: (params) => {
      const { tenderee_note = '' } = params.row;
      return <TableTooltip title={tenderee_note} content={tenderee_note} />;
    },
  },
];

export default columnsGrid;
