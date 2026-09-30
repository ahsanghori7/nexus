import React from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import { CONSTANTS } from 'clink-components';
import downloadAnalysisExport from './downloadAnalysisExport';
import { handleUnauthorized } from 'v2/helpers/session';

const { clinkGreen } = CONSTANTS.colors.general;

// Helper function to get color based on quality rating
const getQualityColor = (quality) => {
  switch (quality) {
    case 'High':
      return clinkGreen;
    case 'Medium':
      return 'orange';
    case 'Low':
      return 'red';
    default:
      return 'inherit';
  }
};

const ExecutiveSummaryTable = ({ data, packageId }) => {
  // Check if we have data and extract executive summary
  if (!data || !data.analysis_results?.executive_summary) {
    return <Typography>No executive summary data available</Typography>;
  }

  const {
    key_findings = [],
    price_comparison = [],
    programme_comparison = [],
    quote_quality_assessment = [],
    recommendations = [],
  } = data.analysis_results.executive_summary;

  const handleDownload = (format = 'docx') => {
    downloadAnalysisExport(packageId, format).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error downloading file:', error);
    });
  };

  // Render key findings section
  const renderKeyFindings = () => (
    <Accordion sx={{ mb: 1, border: 'none', boxShadow: 'none' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">
          <b>Key Findings</b> ({key_findings.length} items)
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ textAlign: 'justify', paddingLeft: '32px' }}>
        <List>
          {key_findings.map((finding) => (
            <ListItem key={uuidv4()}>
              <ListItemText
                primary={`• ${finding}`}
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.9rem',
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );

  // Helper function to determine price comparison columns based on data format
  const getPriceComparisonColumns = () => {

    // Check if any item has price_includes field (new format)
    const isNewFormat = price_comparison.some(item => 'price_includes' in item);

    if (isNewFormat) {
      return [
        { id: 'subcontractor', label: 'Subcontractor' },
        { id: 'total_price', label: 'Total Price' },
        { id: 'price_includes', label: 'Price Includes' },
      ];
    }

    // Old format
    return [
      { id: 'subcontractor', label: 'Subcontractor' },
      { id: 'total_price', label: 'Total Price' },
      { id: 'tax_included', label: 'VAT Included' },
    ];
  };

  // Render price comparison section with dynamic columns
  const renderPriceComparison = () => {
    const columns = getPriceComparisonColumns();

    return (
      <Accordion sx={{ mb: 1, border: 'none', boxShadow: 'none' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            <b>Price Comparison</b> ({price_comparison.length} subcontractors)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ textAlign: 'justify', paddingLeft: '32px' }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.id} sx={{ fontWeight: 'bold' }}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {price_comparison.map((item) => (
                  <TableRow key={uuidv4()}>
                    {columns.map((column) => (
                      <TableCell key={`${uuidv4()}-${column.id}`}>
                        {item[column.id] || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    );
  };

  // Render programme comparison section
  const renderProgrammeComparison = () => (
    <Accordion sx={{ mb: 1, border: 'none', boxShadow: 'none' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">
          <b>Programme Comparison</b> ({programme_comparison.length}{' '}
          subcontractors)
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ textAlign: 'justify', paddingLeft: '32px' }}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Subcontractor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Lead-in Period
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total Weeks</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Constraints</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {programme_comparison.map((item) => (
                <TableRow key={uuidv4()}>
                  <TableCell>{item.subcontractor}</TableCell>
                  <TableCell>{item.lead_in_period}</TableCell>
                  <TableCell>{item.total_weeks}</TableCell>
                  <TableCell>{item.constraints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );

  // Render quality assessment section
  const renderQualityAssessment = () => (
    <Accordion sx={{ mb: 1, border: 'none', boxShadow: 'none' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">
          <b>Quote Quality Assessment</b> ({quote_quality_assessment.length}{' '}
          subcontractors)
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ textAlign: 'justify', paddingLeft: '32px' }}>
        {quote_quality_assessment.map((assessment) => (
          <Box key={uuidv4()} sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                px: 2,
                py: 1,
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1">
                {assessment.subcontractor}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: getQualityColor(assessment.quality),
                }}
              >
                <b>{assessment.quality}</b>
              </Typography>
            </Box>

            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <b>Strengths:</b>
              </Typography>
              <List dense>
                {assessment?.strengths?.map((strength) => (
                  <ListItem key={uuidv4()}>
                    <ListItemText
                      primary={`• ${strength}`}
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '0.85rem',
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
                <b>Weaknesses:</b>
              </Typography>
              <List dense>
                {assessment?.weaknesses?.map((weakness) => (
                  <ListItem key={uuidv4()}>
                    <ListItemText
                      primary={`• ${weakness}`}
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '0.85rem',
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            {assessment !==
              quote_quality_assessment[quote_quality_assessment.length - 1] && (
              <Divider sx={{ mt: 2 }} />
            )}
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );

  // Render recommendations section
  const renderRecommendations = () => (
    <Accordion sx={{ mb: 1, border: 'none', boxShadow: 'none' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">
          <b>Recommendations</b> ({recommendations.length} items)
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ textAlign: 'justify', paddingLeft: '32px' }}>
        <List>
          {recommendations.map((recommendation, index) => (
            <ListItem key={uuidv4()}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    <b>{index + 1}.</b> {recommendation}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box sx={{ p: 2, overflow: 'scroll', maxHeight: '85vh' }}>
      {renderKeyFindings()}
      {renderPriceComparison()}
      {renderProgrammeComparison()}
      {renderQualityAssessment()}
      {renderRecommendations()}
      {/* Download Button - positioned at the top */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => handleDownload('docx')}
        >
          Download Full Report
        </Button>
      </Box>
    </Box>
  );
};

ExecutiveSummaryTable.propTypes = {
  data: PropTypes.shape({
    analysis_results: PropTypes.shape({
    executive_summary: PropTypes.shape({
      key_findings: PropTypes.arrayOf(PropTypes.string),
      price_comparison: PropTypes.arrayOf(
        PropTypes.shape({
          subcontractor: PropTypes.string,
          total_price: PropTypes.string,
          vat_included: PropTypes.string,
          price_includes: PropTypes.string,
          tax_included: PropTypes.string,
        }),
      ),
      programme_comparison: PropTypes.arrayOf(
        PropTypes.shape({
          subcontractor: PropTypes.string,
          lead_in_period: PropTypes.string,
          total_weeks: PropTypes.string,
          constraints: PropTypes.string,
        }),
      ),
      quote_quality_assessment: PropTypes.arrayOf(
        PropTypes.shape({
          subcontractor: PropTypes.string,
          quality: PropTypes.string,
          strengths: PropTypes.arrayOf(PropTypes.string),
          weaknesses: PropTypes.arrayOf(PropTypes.string),
        }),
      ),
      recommendations: PropTypes.arrayOf(PropTypes.string),
    }),
    }),
  }),
  packageId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ExecutiveSummaryTable;
