import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useContext } from "hooks/context";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import TenderTemplatesList from "v2/apps/clink/pages/tender-templates/list";
import { white } from "v2/constants/colors";
import { useTranslation } from "react-i18next";

const TenderTemplates = ({ projectData }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const context = useContext("clink");
    const [assets, setAssets] = useState([]);
    const [assetsLoaded, setAssetsLoaded] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const { actions } = context;
    const { tenderTemplates, status } = useSelector(
        (state) => state.tenderTemplates
    );

    const templatesLoaded = status === "succeeded";
    const loading =
        status === "loading" ||
        status === "creating" ||
        status === "deleting" ||
        !assetsLoaded;
    const error = status === "error" || !!errorMessage;
    const loaded = templatesLoaded && assetsLoaded;

    const items = useMemo(() => tenderTemplates || [], [tenderTemplates]);

    const loadTemplates = useCallback(
        async (pid) => {
            try {
                await dispatch(actions.fetchTenderTemplates({ pid }));
            } catch (err) {
                setErrorMessage(err?.message || t("error-fetching-templates"));
            }
        },
        [dispatch, actions, t]
    );

    const createTenderTemplates = useCallback(
        async (pid, tid, did) => {
            try {
                const result = await dispatch(
                    actions.createTenderTemplate({ pid, tid, did })
                );

                if (result?.payload?.success && result?.payload?.docId) {
                    navigate(
                        `/document-creator/template/${result.payload.docId}/tender/${tid}`
                    );
                }
            } catch (err) {
                setErrorMessage(err?.message || t("error-creating-template"));
            }
        },
        [dispatch, actions, navigate, t]
    );

    useEffect(() => {
        let isActive = true;

        if (projectData?.id) {
            loadTemplates(projectData.id);

            const fetchAssets = async () => {
                try {
                    const result = await dispatch(
                        actions.fetchTemplates({ type: "tenders" })
                    );
                    if (isActive && result?.payload) {
                        setAssets(result.payload);
                        setAssetsLoaded(true);
                    }
                } catch (err) {
                    if (isActive) {
                        setErrorMessage(err?.message || t("error-fetching-packages"));
                    }
                }
            };

            fetchAssets();
        }

        return () => {
            isActive = false;
        };
    }, [projectData?.id, loadTemplates, dispatch, actions, t]);

    return (
        <Box
            sx={{
                backgroundColor: white,
                borderRadius: "0.5rem",
                flexWrap: "wrap",
                mb: "2rem",
            }}
        >
            {loading && (
                <CircularProgress
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                />
            )}

            {(error || errorMessage) && (
                <Alert severity="error">
                    <Typography variant="body1">
                        {errorMessage || t("error-fetching-form-data")}
                    </Typography>
                </Alert>
            )}

            {loaded && (
                <TenderTemplatesList
                    projectData={projectData}
                    assets={assets}
                    data={items}
                    createTemplate={createTenderTemplates}
                    loadTemplates={loadTemplates}
                />
            )}
        </Box>
    );
};

const TenderTemplatesWrapper = () => {
    const projectData = useSelector((state) => state.project.data);

    if (!projectData || !projectData.id) {
        return (
            <CircularProgress
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            />
        );
    }

    return <TenderTemplates projectData={projectData} />;
};

export default TenderTemplatesWrapper;
