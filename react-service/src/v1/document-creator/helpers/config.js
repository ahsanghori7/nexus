import uniqBy from 'lodash/uniqBy';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import i18next from 'v2/helpers/i18n';
import { getAccountLogo, getGroupLogo } from 'v2/helpers/user';
import defaultSoaRow from './defaultSoaRow.json';
import defaultSoaRowMC from './defaultSoamcRow.json';
import defaultMiniBoqRow from './defaultMiniBoqRow.json';

class Config {
  static hasHtmlCode = (text) => {
    const toFind = [
      '{br}',
      '{hr}',
      '{hrt}',
      '{b:',
      '{bred:',
      '{bpnk:',
      '{binv:',
      '{inv:',
      '{em:',
      '{u:',
      '{mark:',
      '{ul:',
      '{li:',
      '{lind:',
      '{lnd2:',
      '{lnd3:',
      '{lnd4:',
      '{lnd5:',
      '{lnd6:',
      '{lnd7:',
      '{lnd8:',
      '{del:',
      '{ol:',
      '{gp:',
    ];
    // We will create an array of booleans
    const foundArray = toFind.map((pet) => text.includes(pet));
    // if there's any code found, we'll return true
    return foundArray.reduce(
      (previousValue, currentValue) => currentValue || previousValue,
      false,
    );
  };

  static getJSONfromHTML = (htmlValueProp) => {
    const htmlValue = htmlValueProp ?? ''; // if htmlValue is null or undefined, we set it to an empty string
    const removeBreaks = htmlValue
      .replace(/<p>|<br>/gm, '')
      .replace(/<\/p>/gm, '{br}');
    const removeHr = removeBreaks.replace(/<hr>/gm, '{hr}');
    const replaceBold = removeHr
      .replace(/<strong>/gm, '{b:')
      .replace(/<\/strong>/gm, '}');
    const replaceUnderline = replaceBold
      .replace(/<u>/gm, '{u:')
      .replace(/<\/u>/gm, '}');
    const replaceLineThrough = replaceUnderline
      .replace(/<del>/gm, '{del:')
      .replace(/<\/del>/gm, '}');
    const replaceMark = replaceLineThrough
      .replace(/<mark>/gm, '{mark:')
      .replace(/<\/mark>/gm, '}');
    const replaceIndentedLi = replaceMark
      .replace(/<li class="ql-indent-1">/gm, '{lind:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi2 = replaceIndentedLi
      .replace(/<li class="ql-indent-2">/gm, '{lnd2:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi3 = replaceIndentedLi2
      .replace(/<li class="ql-indent-3">/gm, '{lnd3:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi4 = replaceIndentedLi3
      .replace(/<li class="ql-indent-4">/gm, '{lnd4:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi5 = replaceIndentedLi4
      .replace(/<li class="ql-indent-5">/gm, '{lnd5:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi6 = replaceIndentedLi5
      .replace(/<li class="ql-indent-6">/gm, '{lnd6:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi7 = replaceIndentedLi6
      .replace(/<li class="ql-indent-7">/gm, '{lnd7:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi8 = replaceIndentedLi7
      .replace(/<li class="ql-indent-8">/gm, '{lnd8:')
      .replace(/<\/li>/gm, '}');
    const replaceIndentedLi9 = replaceIndentedLi8
      .replace(
        /<li data-list="ordered"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{li:',
      )
      .replace(
        /<li data-list="bullet"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{li:',
      );
    const replaceIndentedLi10 = replaceIndentedLi9
      .replace(
        /<li data-list="ordered" class="ql-indent-1"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lind:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-1"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lind:',
      );
    const replaceIndentedLi11 = replaceIndentedLi10
      .replace(
        /<li data-list="ordered" class="ql-indent-2"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd2:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-2"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd2:',
      );
    const replaceIndentedLi12 = replaceIndentedLi11
      .replace(
        /<li data-list="ordered" class="ql-indent-3"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd3:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-3"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd3:',
      );
    const replaceIndentedLi13 = replaceIndentedLi12
      .replace(
        /<li data-list="ordered" class="ql-indent-4"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd4:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-4"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd4:',
      );
    const replaceIndentedLi14 = replaceIndentedLi13
      .replace(
        /<li data-list="ordered" class="ql-indent-5"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd5:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-5"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd5:',
      );
    const replaceIndentedLi15 = replaceIndentedLi14
      .replace(
        /<li data-list="ordered" class="ql-indent-6"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd6:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-6"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd6:',
      );
    const replaceIndentedLi16 = replaceIndentedLi15
      .replace(
        /<li data-list="ordered" class="ql-indent-7"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd7:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-7"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd7:',
      );
    const replaceIndentedLi117 = replaceIndentedLi16
      .replace(
        /<li data-list="ordered" class="ql-indent-8"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd8:',
      )
      .replace(
        /<li data-list="bullet" class="ql-indent-8"><span class="ql-ui" contenteditable="false"><\/span>/gm,
        '{lnd8:',
      );
    const replaceEmphasis = replaceIndentedLi117.replace(/<em>/gm, '{em:');
    const replaceList = replaceEmphasis.replace(/<ul>/gm, '{ul:');
    const replaceNumberList = replaceList.replace(/<ol>/gm, '{ol:');
    const replaceListElem = replaceNumberList.replace(/<li>/gm, '{li:');
    return replaceListElem.replace(
      /<\/strong>|<\/u>|<\/del>|<\/mark>|<\/em>|<\/ul>|<\/li>|<\/ol>/gm,
      '}',
    );
  };

  static cleanHtml = (htmlValue) => {
    const removeSpan = htmlValue.replace(
      /<span class="ql-cursor">(.*?)<\/span>/g,
      '$1',
    );
    const removeApostrophe = removeSpan.replace(/&#x27;/gm, "'");
    const removeSpaces = removeApostrophe.replace(/&nbsp;/gm, ' ');
    const removeAmpersand = removeSpaces.replace(/&amp;/gm, '&');
    const removeGreaterThan = removeAmpersand.replace(/&gt;/gm, '>');
    const removeLesserThan = removeGreaterThan.replace(/&lt;/gm, '<');
    const removeRightQuotes = removeLesserThan.replace(/&rdquo;/gm, '”');
    return removeRightQuotes.replace(/&ldquo;/gm, '“');
  };

  static getNewConfig = (numbers, config, newValue, draft = false) => {
    // eslint-disable-next-line no-unused-vars
    const [_, item, ...rest] = numbers;
    const newConfig = [...config];
    // if array of numbers is 2, it means we're in the desired item to change
    if (numbers.length === 2) {
      newConfig[item] = newValue;
      return newConfig;
    }
    const nextConfig = config[item].children;
    const innerConfig = Config.getNewConfig(rest, nextConfig, newValue, draft);
    newConfig[item].children = innerConfig;

    if (draft && innerConfig.includes(newValue)) {
      newConfig[item].changed = true;
    }

    return newConfig;
  };

  static getDocumentList(folders, source, did = null) {
    let files = uniqBy(
      folders.flatMap((folder) =>
        folder.files.map((file) => ({
          ...file,
          folderName: folder.label,
          cid: folder.id,
        })),
      ),
      'id',
    ).sort((fileA, fileB) =>
      fileA.folderName
        .toLowerCase()
        .localeCompare(fileB.folderName.toLowerCase()),
    );

    if (source && source === 'tenderAddendum') {
      const contractualFiles = files
        .filter(
          (file) =>
            Number(file.id) === Number(did) &&
            file.folderName.includes('Tender Addendum'),
        )
        .map((file) => file.cid);

      files = files.filter((file) => contractualFiles.includes(file.cid));
    }

    return files
      .filter((file) => file.visible)
      .map((file) => Config.createRow(file.name, file.folderName));
  }

  static setDocumentsInConfig(did, object, folders) {
    if (
      typeof object !== 'object' &&
      !Array.isArray(object) &&
      object !== null
    ) {
      return object;
    }

    if (object.type && object.type === 'fileManager') {
      const [header] = object.children;
      const { source } = object;
      const documents = Config.getDocumentList(folders, source, did);
      const children = [header, ...documents];
      return { ...object, children };
    }

    const children =
      object && object.children
        ? object.children.map((child) => {
            return Config.setDocumentsInConfig(did, child, folders);
          })
        : [];

    return { ...object, children };
  }

  static setScheduleOfAttendances(object, soaJson = [], did = null) {
    if (
      typeof object !== 'object' &&
      !Array.isArray(object) &&
      object !== null
    ) {
      return object;
    }

    if (object.type && object.type === 'ScheduleAttendancesTemplate') {
      const [header] = object.children;
      const row = defaultSoaRow;
      const [firstCol, secondCol, thirdCol] = row.children;
      const newRow = soaJson.map((i) => {
        const buttonObj = {
          name: 'delete-button',
          props: {
            data: i,
            fullData: soaJson,
            did,
            section: Boolean(i && i.title),
          },
          children: [''],
        };
        if (i.title) {
          return {
            ...row,
            children: [
              {
                ...firstCol,
                children: [
                  {
                    name: 'attendance-input',
                    props: { data: i, fullData: soaJson, did },
                    children: [''],
                  },
                ],
              },
              { ...secondCol, children: [''] },
              { ...thirdCol, children: [''] },
              { children: [buttonObj] },
            ],
            props: { className: `${row.props.className} soa-section` },
          };
        }
        const checkboxObj = {
          name: 'attendance-checkbox',
          props: { data: i, fullData: soaJson, did },
          children: [''],
        };
        const companyName = {
          ...checkboxObj,
          props: { ...checkboxObj.props, name: 'companyName' },
        };
        const subcontractor = {
          ...checkboxObj,
          props: { ...checkboxObj.props, name: 'subcontractor' },
        };
        return {
          ...row,
          children: [
            {
              ...firstCol,
              children: [
                {
                  name: 'attendance-input',
                  props: { data: i, did, fullData: soaJson },
                  children: [''],
                },
              ],
            },
            { ...secondCol, children: [companyName] },
            { ...thirdCol, children: [subcontractor] },
            { children: [buttonObj] },
          ],
        };
      });
      const actionButtonsProps = { row: newRow.length, fullData: soaJson, did };
      const contentWithActionButtons = [
        ...newRow,
        {
          ...row,
          props: { className: 'add-new-container' },
          children: [
            { name: 'add-attendance', props: actionButtonsProps },
            { name: 'add-section', props: actionButtonsProps },
          ],
        },
      ];

      const children = [header, ...contentWithActionButtons];
      return {
        ...object,
        props: {
          ...object.props,
          className: `${object.props.className} schedules-attendances`,
        },
        children,
      };
    }

    const children =
      object && object.children
        ? object.children.map((child) =>
            Config.setScheduleOfAttendances(child, soaJson, did),
          )
        : [];

    return { ...object, children };
  }

  static setScheduleOfAttendancesMC(object, soaJson = [], did = null) {
    if (
      typeof object !== 'object' &&
      !Array.isArray(object) &&
      object !== null
    ) {
      return object;
    }

    if (object.type && object.type === 'ScheduleAttendancesTemplate') {
      const [header] = object.children;
      const row = defaultSoaRowMC;
      const [firstCol, secondCol, thirdCol, fourthCol, fifthCol, sixthCol] =
        row.children;
      let index = 0;
      const newRow = soaJson.map((i) => {
        const buttonObj = {
          name: 'delete-button',
          props: {
            data: i,
            fullData: soaJson,
            field: 'item',
            did,
            section: Boolean(i && i.title),
          },
          children: [''],
        };
        if (i.title) {
          return {
            ...row,
            children: [
              { ...firstCol, children: [''] },
              {
                ...secondCol,
                children: [
                  {
                    name: 'attendance-input',
                    props: {
                      data: i,
                      fullData: soaJson,
                      did,
                      field: 'description',
                    },
                    children: [`{b:${i.description || ''}}`],
                  },
                ],
              },
              { ...thirdCol, children: [''] },
              { ...fourthCol, children: [''] },
              { ...fifthCol, children: [''] },
              { ...sixthCol, children: [buttonObj] },
            ],
            props: { className: `${row.props.className} soa-section` },
          };
        }
        const checkboxObj = {
          name: 'attendance-checkbox',
          props: { data: i, fullData: soaJson, did },
          children: [''],
        };
        const item = {
          name: 'attendance-input',
          props: { data: i, did, fullData: soaJson, field: 'item' },
          children: [`${i.item || ''}`],
        };
        const mlc_provide = {
          ...checkboxObj,
          props: { ...checkboxObj.props, name: 'mlc_provide' },
        };
        const subcontractor_provide = {
          ...checkboxObj,
          props: { ...checkboxObj.props, name: 'subcontractor_provide' },
        };
        const comments = {
          ...item,
          props: { ...item.props, field: 'comments', name: 'comments' },
          children: [`${i.comments || ''}`],
        };
        index++;
        return {
          ...row,
          children: [
            {
              ...firstCol,
              props: { ...firstCol.props, editable: false },
              children: [`${index}`],
            },
            {
              ...secondCol,
              children: [item],
            },
            { ...thirdCol, children: [mlc_provide] },
            { ...fourthCol, children: [subcontractor_provide] },
            { ...fifthCol, children: [comments] },
            { ...sixthCol, children: [buttonObj] },
          ],
        };
      });

      const actionButtonsProps = {
        row: newRow.length,
        fullData: soaJson,
        did,
      };
      const contentWithActionButtons = [
        ...newRow,
        {
          ...row,
          props: { className: 'soamc-row add-new-container' },
          children: [
            { name: 'add-attendance', props: actionButtonsProps },
            { name: 'add-section', props: actionButtonsProps },
          ],
        },
      ];

      const children = [header, ...contentWithActionButtons];
      return {
        ...object,
        props: {
          ...object.props,
          className: `${object.props.className} schedules-attendances`,
        },
        children,
      };
    }

    const children =
      object && object.children
        ? object.children.map((child) =>
            Config.setScheduleOfAttendancesMC(child, soaJson, did),
          )
        : [];

    return { ...object, children };
  }

  static setSimpleRowQuotePrice = (object, quote, vat = 0) => {
    if (
      typeof object !== 'object' &&
      !Array.isArray(object) &&
      object !== null
    ) {
      return object;
    }

    const { tender = {} } = quote;
    const price = (quote?.price || 0) / 100;

    if (
      object.props &&
      object.props.id &&
      object.props.id === 'SimpleRowQuotePrice'
    ) {
      const [firstRow, secondRow] = object.children;
      const [firstCol, secondCol] = secondRow.children;

      return {
        ...object,
        children: [
          firstRow,
          {
            ...secondRow,
            children: [
              { ...firstCol, children: [tender.label ?? ''] },
              {
                ...secondCol,
                children: [
                  parseCurrency(price, currencyConfig[i18next.t('currency')]),
                ],
              },
            ],
          },
        ],
      };
    }

    if (object.subtype && object.subtype === 'MiniBoqTotal') {
      const subtotal = price;
      return {
        ...object,
        children: [
          {
            ...object.children[0],
            children: [
              object.children[0].children[0],
              {
                name: 'text',
                type: 'column',
                props: {
                  className: 'edit-document-table-column',
                },
                children: [
                  parseCurrency(
                    subtotal,
                    currencyConfig[i18next.t('currency')],
                  ),
                ],
              },
            ],
          },
          object.children[1],
          {
            ...object.children[2],
            children: [
              object.children[2].children[0],
              {
                name: 'text',
                type: 'column',
                props: {
                  className: 'edit-document-table-column',
                },
                children: [
                  parseCurrency(
                    subtotal + subtotal * (vat / 100),
                    currencyConfig[i18next.t('currency')],
                  ),
                ],
              },
            ],
          },
        ],
      };
    }

    const children =
      object && object.children
        ? object.children.map((child) => {
            return Config.setSimpleRowQuotePrice(child, quote, vat);
          })
        : [];

    return { ...object, children };
  };

  static setMiniBoq(object, miniboqJson = [], did = null) {
    if (
      typeof object !== 'object' &&
      !Array.isArray(object) &&
      object !== null
    ) {
      return object;
    }

    if (object.type && object.type === 'MiniBoqTemplate') {
      const [header] = object.children;
      const row = defaultMiniBoqRow;
      const [firstCol, secondCol, thirdCol, fourthCol] = row.children;
      const newRow = miniboqJson.map((i) => {
        if (i.title) {
          return {
            ...row,
            children: [
              { ...firstCol, children: [''] },
              {
                ...firstCol,
                children: [
                  {
                    name: 'miniboq-input',
                    props: { data: i, fullData: miniboqJson, did },
                    children: [''],
                  },
                ],
              },
              { ...secondCol, children: [''] },
              { ...thirdCol, children: [''] },
              { ...fourthCol, children: [''] },
            ],
            props: { className: `${row.props.className} miniboq-section` },
          };
        }
        const moneyObj = {
          name: 'money-input',
          props: { data: i, fullData: miniboqJson, did },
          children: [''],
        };
        const quantity = {
          ...moneyObj,
          props: { ...moneyObj.props, name: 'quantity' },
        };
        const unitPrice = {
          ...moneyObj,
          props: { ...moneyObj.props, name: 'unit_price' },
        };
        const total = {
          ...moneyObj,
          props: { ...moneyObj.props, name: 'total' },
        };
        return {
          ...row,
          children: [
            {
              ...firstCol,
              children: [
                {
                  name: 'miniboq-input',
                  props: { data: i, fullData: miniboqJson, did },
                  children: [''],
                },
              ],
            },
            { ...secondCol, children: [quantity] },
            { ...thirdCol, children: [unitPrice] },
            { ...fourthCol, children: [total] },
          ],
        };
      });
      const contentWithActionButtons = [
        ...newRow,
        {
          ...row,
          props: { className: 'add-new-container' },
          children: [''],
        },
      ];

      const children = [header, ...contentWithActionButtons];
      return {
        ...object,
        props: {
          ...object.props,
          className: `${object.props.className} mini-boq`,
        },
        children,
      };
    }

    if (object.subtype && object.subtype === 'MiniBoqTotal') {
      const subtotal = miniboqJson.reduce((acc, curr) => {
        const total = Number(curr.total) || 0;
        return acc + total;
      }, 0);
      return {
        ...object,
        children: [
          {
            ...object.children[0],
            children: [
              object.children[0].children[0],
              {
                name: 'text',
                type: 'column',
                props: {
                  className: 'edit-document-table-column',
                },
                children: [
                  parseCurrency(
                    subtotal,
                    currencyConfig[i18next.t('currency')],
                  ),
                ],
              },
            ],
          },
          object.children[1],
          {
            ...object.children[2],
            children: [
              object.children[2].children[0],
              {
                name: 'text',
                type: 'column',
                props: {
                  className: 'edit-document-table-column',
                },
                children: [
                  parseCurrency(
                    subtotal + subtotal * 0.2,
                    currencyConfig[i18next.t('currency')],
                  ),
                ],
              },
            ],
          },
        ],
      };
    }

    const children =
      object && object.children
        ? object.children.map((child) =>
            Config.setMiniBoq(child, miniboqJson, did),
          )
        : [];

    return { ...object, children };
  }

  static setTotalTable = (object, values) => {
    if (
      typeof object !== 'object' &&
      !Array.isArray(object) &&
      object !== null
    ) {
      return object;
    }

    if (
      object.props &&
      object.props.id &&
      object.props.id === 'table-with-total'
    ) {
      const total = values.reduce(
        (accumulator, current) => Number(accumulator) + Number(current),
        0,
      );
      const lastRow = object.children[object.children.length - 1];
      const lastColumn = lastRow.children[lastRow.children.length - 1];
      lastColumn.children = [
        `{b:${parseCurrency(total / 100, currencyConfig[i18next.t('currency')])}}`,
      ];
      lastRow.children[lastRow.children.length - 1] = lastColumn;
      object.children[object.children.length - 1] = lastRow;

      return object;
    }

    const children =
      object && object.children
        ? object.children.map((child) => Config.setTotalTable(child, values))
        : [];

    return { ...object, children };
  };

  static setHeaderFooter(
    object,
    header,
    footer,
    info,
    nPage,
    total,
    meta,
    hasNumberDocuments = false,
  ) {
    const { children } = object;
    const [view] = children;
    const newChildren = [
      Config.getHeaderContent(info, header, hasNumberDocuments, meta),
      view,
      Config.getFooterContent(info, footer, nPage, total),
    ];

    return { ...object, children: newChildren };
  }

  static getHeaderContent(info, _header, meta, hasNumberDocuments = false) {
    const name = info && info.name && !hasNumberDocuments ? info.name : '';
    const groupAddress =
      meta.group && meta?.group?.address ? meta.group.address : '';
    const infoAddress =
      info && info.address && !hasNumberDocuments ? info.address : '';

    const addressText = groupAddress || infoAddress || '';

    const address = addressText ? `Address: ${addressText}` : '';
    const regNumber =
      info && info.reg_number && !hasNumberDocuments
        ? `Company Reg.${info.reg_number}`
        : '';
    const website =
      info && info.website && !hasNumberDocuments ? info.website : '';
    const groupLogo = getGroupLogo(meta?.group?.logo);
    const logo = groupLogo || getAccountLogo(info.id);
    return {
      name: 'view',
      props: { className: 'header-viewer', editable: false },
      children: [
        {
          name: 'view',
          props: { className: 'header-logo' },
          children: [
            {
              name: 'image',
              props: { src: logo },
              children: [''],
            },
          ],
        },
        {
          name: 'view',
          props: { className: 'header-info' },
          children: [
            {
              name: 'text',
              children: [name, address, regNumber, website],
            },
          ],
        },
      ],
    };
  }

  static getFooterContent(info, _footer, nPage, total) {
    return {
      name: 'view',
      props: { className: 'footer-viewer', editable: false },
      children: [
        {
          name: 'view',
          props: { className: 'footer-info' },
          children: [`${info.name} | Subcontract Tender Documents`],
        },
        {
          name: 'view',
          props: { className: 'footer-divider' },
          children: [`Page ${nPage} of ${total}`],
        },
      ],
    };
  }

  static createRow(column1 = ' ', column2 = ' ') {
    return {
      name: 'view',
      type: 'row',
      props: { className: 'edit-document-table-row' },
      children: [
        {
          name: 'text',
          type: 'column',
          props: {
            className: 'edit-document-table-column',
          },
          children: [column1],
        },
        {
          name: 'text',
          type: 'column',
          props: {
            className: 'edit-document-table-column',
          },
          children: [column2],
        },
      ],
    };
  }
}

export default Config;
