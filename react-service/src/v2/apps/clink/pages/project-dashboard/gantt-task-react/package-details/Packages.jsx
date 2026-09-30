import React from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid2';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';

import EditDate from './EditDate';
import Header from './Header';
import { statuses } from 'v2/store/reducers/clink/project/helper';

const shouldDisableDate = (tender) => (d) =>
  d.isAfter(tender.end) || d.isBefore(tender.start);
const Packages = ({ tenders = [], theme, service, size }) => {
  const [expanded, setExpanded] = React.useState(
    tenders && tenders.length === 1 ? [tenders[0].id] : [],
  );

  const handleChange = (key) => {
    setExpanded(
      expanded.includes(key)
        ? expanded.filter((i) => i !== key)
        : [...expanded, Number(key)],
    );
  };

  const { t } = useTranslation();
  const { palette } = theme;

  return tenders.map((tender) => {
    const { id, enquirySentDate } = tender;

    const packStatus = tender.status ? statuses[tender.status - 1] : null;

    return (
      <Box key={id}>
        <Header
          tender={tender}
          packStatus={packStatus}
          expanded={expanded}
          theme={theme}
          handleChange={handleChange}
        />
        <Collapse in={expanded.includes(id)} timeout="auto" unmountOnExit>
          <List disablePadding>
            <ListItem p={1} sx={{ padding: '8px' }}>
              <Grid container>
                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    color={palette.secondaryBlack.main}
                  >
                    {t(enquirySentDate ? 'sent-date' : 'recommended-send-date')}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <EditDate
                    date={tender.start}
                    id={id}
                    enquirySentDate={enquirySentDate}
                    field="send_date"
                    shouldDisableDate={(d) => {
                      return enquirySentDate || d.isAfter(tender.tenderReturn);
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    color={palette.secondaryBlack.main}
                  >
                    {t('tender_return_date')}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <EditDate
                    date={tender.tenderReturn}
                    id={id}
                    field="tender_return"
                    shouldDisableDate={shouldDisableDate(tender)}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    color={palette.secondaryBlack.main}
                  >
                    {t('decision-date')}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <EditDate
                    date={tender.decisionDate}
                    defaultDate={tender.tenderReturn}
                    id={id}
                    field="decision_date"
                    shouldDisableDate={shouldDisableDate(tender)}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    color={palette.secondaryBlack.main}
                  >
                    {t('start_on_site')}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <EditDate
                    date={tender.startOnSite}
                    id={id}
                    field="start_on_site"
                    shouldDisableDate={(d) => {
                      let val = d.isBefore(tender.tenderReturn);
                      if (tender.subcontractWorkFinish) {
                        val =
                          d.isBefore(tender.tenderReturn) ||
                          d.isAfter(tender.subcontractWorkFinish);
                      }
                      return val;
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    color={palette.secondaryBlack.main}
                  >
                    {t('subcontract-work-finish')}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <EditDate
                    date={tender.subcontractWorkFinish}
                    defaultDate={tender.startOnSite}
                    id={id}
                    field="subcontract_work_finish"
                    shouldDisableDate={(d) => {
                      return d.isBefore(tender.startOnSite);
                    }}
                  />
                </Grid>

                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    color={palette.secondaryBlack.main}
                  >
                    {t('service')}
                  </Typography>
                </Grid>
                <Grid size={6} textAlign="right">
                  <Typography variant="body2">
                    {service[String(tender.service)]}
                  </Typography>
                </Grid>

                <Grid item mt={0.5} mb={0.5} size={6}>
                  <Typography
                    variant="subtitle2"
                    color={palette.secondaryBlack.main}
                  >
                    {t('size')}
                  </Typography>
                </Grid>
                <Grid size={6} textAlign="right">
                  <Typography variant="body2">
                    {size[String(tender.size)]}
                  </Typography>
                </Grid>
              </Grid>
            </ListItem>
          </List>
        </Collapse>
      </Box>
    );
  });
};
export default Packages;
