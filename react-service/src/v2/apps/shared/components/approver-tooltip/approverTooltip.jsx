import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const ApproverTooltip = ({ approvers }) => {
    if (!approvers || approvers?.length === 0) {
        return null;
    }
    return (
        <Box sx={{ p: 0.5 }}>
            {approvers.map((approver) => (
                <Typography key={approver.levelNumber} variant="caption" display="block">
                    {approver.levelNumber && <strong>Level {approver.levelNumber}: </strong>}
                    <Box component="span" sx={{ display: approver.levelNumber ? 'block' : 'inline', ml: approver.levelNumber ? 1 : 0 }}>
                        {approver.names}
                    </Box>
                </Typography>
            ))}
        </Box>
    )
};

ApproverTooltip.propTypes = {
  approvers: PropTypes.arrayOf(
    PropTypes.shape({
      levelNumber: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]),
      names: PropTypes.string,
    })
  ),
};

export default ApproverTooltip;
