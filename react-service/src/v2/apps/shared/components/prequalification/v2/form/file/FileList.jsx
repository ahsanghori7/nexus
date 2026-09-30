import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { goToNewTab, getUrl } from 'v2/helpers/url';

const MAX_LENGTH_FILE_NAME = 40;

const FileList = ({ files = [], removeFile, getDocInfo = null }) => (
  <List>
    {files.map((f) => {
      const [document, aid, idDoc] = getDocInfo || [];
      const openFile = () =>
        Boolean(document) &&
        goToNewTab(
          getUrl(
            'APP_PROSPER',
            `/relay/v1/prequalification/${aid}/download/${idDoc}`,
          ),
        );
      return (
        <ListItem key={`${f.original_file}-${f.document}`}>
          <ListItemText
            primary={
              f &&
              f.original_file &&
              f.original_file.length > MAX_LENGTH_FILE_NAME
                ? f.original_file.substring(0, MAX_LENGTH_FILE_NAME) + '...'
                : (f.original_file ?? '')
            }
            onClick={openFile}
            style={{ cursor: 'pointer' }}
          />
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="delete" onClick={removeFile}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      );
    })}
  </List>
);

export default FileList;
