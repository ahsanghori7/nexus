import React, { useState } from 'react';
import i18next from 'v2/helpers/i18n';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Grid2';
import { goTo, getDocCreatorUrl } from 'v2/helpers/url';
import Relay from 'v1/global/services/Relay';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { clinkGreen, darkGray } from 'v2/constants/colors';

const Form = ({
  quoteInfo = {},
  orderTemplates = [],
  setOpen = () => null,
}) => {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setTemplate(event.target.value);
  };

  const handleSubmit = () => {
    const did = Number(template);
    const qid = quoteInfo && Number(quoteInfo.id);
    const sid =
      quoteInfo &&
      quoteInfo.subcontractor &&
      Number(quoteInfo.subcontractor.id);
    const tid = quoteInfo && quoteInfo.tender_id;
    if (did && qid && sid) {
      setLoading(true);
      const issueOrderRelay = new Relay('order', 'create');
      issueOrderRelay
        .post({}, { qid, sid, did })
        .then((response) => response.json())
        .then((json) => {
          const { id } = json;
          goTo(getDocCreatorUrl(id, 'order', tid));
        })
        .catch((e) => {
          setLoading(false);
          /* eslint no-console: "off" */
          console.error(e);
        });
    }
  };

  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: 'calc(50vh - 90px)',
      },
    },
  };

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="template-label">
          {i18next.t('type-of-order')}
        </InputLabel>
        <Select
          labelId="template-label"
          id="template"
          value={template}
          onChange={handleChange}
          MenuProps={menuProps}
          label={i18next.t('type-of-order')}
          sx={{
            height: 'auto',
            minHeight: 45,
            borderRadius: 2,
            marginBottom: 2,
            '& .MuiSelect-select': {
              textAlign: 'left',
              padding: '12px 14px',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: darkGray,
              borderWidth: 1,
            },

            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: clinkGreen,
            },

            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: clinkGreen,
              borderWidth: 2,
            },
          }}
        >
          {orderTemplates &&
            orderTemplates.map((o) => (
              <MenuItem key={o.id} value={o.id} sx={{ maxWidth: '270px' }}>
                <Tooltip title={o.name} placement="right">
                  <Typography
                    component="div"
                    sx={{
                      fontSize: '15px',
                      fontWeight: 500,
                      width: '100%',
                      maxWidth: '270px',
                    }}
                  >
                    {o.name}
                  </Typography>
                </Tooltip>
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <Grid2 mt={1} container justifyContent="space-evenly">
        <Grid2 item>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => setOpen(false)}
          >
            {i18next.t('cancel')}
          </Button>
        </Grid2>
        <Grid2 item>
          <Button
            fullWidth
            variant="contained"
            color="success"
            disabled={loading || !template}
            onClick={handleSubmit}
          >
            {i18next.t('continue')}
          </Button>
        </Grid2>
      </Grid2>
    </>
  );
};

export default Form;
