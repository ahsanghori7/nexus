import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonMui from '@mui/material/Button';
import MuiDialog from 'v2/apps/shared/components/dialog';
import ActionsDropdown from 'v2/apps/admin/ActionsDropdown';
import { Button } from 'clink-components';
import { getUrl, goTo } from 'v2/helpers/url';
import TransferList from './TransferList';

const Actions = ({ data, actions = [], context = 'admin' }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <ActionsDropdown
      content={actions.map((action) => {
        switch (action.id) {
          case 10: // TODO: Show this when is finished
            return (
              <>
                <Button
                  handleClick={() => setOpen(true)}
                  key={action.id}
                  layout="dropdown"
                  align="right"
                  data-testid="features-button-update-features"
                >
                  {action.text}
                </Button>
                <MuiDialog
                  title="Update features"
                  open={open}
                  handleClose={() => setOpen(false)}
                  handleXClose={() => setOpen(false)}
                  actions={
                    <>
                      <ButtonMui
                        design="link"
                        data-testid="features-dialog-button-reset"
                        onClick={() => {
                          setOption([]);
                          setter([]);
                          if (hasCookie) {
                            Cookies.remove(hasCookie, subdomain);
                          }
                        }}
                      >
                        {t('reset-filters')}
                      </ButtonMui>
                      <ButtonMui
                        design="red"
                        data-testid="features-dialog-button-apply"
                        onClick={() => {
                          closeModal();
                          setter(option);
                          updateValues(option);
                        }}
                      >
                        {t('apply')}
                      </ButtonMui>
                    </>
                  }
                  context={context}
                >
                  <TransferList />
                </MuiDialog>
              </>
            );
          case 2:
            return (
              <Button
                handleClick={() => {
                  if (action.text === t('settings')) {
                    goTo(`${getUrl('admin', `features/${data.account_id}`)}`);
                  }
                }}
                key={action.id}
                layout="dropdown"
                align="right"
                data-testid="features-button-settings"
              >
                {action.text}
              </Button>
            );
          default:
            return null;
        }
      })}
    />
  );
};

export default Actions;
