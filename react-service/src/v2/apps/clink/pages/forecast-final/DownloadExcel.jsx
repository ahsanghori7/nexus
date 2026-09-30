import React from 'react';
import PropTypes from 'prop-types';
import i18next from 'v2/helpers/i18n';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { parseFloatVal } from 'v2/helpers/currency';

const XLSX = require('xlsx');

const formatNumber = (value) => {
  // Ensure the value is a number and handle nullish values
  const numValue = parseFloatVal(value) || 0;
  // Return an object with explicit number type and formatting
  return {
    v: numValue,
    t: 'n',
    z: '#,##0.00',
    w: numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  };
};

const DownloadExcel = ({ data, forecastList, projectBudget, profitLoss }) => {

  const handleDownloadExcel = () => {
    const fileName = `${
      data?.name || 'Project'
    }_Forecast_Final_Accounts_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;

    // Create headers
    const headers = [
      { v: 'Package', t: 's' },
      { v: 'Budget', t: 's' },
      { v: 'Order Value', t: 's' },
      { v: 'Variations', t: 's' },
      { v: 'Omissions', t: 's' },
      { v: 'Total Value', t: 's' }
    ];

    // Create data rows with explicit number formatting
    const rows = forecastList.map(row => [
      { v: row.package || '', t: 's' },
      formatNumber(row.budget),
      formatNumber(row.order),
      formatNumber(row.variations),
      formatNumber(row.omissions),
      formatNumber(row.total)
    ]);

    // Create summary rows with explicit number formatting
    const summaryRows = [
      [], // Empty row
      [{ v: 'Summary', t: 's' }],
      [
        { v: 'Project Budget', t: 's' },
        formatNumber(projectBudget)
      ],
      [
        { v: 'Profit/Loss', t: 's' },
        formatNumber(profitLoss)
      ]
    ];

    // Combine all rows
    const excelData = [headers, ...rows, ...summaryRows];

    // Create worksheet with explicit options
    const ws = XLSX.utils.aoa_to_sheet(excelData, { cellDates: true });

    // Set column widths
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    // Add cell styles and number format
    for (let R = 1; R < excelData.length; R++) {
      for (let C = 1; C < 6; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.t === 'n') {
          cell.z = '#,##0.00';
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, i18next.t('forecast-finals'));

    // Set workbook properties
    wb.Workbook = {
      Views: [{ RTL: false }]
    };

    XLSX.writeFile(wb, fileName, {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
      cellStyles: true,
      compression: true
    });
  };

  return (
    <Button
      color="success"
      variant="contained"
      startIcon={<FileDownloadIcon />}
      onClick={handleDownloadExcel}
    >
      {i18next.t('Download as Excel')}
    </Button>
  );
};

DownloadExcel.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
  }),
  forecastList: PropTypes.arrayOf(
    PropTypes.shape({
      package: PropTypes.string,
      budget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      order: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      variations: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      omissions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  projectBudget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  profitLoss: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

DownloadExcel.defaultProps = {
  data: {
    name: 'Project',
  },
};

export default DownloadExcel;
