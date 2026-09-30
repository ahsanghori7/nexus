import React, { useEffect, useState } from 'react';
import isArray from 'lodash/isArray';
import { DataGridPro } from '@mui/x-data-grid-pro';
import useActions from 'v2/apps/shared/components/boq/data-grid/useActions';

const DataGrid = ({
  entries = [],
  useRows = false,
  units = [],
  columns = [],
  isCellEditable = () => true,
  noAction = false,
  editMode = 'cell',
  rowReordering = true,
  isProsper = false,
  callback = () => null,
  ...rest
}) => {
  const [rowsState, setRowsState] = useState(entries);
  const checkUseRows = useRows || [rowsState, setRowsState];
  const [
    rows,
    actions,
    processRowUpdate,
    processRowUpdateProsper,
    handleRowOrderChange,
  ] = useActions(checkUseRows, noAction, entries);

  useEffect(() => {
    if (!useRows) {
      setRowsState([...entries]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  useEffect(() => {
    if (rest.updatedEntriesCallback && rows && isArray(rows) && rows.length) {
      rest.updatedEntriesCallback(rows);
    }
    callback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const newColumns = [...columns(units)];
  if (!noAction && isCellEditable()) {
    newColumns.push(actions);
  }

  const { getRowHeight: getRowHeightProp, ...gridRest } = rest;
  const resolvedGetRowHeight = getRowHeightProp ?? (() => 40);

  return (
    <DataGridPro
      rows={rows}
      columns={newColumns}
      checkboxSelection={false}
      onRowOrderChange={handleRowOrderChange}
      disableRowSelectionOnClick
      rowReordering={rowReordering}
      isCellEditable={isCellEditable}
      editMode={editMode}
      processRowUpdate={isProsper ? processRowUpdateProsper : processRowUpdate}
      getRowHeight={resolvedGetRowHeight}
      disableColumnReorder
      slots={{
        toolbar: null,
      }}
      {...gridRest}
    />
  );
};

export default DataGrid;
