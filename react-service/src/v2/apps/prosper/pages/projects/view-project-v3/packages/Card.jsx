import React from 'react';
import { CONSTANTS, Image } from 'clink-components';
import Grid from '@mui/material/Grid';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import Backdrop from '@mui/material/Backdrop';
import Item from 'v2/apps/prosper/shared/crm-components/Item';
import Subheader from 'v2/apps/prosper/shared/Subheader';
import Subscription from 'v2/helpers/user/subscription';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { makeStyles } from '@mui/styles';

const {
  iconOrangePound,
  iconOrangeStart,
  iconOrangeType,
  iconWhiteLock,
  closedIcon,
  registeredInterestIcon,
} = CONSTANTS.s3;

const subscriptionHelper = new Subscription();

const PackCard = ({
  pack,
  subcontractor,
  unlocked = false,
  handleRegister,
  hideRegister = false,
  showStatus = false,
  open = false,
}) => {
  const { t } = useTranslation();

  const useStyles = makeStyles({
    parent: {
      position: 'relative',
      zIndex: 0,
      minHeight: '175px',
    },
    backdrop: {
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      zIndex: 3,
    },
  });
  const classes = useStyles();
  const {
    registered = false,
    can_register: canRegister = false,
    awarded: closed = false,
    matched = false,
    label: packageName = '*****',
    service: serviceType = '*****',
    startOnSite: startingDate = '*****',
    size: projectSize = '*****',
    id: packageID,
    interest_count: interestCount = 0,
  } = pack;
  let buttonCopy = t(
    registered ? 'label-interest-submitted' : 'label-register-interest'
  );
  buttonCopy = closed ? t('opportunity-closed') : buttonCopy;
  return (
    <Card sx={{ padding: 3 }} className={classes.parent}>
      <Backdrop className={classes.backdrop} open={closed}>
        <Image src={closedIcon} alt="Closed icon" />
      </Backdrop>
      <CardContent sx={{ padding: 0 }}>
        <Grid container>
          {unlocked &&
            ((!canRegister &&
              subscriptionHelper.isTokenUser(subcontractor.subscription_id)) ||
              showStatus) && (
              <Grid
                container
                alignItems="center"
                position="relative"
                m={0}
                sx={{ minHeight: '48px' }}
              >
                <Subheader data={pack} />
              </Grid>
            )}
        </Grid>
        <Grid container>
          <Typography
            sx={{ mb: 1, mt: 2, fontSize: { xs: 16, md: 20 }, fontWeight: 600 }}
            color="text.primary"
          >
            {packageName}
          </Typography>
        </Grid>
        <Grid container>
          <Item
            gridSx={{ flexGrow: 1, width: '33%' }}
            icon={iconOrangeType}
            type="text-service-required"
            value={serviceType}
            mb={1}
            fontSize={{
              xs: '11px',
              md: '14px',
            }}
            gridProp1={{ xs: 6 }}
            gridProp2={{ xs: 6 }}
          />
          <Item
            gridSx={{ flexGrow: 1, width: '33%' }}
            icon={iconOrangeStart}
            type="text-start-on-site"
            value={
              startingDate
                ? String(moment(new Date(startingDate)).format('Do MMMM YYYY'))
                : 'N/A'
            }
            mb={1}
            fontSize={{
              xs: '11px',
              md: '14px',
            }}
            gridProp1={{ xs: 6 }}
            gridProp2={{ xs: 6 }}
          />
          <Item
            gridSx={{ flexGrow: 1, width: '33%' }}
            icon={iconOrangePound}
            type="text-project-size"
            value={projectSize}
            mb={1}
            fontSize={{
              xs: '11px',
              md: '14px',
            }}
            gridProp1={{ xs: 6 }}
            gridProp2={{ xs: 6 }}
          />
        </Grid>
      </CardContent>
      <CardActions sx={{ padding: 0 }}>
        <Grid container flexDirection="column" mt={matched ? 3 : 0}>
          {matched && (
            <Grid
              container
              item
              mb={0.5}
              justifyContent="center"
              alignItems="center"
            >
              <Grid item>
                <Image
                  width={62}
                  src={registeredInterestIcon}
                  alt="Registered Interest Icon"
                />
              </Grid>
              <Grid item paddingLeft={1} paddingRight={1}>
                <Typography textAlign="center" fontSize={{ xs: 20 }}>
                  <strong style={{ fontWeight: 600 }}>
                    {interestCount > 5 ? '5+ ' : `${interestCount} `}
                  </strong>
                </Typography>
              </Grid>
              <Grid item maxWidth={80}>
                <Typography
                  textAlign="left"
                  fontSize={{ xs: 12, md: 14 }}
                  fontWeight={200}
                  lineHeight={1.3}
                >
                  {t('registered-interests')}
                </Typography>
              </Grid>
            </Grid>
          )}
          {!hideRegister && (
            <Grid item mb={0}>
              <Button
                disabled={registered || closed}
                color="secondary"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  '& > span': {
                    display: 'flex !important',
                  },
                }}
                onClick={() =>
                  !registered && !closed && handleRegister(packageID)
                }
              >
                <Typography>{buttonCopy}</Typography>
                {open && (
                  <Image src={iconWhiteLock} style={{ marginLeft: '10px' }} />
                )}
              </Button>
            </Grid>
          )}
        </Grid>
      </CardActions>
    </Card>
  );
};

export default PackCard;
