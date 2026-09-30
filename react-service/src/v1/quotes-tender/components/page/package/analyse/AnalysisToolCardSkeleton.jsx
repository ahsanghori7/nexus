import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import i18next from 'v2/helpers/i18n';
import adminColors from 'v2/constants/colors';

const { aiToolCardBorder, aiAnalysisToolsBetaBg, aiAnalysisToolsBetaLabel, white } =
  adminColors;

const AnalysisToolCardSkeleton = ({ title, beta = false }) => (
  <Box
    sx={{
      border: `1px solid ${aiToolCardBorder}`,
      borderRadius: '12px',
      p: 2,
      bgcolor: white,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
    }}
    aria-busy="true"
    aria-label={i18next.t('analysis-tool-loading')}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</Typography>
      {beta && (
        <Chip
          label={i18next.t('beta-chip')}
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: aiAnalysisToolsBetaBg,
            color: aiAnalysisToolsBetaLabel,
            borderRadius: '999px',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      )}
      <Skeleton variant="rounded" width={56} height={22} sx={{ borderRadius: '999px' }} />
    </Box>
    <Box sx={{ mt: 0.5 }}>
      <Skeleton variant="text" width="85%" height={20} />
      <Skeleton variant="text" width="55%" height={18} sx={{ mt: 0.75 }} />
    </Box>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
        mt: 0.5,
      }}
    >
      <Skeleton variant="rounded" width={36} height={36} />
      <Skeleton variant="rounded" width={88} height={32} />
    </Box>
  </Box>
);

export default AnalysisToolCardSkeleton;
