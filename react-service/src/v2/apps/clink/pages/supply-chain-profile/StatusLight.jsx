import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { CONSTANTS } from 'clink-components';

const { amber, darkerRed } = CONSTANTS.colors.general;

const getStatusColor = (status) => {
  switch (status) {
    case 'FINISHED':
      return { color: 'green', text: 'PQQ Completed' };
    case 'NOT_STARTED':
      return { color: darkerRed, text: 'PQQ Not started' };
    default:
      return { color: amber, text: 'PQQ Partially completed' };
  }
};

const StatusLight = ({ statusesRow }) => {
  let statusRow = { ...getStatusColor('STARTED') };
  if (statusesRow) {
    const finished = statusesRow.filter((s) => String(s.status) === '1');
    const notFinished = statusesRow.filter((s) => String(s.status) === '0');
    if (Number(notFinished.length) === Number(statusesRow.length)) {
      statusRow = getStatusColor('NOT_STARTED');
    } else if (Number(finished.length) === Number(statusesRow.length)) {
      statusRow = getStatusColor('FINISHED');
    }
  }
  return (
    Boolean(statusRow?.color) && (
      <Tooltip title={statusRow?.text || 'PQQ Status'}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={2.2}
          data-testid="mui-box-outer"
        >
          <Box
            data-testid="mui-box-inner"
            width={12}
            height={12}
            borderRadius="50%"
            bgcolor={statusRow?.color}
          />
        </Box>
      </Tooltip>
    )
  );
};

StatusLight.propTypes = {
  statusesRow: PropTypes.arrayOf(
    PropTypes.shape({
      status: PropTypes.oneOf(['0', '1']).isRequired,
    })
  ),
};

export default StatusLight;
export { getStatusColor };
