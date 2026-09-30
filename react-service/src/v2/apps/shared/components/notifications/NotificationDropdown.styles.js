export const styles = {
  container: {
    width: 400,
    maxHeight: 600,
    bgcolor: 'background.paper',
    borderRadius: 1,
    boxShadow: 3,
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    p: 2,
  },
  title: {
    fontWeight: 600,
  },
  unreadCount: {
    color: 'text.secondary',
    fontWeight: 400,
    ml: 1,
  },
  markAllButton: {
    textTransform: 'none',
    color: 'primary.main',
    fontWeight: 600,
    fontSize: '14px',
    padding: 0,
    '&:hover': {
      bgcolor: 'transparent',
      textDecoration: 'underline',
    },
  },
  tabsContainer: {
    px: 2,
  },
  tabs: {
    minHeight: 40,
    '& .MuiTabs-indicator': {
      bgcolor: 'primary.main',
    },
  },
  tab: {
    textTransform: 'none',
    minHeight: 40,
    fontWeight: 600,
    fontSize: '14px',
  },
  tabBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  tabBadge: {
    ml: 1,
  },
  scrollContainer: {
    maxHeight: 480,
    overflowY: 'auto',
  },
};
