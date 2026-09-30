import React from 'react';
import moment from 'moment';

const Name = ({ name, dateTime, status }) => {
  const statusLabel = status ? status.toLowerCase() : '';
  const date = dateTime ? moment(dateTime).format('DD/MM/YYYY') : '';
  const time = dateTime ? moment(dateTime).format('hh:mm') : '';
  const datetime = `${date} at ${time}`;
  return (
    <div className="tender-log-container">
      <div className="tender-log-name">
        <div className="lighter">{`${name} ${statusLabel}`}</div>
        <div className="lighter lower-opacity">{datetime}</div>
      </div>
    </div>
  );
};

export default Name;
