import React, { useEffect } from 'react';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Button from '@mui/material/Button';

const SendWithContactsButton = ({
  dispatch,
  aid,
  did,
  templates,
  meta,
  disabled,
  'data-testid': dataTestId = 'document-creator-send-btn',
}) => {
  const context = useContext('clink');
  const { actions } = context;
  const docSlug = meta?.config?.slug;
  const tenderLabel = meta?.quote?.tender?.label;
  const companyLabel = meta?.quote?.subcontractor?.name;

  useEffect(() => {
    dispatch(actions.fetchTemplates());
  }, [dispatch, actions]);

  useEffect(() => {
    const template = templates.find((t) => t.meta.includes(docSlug));
    if (template) {
      dispatch(
        actions.setTenderTemplates([
          {
            id: did,
            name: template.name,
            created_at: template.created_at,
            tender: tenderLabel,
          },
        ]),
      );
    }
  }, [dispatch, actions, did, templates, docSlug, tenderLabel]);

  const handleOpen = () => {
    dispatch(
      actions.setOpenContactsModal({
        subcontractors: [{ sub_id: aid, name: companyLabel }],
      }),
    );
  };

  return (
    <Button
      sx={{ mr: 1 }}
      color="success"
      variant="contained"
      onClick={handleOpen}
      disabled={disabled}
      data-testid={dataTestId}
    >
      {i18next.t('send')}
    </Button>
  );
};

const mapStateToProps = (state) => ({
  templates: state?.templates?.list || [],
});

export default connect(mapStateToProps)(SendWithContactsButton);
