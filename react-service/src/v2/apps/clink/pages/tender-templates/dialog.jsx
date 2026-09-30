import React, { useEffect, useRef, useState, useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid2";
import { clinkGreen, white } from "v2/constants/colors";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const TA_LABEL = "Tender Addendum";

const getOptions = (items) =>
  Array.isArray(items)
    ? items
      .map((item) => ({
        id: item?.id,
        value: item?.id,
        label: item?.name || item?.label,
      }))
      .sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
      )
    : [];

const TemplateModal = ({
  pid,
  assets = [],
  tenders = [],
  selectedTid = null,
  tenderAddendum = false,
  createTemplate,
  modalOpen = false,
  setModalOpen,
  styles = {},
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({ asset: "", tender: "" });
  const [errors, setErrors] = useState({});
  const isMountedRef = useRef(true);
  const buttonRef = useRef(null);
  const timeoutRef = useRef();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formConfig = useMemo(() => {
    const assetOptions = getOptions(assets);
    const tenderOptions = getOptions(tenders);
    const selectedTender =
      selectedTid != null
        ? getOptions(tenders.filter((x) => Number(x.id) === Number(selectedTid)))[0]
        : "";

    return {
      initialValues: {
        tender: selectedTender || "",
        asset: "",
      },
      formFields: [
        { name: "asset", label: t("select-tender"), options: assetOptions },
        { name: "tender", label: t("select-package"), options: tenderOptions },
      ],
    };
  }, [assets, tenders, selectedTid, t]);

  useEffect(() => {
    setFormValues(formConfig.initialValues);
    setErrors({});
  }, [modalOpen, formConfig]);

  useEffect(() => {
    const autoCreate = async () => {
      if (tenderAddendum && !loading) {
        const taDoc = assets.filter(
          (a) => a?.name?.toUpperCase() === TA_LABEL.toUpperCase()
        );
        if (taDoc.length > 0) {
          if (isMountedRef.current) setLoading(true);
          const [did] = getOptions([taDoc[0]]);
          try {
            const docId = await createTemplate(pid, selectedTid, did?.id);
            if (docId && isMountedRef.current) {
              navigate(`/document-creator/template/${docId}/tender/${selectedTid}`);
            }
          } finally {
            if (isMountedRef.current) setLoading(false);
          }
        }
      }
    };
    autoCreate();
  }, [loading, tenderAddendum, assets, pid, selectedTid, createTemplate, navigate]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleClose = () => {
    setModalOpen(false);
    timeoutRef.current = setTimeout(() => buttonRef.current?.focus(), 0);
  };

  const handleChange = (field, value) => {
    const selectedOption = formConfig.formFields
      .find((f) => f.name === field)
      ?.options.find((opt) => opt.value === value);
    setFormValues((prev) => ({ ...prev, [field]: selectedOption || "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.asset) newErrors.asset = t("field-required");
    if (!formValues.tender) newErrors.tender = t("field-required");
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    const { asset, tender } = formValues;
    await createTemplate(pid, tender.value, asset.value);
    if (isMountedRef.current) setModalOpen(false);
  };

  return (
    !tenderAddendum && (
      <>
        <Button
          data-testid="add-new-tender-btn"
          ref={buttonRef}
          onClick={() => setModalOpen(true)}
          sx={{ backgroundColor: clinkGreen, color: white }}
          variant="contained"
          style={styles}
        >
          <AddIcon /> {t("add-new-tender")}
        </Button>

        <Dialog data-testid="create-tender-document-modal" open={modalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{t("create-tender-document")}</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle2">{t("choose-tender-type-package")}</Typography>
            <form onSubmit={handleSubmit}>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} direction="column">
                  {formConfig.formFields.map((field) => (
                    <Grid key={field.name}>
                      <TextField
                        select
                        fullWidth
                        label={field.label}
                        value={formValues[field.name]?.value || ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        error={!!errors[field.name]}
                        helperText={errors[field.name]}
                        inputProps={{ 'data-testid': `${field.name}-select` }}
                      >
                        {field.options.map((opt) => (
                          <MenuItem
                            key={opt.value}
                            value={opt.value}
                            data-testid={`${field.name}-option-${opt.value}`}
                          >
                            <Typography
                              noWrap
                              sx={{
                                maxWidth: 360,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {opt.label}
                            </Typography>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <DialogActions sx={{ mt: 2 }}>
                <Button data-testid="go-back-btn" color="error" variant="outlined" onClick={handleClose}>
                  {t("go-back")}
                </Button>
                <Button
                  data-testid="continue-btn"
                  type="submit"
                  variant="outlined"
                  sx={{ color: clinkGreen, borderColor: clinkGreen }}
                >
                  {t("continue")}
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  );
};

export default TemplateModal;
