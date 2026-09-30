import React from 'react';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import Attach from '../../../../../../../../public/images/icons/svg/attach-green.svg';
import Table from '../../../../../../../../../global/components/table';
import Actions from './Actions';
import Name from './Name';
import DateCreatedAndCategory from './DateCreatedAndCategory';

const defaultColumns = [
  {
    name: 'Date Created & Category',
    options: {
      filter: false,
    },
  },
  '',
  'Name',
  'Actions',
];

const supplyRows = (sid, data) =>
  data.map((tenderLog) => {
    const {
      id,
      meta,
      status,
      created_at: created,
      tender_history_type: tenderHistoryType,
    } = tenderLog;
    const validMeta = isObject(meta) && !isArray(meta);
    const hasDocument = validMeta && 'document' in meta;
    const Img = hasDocument ? () => <Attach /> : () => null;
    return [
      <DateCreatedAndCategory
        key={`date-${id}`}
        created={created}
        type={tenderHistoryType}
      />,
      <Img key={`image-${id}`} />,
      <Name
        key={`name-${id}`}
        name={tenderHistoryType}
        dateTime={created}
        status={status}
      />,
      <Actions key={`actions-${id}`} sid={sid} meta={meta} />,
    ];
  });

const TenderLogTable = ({
  sid,
  data = [],
  columns = defaultColumns,
  options = { defaultOptions },
}) => {
  return (
    <Table
      data={supplyRows(sid, data)}
      options={options}
      columns={columns}
      className="packages-component__tender-log-list"
    />
  );
};

export default TenderLogTable;
