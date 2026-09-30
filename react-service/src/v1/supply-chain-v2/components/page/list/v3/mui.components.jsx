import React from 'react';
import i18next from 'v2/helpers/i18n';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PlaceIcon from '@mui/icons-material/Place';
import ConstructionIcon from '@mui/icons-material/Construction';

const Collapse = ({
  text = '',
  row,
  array = [],
  detailPanelExpandedRowIds,
  setDetailPanelExpandedRowIds,
}) => {
  let icon;

  switch (text) {
    case 'trades':
      icon = <ConstructionIcon />;
      break;
    case 'locations':
      icon = <PlaceIcon />;
      break;
    default:
      icon = '-';
  }

  const handleToggle = () => {
    if (row && detailPanelExpandedRowIds.includes(row.id)) {
      setDetailPanelExpandedRowIds([]);
    } else {
      setDetailPanelExpandedRowIds([row.id]);
    }
  };

  return array && array.length ? (
    <Box>
      <Button variant="sc-trades-locations" onClick={handleToggle}>
        <Typography>
          {icon}
          {detailPanelExpandedRowIds.includes(row.id) ? (
            text
          ) : (
            <Typography component="span">
              {array.length} {array.length === 1 ? text.slice(0, -1) : text}
            </Typography>
          )}
        </Typography>
      </Button>
    </Box>
  ) : (
    '-'
  );
};

const TradesLocations = ({ title, array }) => {
  return (
    <Box>
      <Typography component="p" variant="tradesLocations">
        {title}:
      </Typography>
      {array && [...array].sort((a, b) => a.label.localeCompare(b.label)).map((arrayItem) => arrayItem.label).join(', ')}
    </Box>
  );
};

const DetailPanelContent = ({ row }) => {
  const { trades, locations } = row;
  const tradesLength = trades && trades.length;
  const locationsLength = locations && locations.length;

  return (
    <Box sx={{ py: 2, px: 3 }}>
      {tradesLength || locationsLength ? (
        <>
          {tradesLength && (
            <TradesLocations title={i18next.t('trades')} array={trades} />
          )}
          {locationsLength && (
            <TradesLocations title={i18next.t('locations')} array={locations} />
          )}
        </>
      ) : (
        <TradesLocations title={i18next.t('no-trades-location')} />
      )}
    </Box>
  );
};

export { Collapse, DetailPanelContent };
