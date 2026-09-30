import React from "react";
import { Box, Button, Typography } from "@mui/material";

const isFilterActive = (type, filter) => {
  if (filter === false) return false;

  return (
    ((type === "recent" || type === "issued") && filter === "recent") ||
    ((type === "archive" || type === "withdrawn") && filter === "archived")
  );
};

const Header = ({ filtersConfig, filter }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
      <Box display="flex" alignItems="center" gap={2}>
        {filtersConfig.map((filterConfig) => {
          const active = isFilterActive(filterConfig.type, filter);

          return (
            <Button
              key={filterConfig.type}
              size="small"
              onClick={filterConfig.applyFilter}
              sx={{
                px: 2,
                borderRadius: 1,
                fontWeight: active ? "bold" : "normal",
                backgroundColor: active ? "primary.light" : "transparent",
                color: active ? "primary.contrastText" : "text.primary",
                "&:hover": {
                  backgroundColor: active
                    ? "primary.main"
                    : "action.hover",
                },
              }}
            >
              <Typography
                variant="body2"
                fontWeight={active ? "bold" : "normal"}
              >
                {filterConfig.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{ ml: 0.5 }}
                fontWeight={active ? "bold" : "normal"}
              >
                ({filterConfig.count || 0})
              </Typography>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};

export default Header;
