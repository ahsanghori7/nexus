import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import Backdrop from '@mui/material/Backdrop';
import Typography from '@mui/material/Typography';
import MUIButton from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import ConfirmModal, {
  Content as ContentModal,
} from 'v2/apps/shared/components/confirm-modal/v2';
import TokenModal from 'v2/apps/prosper/shared/TokenModal';
import { CONSTANTS } from 'clink-components';
import UnlockedModal from './UnlockedModal';

const { white, japaneseIndigo } = CONSTANTS.colors.general;

const Lock = ({
  pid,
  open = true,
  tokenPrices,
  tokens,
  setOpen = () => null,
  unlockProject,
  reduceInfoToken,
  subcontractor,
  claimToken = () => null,
  isTokenUser = false,
  canClaimFreeTokens = false,
}) => {
  const { t } = useTranslation();
  const [confirmUnlockModalOpen, setConfirmUnlockModalOpen] = useState(false);
  const [unlockedModalOpen, setUnlockedModalOpen] = useState(false);
  const [buyTokenModalOpen, setBuyTokenModalOpen] = useState(false);

  const unlockCopy = 'unlock-now';

  const handleClose = () => {
    setOpen(false);
  };

  const textAlign = {
    md: 'center',
    xs: 'center',
  };

  return (
    <Backdrop
      className="lock-backdrop"
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        top: {
          lg: '160px',
          md: '160px',
          sm: '165px',
          xs: '165px',
        },
        zIndex: 3,
      }}
      open={open}
    >
      <Grid
        className="lock-container"
        container
        spacing={0}
        sx={{
          background: white,
          borderTop: `1px solid ${japaneseIndigo}`,
          borderBottom: `1px solid ${japaneseIndigo}`,
          height: 102,
          width: '100%',
          padding: 3,
          position: 'absolute',
          top: -2,
        }}
        alignItems="center"
      >
        <Grid
          className="lock-container-button"
          item
          xs={12}
          textAlign={textAlign}
        >
          <ConfirmModal
            id="lock-container-modal-1"
            openModal={confirmUnlockModalOpen}
            handleClose={() => setConfirmUnlockModalOpen(false)}
            openButtonModal={
              <MUIButton
                color="secondary"
                variant="contained"
                fullWidth
                size="large"
                onClick={() => {
                  if (tokens) {
                    setConfirmUnlockModalOpen(true);
                  } else {
                    setBuyTokenModalOpen(true);
                  }
                }}
                sx={{
                  width: {
                    xs: 118,
                    md: 198,
                  },
                  height: 51,
                  lineHeight: 1,
                }}
              >
                {!isTokenUser && t('unlock')}
                {isTokenUser && (
                  <Typography
                    variant="normal"
                    sx={{
                      fontWeight: 200,
                      whiteSpace: 'nowrap',
                      '& > strong': { fontWeight: 600 },
                    }}
                    data-i18n="[html]content.body"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        t(unlockCopy, {
                          interpolation: { escapeValue: false },
                        })
                      ),
                    }}
                  />
                )}
              </MUIButton>
            }
          >
            <ContentModal
              title="confirm-unlocking"
              cancel="cancel"
              confirm="confirm"
              description={
                isTokenUser
                  ? 'confirm-unlocking-text'
                  : 'confirm-unlocking-text-2'
              }
              handleCancel={() => setConfirmUnlockModalOpen(false)}
              handleAccept={() => {
                unlockProject(pid).then(() => {
                  setConfirmUnlockModalOpen(false);
                  setUnlockedModalOpen(true);
                });
              }}
            />
          </ConfirmModal>
          <UnlockedModal
            open={unlockedModalOpen}
            setOpen={() => {
              handleClose();
              setUnlockedModalOpen(false);
            }}
            reduceInfoToken={reduceInfoToken}
          />
          <TokenModal
            externalOpen={buyTokenModalOpen}
            title="buy-more-tokens-title-3"
            tokenPrices={tokenPrices}
            subcontractor={subcontractor}
            onHiddenModal={() => setBuyTokenModalOpen(false)}
            canClaimFreeTokens={canClaimFreeTokens}
            claimToken={claimToken}
          />
        </Grid>
      </Grid>
    </Backdrop>
  );
};

export default Lock;
