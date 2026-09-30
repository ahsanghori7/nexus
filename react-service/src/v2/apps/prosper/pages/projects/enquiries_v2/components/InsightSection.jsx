import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CONSTANTS } from 'clink-components';

const { prosperSuccessMain, veryLightGrey, blackPearl, aiAcordionBg, zambezi, lightGray } = CONSTANTS.colors.prosper;


const InsightSection = ({ title, fieldsAnalyzed, items, defaultExpanded = false, onCitationClick }) => {
    return (
        <Accordion
            data-testid="insight-section-accordion"
            defaultExpanded={defaultExpanded}
            sx={{
                boxShadow: 'none',
                '&:before': { display: 'none' },
                border: `1px solid ${veryLightGrey}`,
                borderRadius: '5px',
                overflow: 'hidden',
                marginBottom: '10px',
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    backgroundColor: aiAcordionBg,
                    borderBottom: 'none',
                    minHeight: '48px',
                    '&.Mui-expanded': {
                        minHeight: '48px',
                        borderBottom: `1px solid ${veryLightGrey}`,
                    },
                    '& .MuiAccordionSummary-content.Mui-expanded': {
                        margin: '12px 0',
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: blackPearl, marginRight: 2 }}>
                        ({fieldsAnalyzed} field{fieldsAnalyzed !== 1 ? 's' : ''} analysed)
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{
                backgroundColor: 'white',
            }}>
                {items.length > 0 ? (
                    <Box component="ul" sx={{ margin: 0, padding: 0 }}>
                        {items.map((item, index) => {
                            const itemKey = `${item.label}-${index}`;
                            const hasCitation = item.pageReferences || item.citation;

                            return (
                                <React.Fragment key={itemKey}>
                                    <Box
                                        component="li"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            listStyle: 'none',
                                            position: 'relative',
                                            paddingY: 1
                                        }}
                                    >
                                        <CheckCircleIcon
                                            sx={{
                                                color: prosperSuccessMain,
                                                fontSize: '20px',
                                                marginRight: '12px',
                                                marginTop: '2px',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, marginBottom: '4px', }}>
                                                {item.label}
                                            </Typography>
                                            {hasCitation ? (
                                                <Typography
                                                    variant="body2"
                                                    onClick={() => onCitationClick(item)}
                                                    sx={{
                                                        color: 'primary.main',
                                                        lineHeight: 1.6,
                                                        marginBottom: '5px',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline',
                                                        '&:hover': {
                                                            color: 'primary.dark',
                                                        }
                                                    }}
                                                >
                                                    {item.value}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: zambezi, lineHeight: 1.6, marginBottom: '5px' }}>
                                                    {item.value}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    {index < items.length - 1 && <Divider component="li" sx={{ borderColor: lightGray, marginBottom: '10px' }} />}
                                </React.Fragment>
                            );
                        })}
                    </Box>
                ) : (
                    <Typography variant="body2" sx={{ color: zambezi, fontStyle: 'italic' }}>
                        No insights available for this section.
                    </Typography>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

InsightSection.propTypes = {
    title: PropTypes.string.isRequired,
    fieldsAnalyzed: PropTypes.number.isRequired,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
        })
    ).isRequired,
    defaultExpanded: PropTypes.bool,
    onCitationClick: PropTypes.func,
};

export default InsightSection;
