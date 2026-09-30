import React from "react";
import { useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Enquiry from "v2/apps/clink/pages/transactions/enquiry";

const TransactionsIssued = () => {
    const projectData = useSelector((state) => state.project?.data);
    const error = useSelector((state) => state.project?.error);
    const loading = useSelector((state) => state.project?.loading);

    if (loading || !projectData?.id) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error">An error occurred while fetching the data</Alert>
            </Box>
        );
    }

    return (
        <Box
            id="transaction-container"
        >
            <Enquiry project={projectData} />
        </Box>
    );
};

export default TransactionsIssued;
