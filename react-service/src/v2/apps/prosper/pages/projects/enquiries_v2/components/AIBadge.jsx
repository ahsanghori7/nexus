import React from 'react';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';

const { prosperAIPurple } = CONSTANTS.colors.prosper;
const { white } = CONSTANTS.colors.general;

const AIBadge = () => {
    const { t } = useTranslation();

    return (
        <Chip
            icon={<AutoAwesomeIcon />}
            label={t('ai-analysis-available')}
            size="medium"
            sx={{
                backgroundColor: prosperAIPurple,
                color: white,
                fontWeight: 'bold',
                fontSize: '12px',
                marginLeft: '5px',
                '& .MuiChip-icon': {
                    fontSize: '18px',
                    color: white,
                    marginLeft: '5px',
                    marginRight: '0.1px',
                },
                '& .MuiChip-label': {
                    paddingLeft: '4px',
                    paddingRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                },
            }}
            data-testid="ai-badge"
        />
    );
};

export default AIBadge;
