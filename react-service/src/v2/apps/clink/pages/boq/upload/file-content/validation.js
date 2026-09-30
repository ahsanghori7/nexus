import isNil from 'lodash/isNil';

// item types
const SECTION = 'Section'.toLowerCase();
const GROUPED_HEADING = 'Grouped Heading'.toLowerCase();
const ITEM = 'Item'.toLowerCase();
const TYPE = `${ITEM} Type`.toLowerCase();
// Helper function to get required columns based on item type
const DESC = 'Description'.toLowerCase();
const SECTION_COLUMNS = [TYPE, DESC];
const GROUPEDHEADING_COLUMNS = [...SECTION_COLUMNS, 'Item'.toLowerCase()];
const ITEM_COLUMNS = [
  ...GROUPEDHEADING_COLUMNS,
  'Quantity'.toLowerCase(),
  'Unit'.toLowerCase(),
  'Budget Rate'.toLowerCase(),
  'Budget Total'.toLowerCase(),
];

const ERROR_COLUMN_1 = 'Row';
const ERROR_COLUMN_2 = 'Column';
const ERROR_COLUMN_3 = 'Provided Value';
const ERROR_COLUMN_4 = 'Error Type';
const ERROR_COLUMN_5 = 'System Message';
const addError = (row, column, val, desc, msg) => ({
  [ERROR_COLUMN_1]: row,
  [ERROR_COLUMN_2]: column,
  [ERROR_COLUMN_3]: val,
  [ERROR_COLUMN_4]: desc,
  [ERROR_COLUMN_5]: msg,
});

const trimVal = (value) => (typeof value === 'string' && value.trim()) || value;

function validateData(data, units = []) {
  const errors = [];

  // Helper function to check if a value is numeric and positive
  const isNumericAndPositive = (value) => {
    return !isNaN(value) && parseFloat(value) > 0;
  };

  // Check for exactly three section entries
  const sectionEntries = data.filter((item) => trimVal(item[TYPE]) === SECTION);
  if (sectionEntries.length !== 3) {
    errors.push(
      addError(
        '',
        TYPE,
        sectionEntries.length,
        'Incorrect number of Section entries',
        'There must be exactly three Section entries.'
      )
    );
  }

  // Validate unique item identifiers
  const itemIdentifiers = new Set();

  data.forEach((item, index) => {
    const itemType = trimVal(item[TYPE]);
    const itemNo = trimVal(item.item);
    const description = trimVal(item.description);
    const quantity = trimVal(item.quantity);
    const unit = trimVal(item.unit);
    const budgetRate = trimVal(item['budget rate']);
    const budgetTotal = trimVal(item['budget total']);

    const rowIndex = index + 2;
    // Mandatory Fields
    if (itemType === SECTION) {
      if (!description) {
        errors.push(
          addError(
            rowIndex,
            'Description',
            description,
            'Missing required fields in any row',
            `Please ensure all required fields (${TYPE}, ${DESC}) are filled in where applicable.`
          )
        );
      }
      if (!['prelims', 'measured work', 'other items'].includes(description)) {
        errors.push(
          addError(
            rowIndex,
            'Description',
            description,
            'Invalid Section description',
            `Section descriptions must be 'Prelims', 'Measured work', or 'Other items'.`
          )
        );
      }
    } else if (itemType === GROUPED_HEADING) {
      if (!itemNo) {
        errors.push(
          addError(
            rowIndex,
            'Item',
            itemNo,
            'Missing required fields in any row',
            `Please ensure all required fields (${TYPE}, ${ITEM}, ${DESC}) are filled in where applicable.`
          )
        );
      }
      if (!description) {
        errors.push(
          addError(
            rowIndex,
            'Description',
            description,
            'Missing required fields in any row',
            `Please ensure all required fields (${TYPE}, ${ITEM}, ${DESC}) are filled in where applicable.`
          )
        );
      }
    } else if (itemType === ITEM) {
      if (isNil(itemNo)) {
        errors.push(
          addError(
            rowIndex,
            'Item',
            itemNo,
            'Missing required fields in any row',
            `Please ensure all required fields (${ITEM_COLUMNS.join(
              ', '
            )}) are filled in where applicable.`
          )
        );
      } else if (itemIdentifiers.has(itemNo)) {
        errors.push(
          addError(
            rowIndex,
            'Item',
            itemNo,
            'Duplicate item identifier',
            `Item identifiers must be unique. Duplicate found: ${itemNo}.`
          )
        );
      } else {
        itemIdentifiers.add(itemNo);
      }
      if (isNil(description)) {
        errors.push(
          addError(
            rowIndex,
            'Description',
            description,
            'Missing required fields in any row',
            `Please ensure all required fields (${ITEM_COLUMNS.join(
              ', '
            )}) are filled in where applicable.`
          )
        );
      }
      if (isNil(quantity)) {
        errors.push(
          addError(
            rowIndex,
            'Quantity',
            quantity,
            'Missing required fields in any row',
            `Please ensure all required fields (${ITEM_COLUMNS.join(
              ', '
            )}) are filled in where applicable.`
          )
        );
      }
      if (isNil(unit)) {
        errors.push(
          addError(
            rowIndex,
            'Unit',
            unit,
            'Missing required fields in any row',
            `Please ensure all required fields (${ITEM_COLUMNS.join(
              ', '
            )}) are filled in where applicable.`
          )
        );
      }
      if (isNil(budgetRate)) {
        errors.push(
          addError(
            rowIndex,
            'Budget Rate',
            budgetRate,
            'Missing required fields in any row',
            `Please ensure all required fields (${ITEM_COLUMNS.join(
              ', '
            )}) are filled in where applicable.`
          )
        );
      }
      if (isNil(budgetTotal)) {
        errors.push(
          addError(
            rowIndex,
            'Budget Total',
            budgetTotal,
            'Missing required fields in any row',
            `Please ensure all required fields (${ITEM_COLUMNS.join(
              ', '
            )}) are filled in where applicable.`
          )
        );
      }
      // Numerical and Positive Quantities
      if (quantity && !isNumericAndPositive(quantity)) {
        errors.push(
          addError(
            rowIndex,
            'Quantity',
            quantity,
            'Quantities are not positive numbers',
            'All quantities must be positive numbers. Please revise any entries with non-numerical, zero or negative quantities.'
          )
        );
      }
      const listUnits = units.map((u) => u.symbol);
      // Valid Units
      if (unit && !listUnits.includes(unit)) {
        errors.push(
          addError(
            rowIndex,
            'Unit',
            unit,
            'Units of measurement are unrecognized or inappropriate',
            'Please use recognized units of measurement in the template (e.g., m, m², item) that are appropriate for the described work.'
          )
        );
      }
      // Numerical Budget rate and total Entries
      if (budgetRate && isNaN(budgetRate)) {
        errors.push(
          addError(
            rowIndex,
            'Budget Rate',
            budgetRate,
            'Budget Rate is not numerical',
            'Budget Rate must be a numerical value. Please correct any non-numerical budget rate entries.'
          )
        );
      }
      if (budgetTotal && isNaN(budgetTotal)) {
        errors.push(
          addError(
            rowIndex,
            'Budget Total',
            budgetTotal,
            'Budget Total is not numerical',
            'Budget Total must be a numerical value. Please correct any non-numerical budget total entries.'
          )
        );
      }
    } else {
      // Incorrect Item Type
      errors.push(
        addError(
          rowIndex,
          TYPE,
          itemType,
          'Incorrect use of Item Type values',
          `Item Type values must be either '${SECTION}', '${GROUPED_HEADING}', or '${ITEM}'. Please correct your entries accordingly.`
        )
      );
    }

    // Budget for Measurable Items Only
    if (
      [SECTION, GROUPED_HEADING].includes(itemType) &&
      (budgetRate || budgetTotal)
    ) {
      errors.push(
        addError(
          rowIndex,
          TYPE,
          itemType,
          'Budget provided for Sections or Grouped Headings',
          'Budget entries should only be provided for measurable items, not for Sections or Grouped Headings.'
        )
      );
    }

    // Units for Sections or Grouped Headings
    if ([SECTION, GROUPED_HEADING].includes(itemType) && !isNil(unit)) {
      errors.push(
        addError(
          rowIndex,
          TYPE,
          itemType,
          `'Unit' field filled for '${SECTION}' or '${GROUPED_HEADING}' rows`,
          `Units should not be provided for '${SECTION}' or '${GROUPED_HEADING}' rows. Please remove any units associated with these entries.`
        )
      );
    }

    // Quantities for Sections or Grouped Headings
    if ([SECTION, GROUPED_HEADING].includes(itemType) && !isNil(quantity)) {
      errors.push(
        addError(
          rowIndex,
          TYPE,
          itemType,
          `'Quantity' field filled for '${SECTION}' or '${GROUPED_HEADING}' rows`,
          `Quantities should not be provided for '${SECTION}' or '${GROUPED_HEADING}' rows. Please remove any quantities associated with these entries.`
        )
      );
    }

    // Item Column Filled for Sections
    if (itemType === SECTION && !isNil(itemNo)) {
      errors.push(
        addError(
          rowIndex,
          'Item',
          itemNo,
          `'${ITEM}' field filled for a '${SECTION}' row`,
          `The '${ITEM}' field should be left blank for '${SECTION}' rows.`
        )
      );
    }
  });

  // Overall Structure Adherence
  const sectionIndices = data.reduce((acc, item, index) => {
    if (item[TYPE] === SECTION) {
      acc.push(index);
    }
    return acc;
  }, []);

  const groupedHeadingIndices = data.reduce((acc, item, index) => {
    if (item[TYPE] === GROUPED_HEADING) {
      acc.push(index);
    }
    return acc;
  }, []);

  const itemIndices = data.reduce((acc, item, index) => {
    if (item[TYPE] === ITEM) {
      acc.push(index);
    }
    return acc;
  }, []);

  if (
    sectionIndices.length === 0 ||
    groupedHeadingIndices.length === 0 ||
    itemIndices.length === 0
  ) {
    errors.push(
      addError(
        '',
        '',
        'Wrong template',
        'Template provided does not match the system',
        `Your document structure should adhere to the provided template, organizing entries into ${SECTION}s, ${GROUPED_HEADING}s, and ${ITEM}s appropriately.`
      )
    );
  }

  return errors;
}

export default validateData;
export { trimVal };
