import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import i18next from 'v2/helpers/i18n'

const RejectionFeedbackCard = ({
  onAcknowledge,
  feedback
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Box>
      {/* Action Required Alert */}
      <Alert
        severity="warning"
        icon={<ErrorOutlineIcon fontSize='small' />}
        sx={{
          mb: 2,
          mt: 2
        }}
      >
        <Typography
          fontWeight={600}
          color='warning.dark'>
          {i18next.t('action-required-review-rejection-feedback')}
        </Typography>

        <Typography color='warning.dark'>
          {i18next.t('your-tender-has-been-rejected')}
        </Typography>
      </Alert>

      {/* Rejection Feedback Card */}
      <Card
      >
        <CardContent>
          <Box mb={2}>
            <Typography
              variant="h6"
              fontWeight={600}
            >
              {i18next.t('rejection-feedback')}
            </Typography>
          </Box>

          {/* Tender Document Rejected Section */}
          <Card
            variant="outlined"
          >
            <CardContent>
              <Box
               mb={2}
               display="flex"
               justifyContent="space-between"
               alignItems="flex-start"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <ErrorOutlineIcon fontSize="small" color="error" />
                  <Typography fontWeight={600} color="error">
                    {i18next.t('tender-document-rejected')}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={onAcknowledge}
                >
                  {i18next.t('acknowledge')}
                </Button>
              </Box>

              {/* Feedback Text */}
              <Box ml={2} height={isExpanded ? 'none' : '30px'} overflow="hidden">
                <Typography
                  fontSize="small"
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {feedback}
                </Typography>
              </Box>

              {/* Read more / Show less button */}
              <Box>
                <Button
                  size="small"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <KeyboardArrowDownIcon
                  fontSize='small'
                    sx={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                  {isExpanded ? i18next.t('show-less') : i18next.t('read-more')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Box>
  )
}

export default RejectionFeedbackCard
