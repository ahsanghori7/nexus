import { useState } from 'react';
import isNil from 'lodash/isNil';
import isNumber from 'lodash/isNumber';
import i18next from 'v2/helpers/i18n';
import validateData, { trimVal } from './validation';
import getContent from './getContent';

const XLSX = require("xlsx");

const UploadModalContent = ({
  updateEntity = () => null,
  setModal = () => null,
  units = [],
}) => {
  const [file, setFile] = useState(null);
  const [uploadFile, setUploadFile] = useState([]);
  const [errorTable, setErrorTable] = useState([]);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
  };

  const handleUploadFile = () => {
    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();

      // Check if the file is either Excel or CSV
      if (
        fileExtension === 'xlsx' ||
        fileExtension === 'xls' ||
        fileExtension === 'csv'
      ) {
        const fileToRead = file;
        const reader = new FileReader();

        reader.onload = (evt) => {
          const bstr = evt.target.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });

          // Assuming the first sheet contains the relevant data
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert the worksheet data to JSON
          let dataRead = XLSX.utils.sheet_to_json(worksheet);
          dataRead = dataRead.map((row) => {
            const Item = {};
            if (!isNil(row.Item)) {
              Item.Item = isNumber(row.Item)
                ? String(parseFloat(row.Item))
                : row.Item;
            }
            return {
              ...row,
              ...Item,
            };
          });

          /* BEGIN FORMAT:
            - Format the data to avoid strings with spaces around
            - set keys, item type, section desc and grouped heading desc to lowercase
            - make sure to remove keys not needed for some items
          */
          dataRead = dataRead.map((d) => {
            const newObj = {};
            Object.keys(d).forEach((objKey) => {
              newObj[trimVal(objKey).toLowerCase()] = trimVal(d[objKey]);
            });
            return newObj;
          });
          dataRead = dataRead.map((d) => {
            const itemType = d['item type']?.toLowerCase();
            const newDesc = ['section', 'grouped heading'].includes(itemType)
              ? d.description?.toLowerCase()
              : d.description;
            return {
              ...d,
              description: newDesc,
              'item type': itemType,
            };
          });
          dataRead = dataRead.map((d) => {
            const newData = { ...d };
            const itemType = d['item type'];
            if (itemType !== 'item') {
              delete newData.quantity;
              delete newData.unit;
              delete newData['budget rate'];
              delete newData['budget total'];
              delete newData['item notes'];
            }
            if (itemType === 'section') {
              delete newData.item;
              // TODO: To delete this bulshit if when refactor this
              if (newData?.description === 'measured works') {
                newData.description = 'measured work';
              }
            }
            return newData;
          });
          // END FORMAT
          const validationErrors = validateData(dataRead, units);

          // Output validation errors
          if (validationErrors.length > 0) {
            setUploadFile([]);
            setErrorTable(validationErrors);
            setModal('error');
          } else {
            const transformedData = dataRead.map((item, index) => {
              return {
                unit: item.unit || null,
                item_no: item.item || null,
                description: item.description || null,
                quantity: Number(item.quantity || '0.00'),
                type: item['item type']?.trim().replaceAll(' ', '_') || null,
                budget_total: Number(item['budget total'] || '0.00'),
                budget_rate: Number(item['budget rate'] || '0.00'),
                tenderee_note: item['item notes'] || null,
                position: index + 1,
              };
            });

            setUploadFile(transformedData);
            setErrorTable([]);
            setModal('success');
          }
        };

        reader.readAsBinaryString(fileToRead);
      } else {
        /* eslint no-alert: "off" */
        alert(i18next.t('valid-excel'));
        setFile(null);
        setUploadFile([]);
        setModal(false);
      }
    }
  };

  const handleBack = () => {
    setUploadFile([]);
    setErrorTable([]);
    setFile(null);
    setModal(false);
  };

  const handleUpdateEntity = (data) => {
    const formattedData = data.map((d) => {
      const { unit } = d;
      if (!unit) {
        return d;
      }
      const [getUnit] = units.filter(
        (u) =>
          String(u.symbol).toLocaleLowerCase() ===
          String(unit).toLocaleLowerCase()
      );
      return { ...d, unit_id: getUnit.value };
    });
    updateEntity(formattedData);
  };

  return getContent(
    errorTable,
    uploadFile,
    file,
    handleUpdateEntity,
    handleFileChange,
    handleUploadFile,
    handleBack
  );
};

export default UploadModalContent;
