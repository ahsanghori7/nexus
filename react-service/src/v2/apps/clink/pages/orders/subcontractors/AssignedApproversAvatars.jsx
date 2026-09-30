import React from 'react';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import {
  getOrderStatusColor,
  getApproverInitials,
} from 'v2/apps/clink/pages/orders/subcontractors/helpers';
import Tooltip from '@mui/material/Tooltip';

const AssignedApproversAvatars = ({ assignedApprovers = [] }) => {
  if (!assignedApprovers || assignedApprovers.length === 0) return null;

  return (
    <AvatarGroup
      data-testid="assigned-approvers-avatars"
      max={3}
      sx={{
        mt: 0.5,
        justifyContent: 'flex-start',
        flexDirection: 'row',
        '& .MuiAvatar-root': {
          width: 24,
          height: 24,
          fontSize: 12,
        },
      }}
    >
      {assignedApprovers.map((app) => {
        const statusLabel = app?.status?.label || app?.status;
        const key = getOrderStatusColor(statusLabel);
        const firstname = app?.user?.firstname || '';
        const lastname = app?.user?.lastname || '';
        const fullName = `${firstname} ${lastname}`.trim() || '';

        return (
          <Tooltip key={app.id} title={fullName} arrow placement="top">
            <Avatar
              data-testid={`approver-avatar-${app.id}`}
              sx={{
                bgcolor: key === 'disabled' ? 'grey.400' : `${key}.main`,
                color: 'white',
              }}
            >
              {getApproverInitials(firstname, lastname)}
            </Avatar>
          </Tooltip>
        );
      })}
    </AvatarGroup>
  );
};

export default AssignedApproversAvatars;
