import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const { prosperAIPurple } = CONSTANTS.colors.prosper;
const { white } = CONSTANTS.colors.general;

const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
        color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.common.black,
        padding: '10px',
    },
}));

const AIAnalysisButton = ({ hasViewed = false, onClick, disabled = false, tooltipTitle = null }) => {
    const { t } = useTranslation();
    const buttonText = hasViewed ? t("view-tender-insights") : t("analyze-with-ai");

    const ButtonComponent = (
        <Button
            variant="contained"
            size="medium"
            startIcon={<AutoAwesomeIcon />}
            onClick={onClick}
            disabled={disabled}
            sx={{
                backgroundColor: prosperAIPurple,
                color: white,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '12px',
                padding: '7px',
                minHeight: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '4px',
                '& .MuiButton-icon': {
                    marginLeft: '-1px',
                    marginRight: '3px',
                    '& > svg': {
                        fontSize: '18px',
                    },
                },
                '&:hover': {
                    backgroundColor: prosperAIPurple,
                    opacity: 0.9,
                },
                "&.Mui-disabled": {
                    backgroundColor: prosperAIPurple,
                    opacity: 0.5,
                    color: white,
                }
            }}
            data-testid="ai-analysis-button"
        >
            {buttonText}
        </Button>
    );

    if (disabled && tooltipTitle) {
        return (
            <CustomTooltip title={tooltipTitle} placement="top">
                <Box>
                    {ButtonComponent}
                </Box>
            </CustomTooltip>
        );
    }

    return ButtonComponent;
};

AIAnalysisButton.propTypes = {
    hasViewed: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    tooltipTitle: PropTypes.string,
};

export default AIAnalysisButton;
