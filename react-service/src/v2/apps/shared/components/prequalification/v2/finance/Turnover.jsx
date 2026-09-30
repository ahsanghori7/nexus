import React, { useState } from 'react';
import { CONSTANTS, Image } from 'clink-components';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { InputWithAdornment } from 'v2/apps/clink/pages/supply-chain-profile/inputs';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';
import Money from 'v2/apps/shared/components/prequalification/v2/form/Money';
import Button from 'v2/apps/shared/components/prequalification/v2/Button';

const { clinkLightPurple, aliceBlue, japaneseIndigo } =
  CONSTANTS.colors.general;
const { SilverSand } = CONSTANTS.colors.prosper;
const { iconBlackBin } = CONSTANTS.s3;
const fontColor = 'rgba(0, 0, 0, 0.6)';

const MAX_LIST_ITEMS = 3;
const Turnover = ({
  data = [],
  dispatch,
  register,
  errors,
  updateTurnover = () => null,
  handleAddTurnover = () => null,
}) => {
  const [localTurnover, setLocalTurnover] = useState(data);
  const { t } = useTranslation();
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;

  const removeTurnover = (year) => dispatch(actions.removeTurnover_V2(year));
  const LIST_ITEMS = data.length;
  return (
    <Box mb={1}>
        <MuiSubtitle>{t('turnover')}</MuiSubtitle>
        <MuiSubtitle red={false}>{t('turnover-subtitle')}</MuiSubtitle>
        {data.map((turn, index) => {
          const isLastYear = index === LIST_ITEMS - 1;
          const name = `turnover[${turn.year}]`;
          const nameProfit = `turnover_profit[${turn.year}]`;
          let errorTurnover = { required: false };
          if (errors.turnover && errors.turnover[turn.year]) {
            errorTurnover = {
              [name]: errors.turnover[turn.year],
              [nameProfit]: errors.turnover_profit[turn.year],
              required: 'Required',
            };
          }
          const handleSetLocalTurnover = (e, nameValue = 'value') => {
            const newLocal = localTurnover.map((l) => {
              if (l.year === turn.year) {
                updateTurnover(turn.year, e.target.value, nameValue);
                return {
                  ...l,
                  [nameValue]: e.target.value,
                };
              }
              return l;
            });
            setLocalTurnover(newLocal);
          };

          const showDelete = Boolean(index) && isLastYear;

          return (
            <Grid key={turn.year} container mb={2}>
              <Grid item xs={showDelete ? 11 : 12} mb={0}>
                <Money
                  sx={{
                    '& .MuiInputAdornment-root': {
                      maxWidth: '110px',
                    },
                    '& input.MuiInputBase-input': {
                      textAlign: 'right',
                    },
                  }}
                  label={turn.year}
                  labelAdornment
                  name={name}
                  value={turn.value || 0}
                  register={register}
                  errors={errors}
                  onBlur={handleSetLocalTurnover}
                />
              </Grid>
              {showDelete && (
                <Grid
                  item
                  xs={1}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    type="button"
                    onClick={() => removeTurnover(turn.year)}
                    sx={{
                      background: 'transparent',
                      border: 'none',
                      p: 0,
                      minWidth: '30px',
                      height: 'calc(100% - 16px)',
                      pt: 1,
                    }}
                  >
                    <Image src={iconBlackBin} />
                  </Button>
                </Grid>
              )}
              <Grid item xs={2} sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    width: '30px',
                    height: '30px',
                    position: 'absolute',
                    left: '70px',
                    top: '0',
                    borderBottom: `2px solid ${clinkLightPurple}`,
                    borderLeft: `2px solid ${clinkLightPurple}`,
                  }}
                />
              </Grid>
              <Grid
                item
                xs={showDelete ? 9 : 10}
                sx={{
                  '& .MuiFormControl-root': {
                    width: '100%',
                    padding: 0,
                    minHeight: '44px',
                    mt: '4px',
                    '& .MuiInputBase-root': {
                      paddingRight: '14px',
                    },
                  },
                  '& .MuiTextField-root': {
                    margin: '0',
                  },
                  '& .MuiInputAdornment-root': {
                    minHeight: '44px',
                    minWidth: '130px',
                    backgroundColor: aliceBlue,
                    borderRight: `1px solid ${SilverSand}`,
                    '& .MuiTypography-root': {
                      fontSize: '14px',
                      fontWeight: 700,
                      color: fontColor,
                    },
                    '&::after': {
                      color: fontColor,
                      bottom: '8px',
                      fontSize: '1rem',
                    },
                  },
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    input: {
                      color: japaneseIndigo,
                      textAlign: 'right',
                    },
                  },
                }}
              >
                <InputWithAdornment
                  disabled={false}
                  errors={errorTurnover}
                  register={register}
                  isMoney
                  name={nameProfit}
                  context={BASE_DIRS.V2.PROSPER}
                  adornment={t('profit-before-tax')}
                  handleBlur={(e) =>
                    handleSetLocalTurnover(e, 'profit_before_tax')
                  }
                  value={
                    turn && turn.profit_before_tax ? turn.profit_before_tax : ''
                  }
                />
              </Grid>
            </Grid>
          );
        })}
        {LIST_ITEMS !== MAX_LIST_ITEMS && (
          <Button
            id="add-turn"
            type="button"
            variant="contained"
            color="error"
            fullWidth
            sx={{ marginBottom: 2.5, fontSize: '17px' }}
            onClick={() => handleAddTurnover(localTurnover)}
          >
            {t('add-past-year')}
          </Button>
        )}
      </Box>
  );
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps)(Turnover);
