import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {
  white,
  approvedGreen,
  approvedGreenBg,
  rejectedRed,
  rejectedRedBg,
  pendingAmber,
  pendingAmberBg,
  lockedGray,
  lockedGrayBg,
  mutedGray,
  borderGray,
  surfaceGray,
  inkBlack,
  clinkGreen,
} from 'v2/constants/colors';

export const STATUS_CONFIG = {
  approved: {
    color: approvedGreen,
    bg: approvedGreenBg,
    label: 'Approved',
    dotColor: approvedGreen,
  },
  rejected: {
    color: rejectedRed,
    bg: rejectedRedBg,
    label: 'Rejected',
    dotColor: rejectedRed,
  },
  pending: {
    color: pendingAmber,
    bg: pendingAmberBg,
    label: 'Pending',
    dotColor: pendingAmber,
  },
  locked: {
    color: lockedGray,
    bg: lockedGrayBg,
    label: 'Locked',
    dotColor: mutedGray,
  },
};

export const PanelRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: `${white} !important`,
});

export const LevelCard = styled(Box)({
  border: `1px solid ${borderGray}`,
  borderRadius: 10,
  overflow: 'hidden',
  backgroundColor: `${white} !important`,
});

export const LevelHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isLocked',
})({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  backgroundColor: surfaceGray,
  borderBottom: `1px solid ${borderGray}`,
});

export const LevelHeaderLeft = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const LevelTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isLocked',
})(({ isLocked }) => ({
  fontWeight: 700,
  fontSize: 13,
  color: isLocked ? mutedGray : inkBlack,
}));

export const AllMustApproveChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'isLocked',
})(({ isLocked }) => ({
  height: 20,
  fontSize: 10.5,
  fontWeight: 500,
  backgroundColor: isLocked ? lockedGrayBg : white,
  color: mutedGray,
  border: `1px solid ${borderGray}`,
}));

export const IndicatorBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

export const IndicatorLabel = styled(Typography)({
  fontWeight: 600,
  fontSize: 12,
});

export const LockedLabel = styled(Typography)({
  fontSize: 12,
  fontWeight: 600,
  color: lockedGray,
});

export const DividerRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 0',
});

export const DividerText = styled(Typography)({
  fontSize: 12,
  color: mutedGray,
});

export const StyledHeadCell = styled(TableCell)(({ isLocked }) => ({
  backgroundColor: `${white} !important`,
  color: isLocked ? mutedGray : inkBlack,
  fontWeight: 700,
  fontSize: 10.5,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${borderGray}`,
  padding: '9px 16px',
}));

export const StyledBodyCell = styled(TableCell)({
  backgroundColor: `${white} !important`,
  fontSize: 13,
  color: inkBlack,
  borderBottom: `1px solid ${lockedGrayBg}`,
  padding: '11px 16px',
});

export const ApproverRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'isLocked',
})(({ isLocked }) => ({
  opacity: isLocked ? 0.55 : 1,
}));

export const UserCellBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const UserAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'isLocked',
})({
  width: 32,
  height: 32,
  fontSize: 11,
  fontWeight: 700,
  backgroundColor: lockedGrayBg,
  color: mutedGray,
});

export const UserName = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isLocked',
})(({ isLocked }) => ({
  fontWeight: 600,
  fontSize: 13,
  lineHeight: 1.3,
  color: isLocked ? mutedGray : inkBlack,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '50ch',
}));

export const UserEmail = styled(Typography)({
  fontSize: 11,
  color: mutedGray,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '50ch',
});

export const ApprovalStatus = styled(Typography)({
  fontSize: 11,
  color: clinkGreen,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const RoleText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isLocked',
})(({ isLocked }) => ({
  fontSize: 13,
  color: isLocked ? mutedGray : lockedGray,
}));

export const TimestampText = styled(Typography)({
  fontSize: 12,
  color: mutedGray,
  whiteSpace: 'nowrap',
});

export const BadgeBox = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
});

export const BadgePill = styled('span', {
  shouldForwardProp: (prop) => prop !== 'statusKey',
})(({ statusKey }) => {
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
  return {
    fontSize: 11.5,
    fontWeight: 600,
    color: cfg.color,
    backgroundColor: cfg.bg,
    padding: '2px 9px',
    borderRadius: 20,
    display: 'inline-block',
  };
});
