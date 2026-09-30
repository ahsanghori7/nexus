import React from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const ArchiveDialog = ({ open, enquiry, onClose, onConfirm }) => {
    const { t } = useTranslation();
    if (!enquiry) return null;

    const isArchived = enquiry.archived;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                {t("archive-dialog-title", { action: isArchived ? t("revert") : t("archive") })}
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {isArchived
                        ? t("archive-dialog-revert-text")
                        : t("archive-dialog-archive-text")}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>{t("archive-dialog-cancel")}</Button>
                <Button color="error" onClick={() => onConfirm(enquiry)}>
                    {t("archive-dialog-confirm", { action: isArchived ? t("revert") : t("archive") })}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ArchiveDialog;
