import { createAsyncThunk } from "@reduxjs/toolkit";
import Relay from "v2/services/relay";

const relay = new Relay('relay', '', '');
export const fetchTenderTemplates = createAsyncThunk(
    "tender_template/fetchTenderTemplates",
    async ({ pid, tid, status, approval_status }) => {
        const result = await relay.get("", {
            action: "tender_template",
            method: "fetchAll",
            pid,
            ...(tid ? { tid } : {}),
            ...(status ? { status } : {}),
            ...(approval_status ? { approval_status } : {}),
        });

        if (result.status === 200) {
            return result.json();
        }

        return result.status;
    }
);

export const createTenderTemplate = createAsyncThunk(
    "tender_template/createTenderTemplate",
    async ({ tid, did, pid }) => {
        return relay
            .post({}, '', {
                action: "tender_template",
                method: "create",
                tid,
                did,
                pid,
            })
            .then((result) => (result.status === 200 ? result.json() : result.status))
            .catch((error) => error.status);
    },
);

export const deleteTenderTemplate = createAsyncThunk(
    "tender_template/deleteTenderTemplate",
    async ({ did, tid, pid }) => {
        return relay
            .post({}, '', {
                action: "tender_template",
                method: "remove",
                tid,
                did,
                pid,
            })
            .then((result) => (result.status === 200 ? result.json() : result.status))
            .catch((error) => error.status);
    },
);
