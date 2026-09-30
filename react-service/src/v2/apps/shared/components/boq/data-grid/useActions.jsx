import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import Clear from '@mui/icons-material/Clear';
import TurnSlightLeftOutlined from '@mui/icons-material/TurnSlightLeftOutlined';
import TurnSlightRightOutlined from '@mui/icons-material/TurnSlightRightOutlined';
import MoveUpSharp from '@mui/icons-material/MoveUpSharp';
import MoveDownSharp from '@mui/icons-material/MoveDownSharp';
import { GridActionsCellItem } from '@mui/x-data-grid-pro';
import { normalizeBoqRowTextFields } from 'v2/apps/shared/components/boq/boqLineText';

const DELETE_STATUS = 4;

const emptyRow = (row, full = false) => {
  const newRow = {};
  // eslint-disable-next-line guard-for-in
  for (const key in row) {
    newRow[key] = null;
  }
  const fullClean = full
    ? {}
    : {
        id: row.id,
        boq_item_id: row.boq_item_id,
        item_version: row.item_version,
        type: row.type,
      };
  const returnRow = {
    ...newRow,
    id: row.id,
    item_version: {
      boq_item_mapping_id: undefined,
      id: undefined,
      status: 2,
      version: row.item_version.version,
    },
    ...fullClean,
  };

  return returnRow;
};
const switchType = {
  item: 'grouped_heading',
  grouped_heading: 'item',
};

// TODO: To refactor Submit Quote useActions
const useActions = (
  useRows = [[], () => null],
  noAction = false,
  entries = [],
) => {
  const [rows, setRows] = useRows;

  const handleDeleteClick = (id) => () => {
    setRows(
      [...rows].map((row) =>
        String(row.id) === String(id)
          ? {
              ...row,
              item_version: { ...row.item_version, status: DELETE_STATUS },
            }
          : row,
      ),
    );
  };

  const handleClearClick = (id) => () => {
    const newRows = rows.map((row) => {
      if (row.id !== id) {
        return row;
      }
      return emptyRow(row);
    });
    setRows(newRows);
  };

  const processRowUpdate = (newData) => {
    const sanitizedData = normalizeBoqRowTextFields(newData);
    const [oldData] = rows.filter(
      (entry) => String(entry.id) === String(sanitizedData.id),
    );
    if ('edited' in sanitizedData) {
      delete sanitizedData.edited;
    }
    const newDataMarkingEdited = { ...sanitizedData };
    if (oldData) {
      newDataMarkingEdited.edited = false;
      Object.keys(sanitizedData).forEach((key) => {
        if (sanitizedData[key] !== oldData[key]) {
          newDataMarkingEdited.edited = true;
        }
      });
      const [oldRow] = rows.filter((r) => r.id === newDataMarkingEdited.id);
      const quantityNew =
        newDataMarkingEdited &&
        newDataMarkingEdited.quantity &&
        Number(newDataMarkingEdited.quantity);
      const quantityOld = oldRow && oldRow.quantity && Number(oldRow.quantity);
      const budgetRateNew =
        newDataMarkingEdited &&
        newDataMarkingEdited.budget_rate &&
        Number(newDataMarkingEdited.budget_rate);
      const budgetRateOld =
        oldRow && oldRow.budget_rate && Number(oldRow.budget_rate);

      if (quantityNew !== quantityOld || budgetRateNew !== budgetRateOld) {
        newDataMarkingEdited.budget_total = quantityNew * budgetRateNew;
      }
    }
    const newContent = rows.map((row) =>
      row.id === newDataMarkingEdited.id ? newDataMarkingEdited : row,
    );
    setRows(newContent);
    return sanitizedData;
  };

  const processRowUpdateProsper = (newData) => {
    const localNewData = { ...newData };
    const [oldData] = entries.filter(
      (entry) => String(entry.id) === String(localNewData.id),
    );
    if ('edited' in localNewData) {
      delete localNewData.edited;
    }
    const newDataMarkingEdited = { ...localNewData };
    if (oldData) {
      newDataMarkingEdited.edited = false;
      Object.keys(localNewData).forEach((key) => {
        if (localNewData[key] !== oldData[key]) {
          newDataMarkingEdited.edited = true;
        }
      });
    }
    const newContent = rows.map((row) =>
      row.id === newDataMarkingEdited.id ? newDataMarkingEdited : row,
    );
    setRows(newContent);
    return localNewData;
  };

  const handleRowOrderChange = (params) => {
    const rowsClone = [...rows];
    const row = rowsClone.splice(params.oldIndex, 1)[0];
    rowsClone.splice(params.targetIndex, 0, row);

    setRows(rowsClone);
  };

  const handleRowOrderActionChange = (index, direction) => () => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === rows.length - 1)
    ) {
      return; // Can't move if already at the top or bottom
    }
    const newData = [...rows];

    const offset = direction === 'up' ? -1 : 1;
    const temp = newData[index + offset];
    newData[index + offset] = newData[index];
    newData[index] = temp;

    setRows(newData);
  };

  const handleAddRowActionChange = (index, direction) => () => {
    const newEmptyRow = {
      ...emptyRow(rows[0], true),
      id: uuidv4(),
      type: 'item',
    };
    const newData = [...rows];

    if (direction === 'up' && index === 0) {
      setRows([newEmptyRow, ...newData]);
    } else if (direction === 'down' && index === newData.length - 1) {
      setRows([...newData, newEmptyRow]);
    } else {
      newData.splice(direction === 'up' ? index : index + 1, 0, newEmptyRow);
      setRows(newData);
    }
  };

  const toggleItem = (id) => () => {
    const newRows = rows.map((row) => {
      if (row.id !== id) {
        return row;
      }
      return {
        ...row,
        type: switchType[row.type],
      };
    });
    setRows(newRows);
  };

  const actions = {
    field: 'actions',
    type: 'actions',
    headerName: '',
    flex: 70,
    cellClassName: 'actions',
    getActions: (params) => {
      const { id, row } = params;

      if (noAction) {
        return [];
      }

      const { id: rowId } = row;
      const index = rows.findIndex((item) => item.id === rowId);
      const upDown = [
        <GridActionsCellItem
          key={1}
          icon={<MoveUpSharp />}
          label="Move Up"
          onClick={handleRowOrderActionChange(index, 'up')}
          color="inherit"
          showInMenu
        />,
        <GridActionsCellItem
          key={2}
          icon={<MoveDownSharp />}
          label="Move Down"
          onClick={handleRowOrderActionChange(index, 'down')}
          color="inherit"
          showInMenu
        />,
        <GridActionsCellItem
          key={3}
          icon={<ArrowUpward />}
          label="Add 1 Row on Top"
          onClick={handleAddRowActionChange(index, 'up')}
          color="inherit"
          showInMenu
        />,
        <GridActionsCellItem
          key={4}
          icon={<ArrowDownward />}
          label="Add 1 Row on Bottom"
          onClick={handleAddRowActionChange(index, 'down')}
          color="inherit"
          showInMenu
        />,
      ];
      if (row.type === 'section') {
        return upDown;
      }
      const common = [
        ...upDown,
        <GridActionsCellItem
          key={6}
          icon={<Clear />}
          label="Clear Row"
          onClick={handleClearClick(id)}
          color="inherit"
          showInMenu
        />,
        <GridActionsCellItem
          key={7}
          icon={<DeleteIcon />}
          label="Remove Row"
          onClick={handleDeleteClick(id)}
          color="inherit"
          showInMenu
        />,
      ];
      if (row.type === 'grouped_heading') {
        return [
          <GridActionsCellItem
            key={1}
            icon={<TurnSlightRightOutlined />}
            label="Turn into Item"
            onClick={toggleItem(rowId)}
            color="inherit"
            showInMenu
          />,
          ...common,
        ];
      }
      return [
        <GridActionsCellItem
          key={1}
          icon={<TurnSlightLeftOutlined />}
          label="Turn into Group Heading"
          onClick={toggleItem(rowId)}
          color="inherit"
          showInMenu
        />,
        ...common,
      ];
    },
  };
  return [
    rows,
    actions,
    processRowUpdate,
    processRowUpdateProsper,
    handleRowOrderChange,
  ];
};

export default useActions;
