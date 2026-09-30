import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useContext } from "hooks/context";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContentText from "@mui/material/DialogContentText";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { getUrl } from "v2/helpers/url";
import DeleteIcon from "v1/global/public/images/svg/bin-icon.svg";
import ViewIcon from "v1/global/public/images/svg/icon-view.svg";
import { useTranslation } from "react-i18next";
import { clinkGreen } from "v2/constants/colors";

const useDeleteDocument = () => {
    const dispatch = useDispatch();
    const { actions } = useContext("clink");
    return async (did, tid, pid, callback) => {
        await dispatch(actions.deleteTenderTemplate({ did, tid, pid }));
        callback?.();
    };
};

const TemplateActionsButtons = ({ tid, id, pid, item, loadTemplates }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const deleteDocument = useDeleteDocument();
    const { status, name } = item;
    const url = getUrl(
        "clink_app_host",
        `document-creator/template/${id}/tender/${tid}`
    );

    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const triggerRef = useRef(null);

    const isMounted = useRef(true);
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const focusTrigger = () =>
        setTimeout(() => triggerRef.current?.focus(), 0);

    const handleDelete = async () => {
        await deleteDocument(id, tid, pid, () => {
            if (!isMounted.current) return;
            setDialogOpen(false);
            loadTemplates(pid);
            focusTrigger();
        });
    };

    const handleCloseDialog = () => {
        if (!isMounted.current) return;
        setDialogOpen(false);
        focusTrigger();
    };

    const handleView = () => {
        if (Number(status) === 3) {
            setSnackbarOpen(true);
        } else {
            navigate(url);
        }
    };

    return (
        <>
            <Box display="flex" gap={2}>
                <Tooltip title={t("view-document")} arrow>
                    <IconButton onClick={handleView} color="primary" size="small">
                        <ViewIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title={t("delete-template")} arrow>
                    <IconButton
                        ref={triggerRef}
                        onClick={() => setDialogOpen(true)}
                        color="error"
                        size="small"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>

                <Dialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle>{t("confirm-delete")}</DialogTitle>
                    <DialogContent dividers>
                        <DialogContentText>
                            {t("delete-template-confirmation-1")}{" "}
                            <Typography
                                component="span"
                                color="error"
                                fontWeight="bold"
                            >
                                {name}
                            </Typography>
                            ? {t("delete-template-confirmation-2")}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={handleCloseDialog}
                            variant="outlined"
                            sx={{ color: clinkGreen, borderColor: clinkGreen }}
                        >
                            {t("cancel")}
                        </Button>
                        <Button onClick={handleDelete} color="error" variant="outlined">
                            {t("delete")}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity="error"
                    sx={{ width: "100%" }}
                >
                    {t("tender-template-alert-msg")}
                </Alert>
            </Snackbar>
        </>
    );
};

export default TemplateActionsButtons;
