// src/theme/index.ts
import { createTheme } from "@mui/material/styles";
import { red, grey, green, amber, blue } from "@mui/material/colors";

const theme = createTheme({
  palette: {
    primary: {
      main: "#313485",
    },
    secondary: {
      main: "#EAECEF",
    },

    success: {
      main: green[600],
      light: green[300],
      dark: green[800],
    },

    error: {
      main: red[600],
      light: red[300],
      dark: red[800],
    },

    warning: {
      main: amber[600],
      light: amber[300],
      dark: amber[800],
    },

    info: {
      main: blue[600],
      light: blue[300],
      dark: blue[800],
    },

    background: {
      default: grey[100],
    },

    text: {
      primary: "#3d4048",
      secondary: "#FAFAFA",
      disabled: "#9E9E9E",
    },
  },

  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: { fontSize: "2rem", fontWeight: 700 },
    h2: { fontSize: "1.75rem", fontWeight: 600 },
    body1: { fontSize: "1rem" },
  },

  spacing: 8,
});

export default theme;
