import React, { useMemo, useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { DataGridPro, GridFooterContainer, GridPagination } from "@mui/x-data-grid-pro";
import moment from "moment";
import isUndefined from "lodash/isUndefined";
import { getQueryStringVars, resetUrl } from "v2/helpers/url";
import TemplateActionsButtons from "v2/apps/clink/pages/tender-templates/actionButtons";
import TemplateModal from "v2/apps/clink/pages/tender-templates/dialog";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from "react-i18next";

const TENDER_PUBLISHED_STATE = 2;
const TENDER_DRAFT_STATE = 1;

const canShowTender = (state) =>
    [TENDER_PUBLISHED_STATE, TENDER_DRAFT_STATE].includes(state);

const CustomFooter = ({ id, tid, openModal, setModalOpen, ta, tender, assets, createTemplate }) => (
    <GridFooterContainer sx={{ display: "flex", justifyContent: "space-between", px: 2 }}>
        <GridPagination sx={{ ml: 0 }} />
        <TemplateModal
            pid={id}
            selectedTid={tid}
            modalOpen={openModal}
            setModalOpen={setModalOpen}
            tenderAddendum={ta}
            tenders={tender.filter((x) => canShowTender(Number(x.state)))}
            assets={assets}
            createTemplate={createTemplate}
        />
    </GridFooterContainer>
);

const TenderTemplatesList = ({ data, projectData, assets, createTemplate, loadTemplates }) => {
    const { id, tender } = projectData;
    const { t } = useTranslation();
    const { tid, tender_addendum: ta } = getQueryStringVars();
    const [openModal, setOpenModal] = useState(!isUndefined(tid));

    useEffect(() => {
        if (!isUndefined(tid)) resetUrl();
    }, [tid]);

    const columns = useMemo(
        () => [
            {
                field: "tender",
                headerName: t("tender"),
                flex: 1,
            },
            {
                field: "name",
                headerName: t("document-type"),
                flex: 1,
                renderCell: (params) => (
                    <Tooltip title={params.row.name} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: "100%" }}>
                            {params.row.name}
                        </Typography>
                    </Tooltip>
                ),
            },
            {
                field: "status",
                headerName: t("status"),
                flex: 0.6,
                renderCell: (params) => {
                    const statusMap = { 0: "Draft", 1: "Published", 3: "Archived" };
                    return <Typography>{statusMap[params.value] || "-"}</Typography>;
                },
            },
            {
                field: "created_at",
                headerName: t("created"),
                flex: 1,
                renderCell: (params) =>
                    moment(params.value, "YYYY-MM-DD HH:mm").format("DD/MM/YYYY HH:mm"),
            },
            {
                field: "actions",
                headerName: t("actions"),
                flex: 1,
                sortable: false,
                filterable: false,
                renderCell: (params) => (
                    <TemplateActionsButtons
                        item={params.row}
                        pid={params.row.pid}
                        id={params.row.id}
                        tid={params.row.tid}
                        loadTemplates={loadTemplates}
                    />
                ),
            },
        ],
        [loadTemplates, t]
    );

    const rows = useMemo(() => {
        if (!data) return [];
        return data
            .map((item, idx) => ({
                id: item.id || idx,
                ...item,
                created_at: moment(item.created_at).isValid()
                    ? moment(item.created_at).toDate()
                    : null,
            }))
            .sort((a, b) => (b?.created_at?.getTime() || 0) - (a?.created_at?.getTime() || 0))
            .sort((a, b) => a?.tender?.localeCompare(b?.tender));
    }, [data]);

    const renderFooter = useCallback(() => {
        return (
            <CustomFooter
                id={id}
                tid={tid}
                openModal={openModal}
                setModalOpen={setOpenModal}
                ta={ta}
                tender={tender}
                assets={assets}
                createTemplate={createTemplate}
            />
        );
    }, [id, tid, openModal, ta, tender, assets, createTemplate]);

    return (
        <>
            {ta && (
                <>
                    <CircularProgress />
                    <Alert severity="success" sx={{ my: 1 }}>
                        {t("creating-tender-addendum")}
                    </Alert>
                </>
            )}

            {rows.length > 0 ? (
                <Box sx={{ width: "100%", mt: 2 }}>
                    <DataGridPro
                        rows={rows}
                        columns={columns}
                        disableRowSelectionOnClick
                        pagination
                        pageSizeOptions={[10]}
                        autoHeight
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10, page: 0 } },
                            sorting: { sortModel: [{ field: "created_at", sort: "desc" }] },
                        }}
                        slots={{ footer: renderFooter }}
                        columnBuffer={0}
                        columnThreshold={0}
                        sx={{
                            "& .MuiDataGrid-footerContainer": {
                                mt: 1,
                            },
                        }}
                    />
                </Box>
            ) : (
                <Box sx={{ mt: 2, p: 2 }}>
                    <Typography variant="h6">{t("no-tender-templates")}</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t("create-first-tender")}
                    </Typography>
                    <TemplateModal
                        pid={id}
                        selectedTid={tid}
                        modalOpen={openModal}
                        setModalOpen={setOpenModal}
                        tenderAddendum={ta}
                        tenders={tender.filter((tend) => canShowTender(Number(tend.state)))}
                        assets={assets}
                        createTemplate={createTemplate}
                    />
                </Box>
            )}
        </>
    );
};

export default TenderTemplatesList;
