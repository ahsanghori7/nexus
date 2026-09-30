import React, { useState, useRef } from 'react';
import i18next from 'v2/helpers/i18n';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import EditIcon from '@mui/icons-material/Edit';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TextField from '@mui/material/TextField';
import flag from 'v2/helpers/flags';
import CategoriesService from 'v1/global/services/documents/Categories';
import alert from 'v1/global/helpers/alert';

const Category = ({
  name = '',
  id,
  checkValues = [],
  handleDeleteCategory,
  setFieldValue,
  fieldName,
  files
}) => {
  const [isEditable, setIsEditable] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalName, setOriginalName] = useState(name);

  const inputRef = useRef(null);

  const [elem] = checkValues;
  const { catArray = [] } = elem || {};

  const handleEditClick = () => {
    if (flag('ANZ_PMP')) {
      setIsEditable(true);
      setError('');
      if (inputRef?.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
  };

  const handleSave = async () => {
    setIsEditable(false);
    const trimmed = value.trim();
    if (trimmed === originalName) return;

    const duplicate = catArray.find(
      (cat) => cat.label === trimmed && cat.id !== id,
    );
    if (duplicate) {
      setError('Name already in use');
      setValue(originalName);
      return;
    }

    setLoading(true);
    try {
      const response = await new CategoriesService({}).renameCategory(
        id,
        trimmed,
      );
      if (response?.success) {
        alert(response, null, {
          title: 'Success',
          message: 'Category renamed successfully',
          type: 'success',
        });
        setError('');
        setOriginalName(trimmed);
      } else {
        alert(response, null, {
          title: 'Error',
          message: response?.message || 'Rename failed',
          type: 'error',
        });
        setValue(originalName);
      }
    } catch (e) {
      alert(e, null, null, {
        title: 'Error',
        message: 'An unexpected error occurred while renaming the category.',
        type: 'error',
      });
      setError('Rename failed');
      setValue(originalName);
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = () => {
    if (isEditable) handleSave();
  };

  const deleteHandler = () => {
    const category = checkValues[0]?.catArray?.find(
      (cat) => cat.label === name,
    );
    if (category) {
      handleDeleteCategory(category.id, category.label, () => {
        setFieldValue(fieldName, undefined);
      });

      setOpen(false);
    }
  };

  const openModal = () => {

    if (files.length > 0) {
      setOpen({
        id: 'remove-category',
        navTitle: 'are-you-sure',
        title: 'deleting-categories-warning',
        backdropClick: true,
      });
    } else {
      deleteHandler()
    }
  }


  let InputProps = {
    disableUnderline: true,
    sx: {
      pointerEvents: 'none',
    },
  };

  if (flag('ANZ_PMP')) {
    InputProps = {
      readOnly: !isEditable,
      sx: {
        fontWeight: 'bold',
        '&:hover': {
          backgroundColor: !isEditable ? 'transparent' : undefined,
        },
        '& .MuiInputBase-input': {
          '&.Mui-focused:after': {
            transition: 'none',
            animation: 'none',
          },
        },
      },
    };
  }

  return (
    <>
      {flag('ANZ_PMP') && (
        <Modal open={!!open} setOpen={setOpen}>
          <Grid container>
            <Grid item xs={12}>
              <Typography fontWeight="bold">
                {i18next.t('are-you-sure')}
              </Typography>
              <Typography mt={2}>
                {i18next.t('deleting-categories-warning')}
              </Typography>
              <Typography mt={2} mb={1} fontWeight="bold">
                {i18next.t('want-to-proceed')}
              </Typography>
            </Grid>
            <Grid container item xs={12} justifyContent="space-around" mt={2}>
              <Grid item>
                <Button
                  color="error"
                  variant="contained"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  {i18next.t('cancel')}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  color="success"
                  variant="contained"
                  onClick={deleteHandler}
                  disabled={loading}
                >
                  {i18next.t('delete-category')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Modal>
      )}
      <Grid container alignItems="center">
        <Grid item>
          <TextField
            inputRef={inputRef}
            variant="standard"
            value={value}
            onClick={handleEditClick}
            onChange={handleInputChange}
            error={!!error}
            InputProps={InputProps}
            InputLabelProps={{
              sx: {
                fontWeight: 'bold',
              },
            }}
            size="small"
            onBlur={handleBlur}
          />
        </Grid>
        {flag('ANZ_PMP') && (
          <Grid item>
            {isEditable ? (
              <IconButton className="no-legacy" onClick={handleSave}>
                <DownloadDoneIcon className="no-legacy" />
              </IconButton>
            ) : (
              <IconButton
                className="no-legacy"
                color="primary"
                onClick={handleEditClick}
              >
                <EditIcon className="no-legacy" />
              </IconButton>
            )}
            <IconButton
              className="no-legacy"
              color="secondary"
              onClick={openModal}
            >
              <HighlightOffIcon className="no-legacy" />
            </IconButton>
          </Grid>
        )}
        {error && (
          <Grid item>
            <Typography color="error" fontSize={10}>
              {error}
            </Typography>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default Category;
