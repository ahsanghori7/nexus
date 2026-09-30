import React from 'react';

const MockDataGrid = ({
  entries = [],
  updatedEntriesCallback = () => {},
  callback = () => {},
  useRows = [[], () => {}],
  getRowClassName = () => '',
  getCellClassName = () => '',
  isCellEditable = () => true
}) => {
  // Simulate setting updated entries for testing
  React.useEffect(() => {
    if (entries && entries.length > 0) {
      updatedEntriesCallback(entries);
    }
  }, [entries, updatedEntriesCallback]);

  // Call callback to simulate changes
  React.useEffect(() => {
    callback();
  }, [callback]);

  return (
    <div data-testid="data-grid">
      <div>Mock DataGrid Component</div>
      {entries.map((entry, index) => {
        // Simulate calling the prop functions to ensure they're covered
        const rowClassName = getRowClassName ? getRowClassName({ row: entry }) : '';
        const cellClassNameReorder = getCellClassName ? getCellClassName({ row: entry, field: '__reorder__' }) : '';
        const cellClassNameDescription = getCellClassName ? getCellClassName({ row: entry, field: 'description' }) : '';
        const cellClassNameOther = getCellClassName ? getCellClassName({ row: entry, field: 'other' }) : '';
        const isEditable = isCellEditable ? isCellEditable({ row: entry }) : true;

        return (
          <div
            key={entry.id || index}
            data-testid={`grid-entry-${index}`}
            className={rowClassName}
          >
            <span className={cellClassNameReorder} data-testid={`cell-reorder-${index}`}>
              {entry.description || entry.item_no || `Entry ${index + 1}`}
            </span>
            <span className={cellClassNameDescription} data-testid={`cell-description-${index}`}>
              {entry.description || entry.item_no || `Entry ${index + 1}`}
            </span>
            <span className={cellClassNameOther} data-testid={`cell-other-${index}`}>
              {isEditable ? 'Editable' : 'Read-only'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default MockDataGrid;
