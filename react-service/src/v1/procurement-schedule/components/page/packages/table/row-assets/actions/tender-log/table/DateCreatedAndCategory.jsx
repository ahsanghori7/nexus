import React from 'react';
import moment from 'moment';

const DateCreatedAndCategory = ({ created, type }) => {
  const date = created ? moment(created).format('DD/MM/YYYY') : '';
  return (
    <div className="tender-log-category">
      <div>{date}</div>
      <div className="lighter">{type}</div>
    </div>
  );
};

export default DateCreatedAndCategory;
