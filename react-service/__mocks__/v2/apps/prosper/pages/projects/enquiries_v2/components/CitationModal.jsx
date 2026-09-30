// __mocks__/CitationModal.jsx
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';

const CitationModal = ({ open, onClose, document, citation }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            data-testid="citation-modal"
        >
            <DialogTitle>
                <Typography variant="h6" component="div">
                    Tender Insights
                </Typography>
            </DialogTitle>
            <DialogContent data-testid="citation-modal-content">
                <Typography variant="body2">
                    Document: {document?.name || 'Unnamed Document'}
                </Typography>
                {citation?.pages && (
                    <Typography variant="body2">
                        Pages: {citation.pages.join(', ')}
                    </Typography>
                )}
                {citation?.text && (
                    <Typography variant="body2">
                        Text: {citation.text.substring(0, 50)}...
                    </Typography>
                )}
                <div
                    style={{
                        width: '100%',
                        height: '300px',
                        backgroundColor: '#f0f0f0',
                        marginTop: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Typography color="textSecondary">
                        [PDF Preview]
                    </Typography>
                </div>
            </DialogContent>
        </Dialog>
    );
};

CitationModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    document: PropTypes.shape({
        url: PropTypes.string,
        name: PropTypes.string,
    }),
    citation: PropTypes.shape({
        pages: PropTypes.array,
        text: PropTypes.string,
    }),
};

export default CitationModal;
