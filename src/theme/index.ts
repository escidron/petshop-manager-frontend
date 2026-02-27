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
      paper: "#FFF",
    },

    text: {
      primary: "#3d4048",
      secondary: "#FAFAFA",
      disabled: "#9E9E9E",
    },
  },

  typography: {
    // fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
    // fontFamily: "'Poppins', 'Roboto', sans-serif",
    // fontFamily: "'Montserrat', 'Roboto', sans-serif",
    // fontFamily: "'DM Sans', 'Roboto', sans-serif",
    // fontFamily: "'Nunito', 'Roboto', sans-serif",
    // fontFamily: "'IBM Plex Sans', 'Inter', sans-serif",
    // fontFamily: "'Satoshi', 'Inter', sans-serif",
    // fontFamily: "'Plus Jakarta Sans', sans-serif",
    // fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    // fontFamily: "'Manrope', 'Inter', sans-serif",

    h1: { fontSize: "2rem", fontWeight: 700 },
    h2: { fontSize: "1.75rem", fontWeight: 600 },
    h5: { fontSize: "20px", fontWeight: 600 },
    h6: { fontSize: "18px", fontWeight: 600 },
    subtitle1: { fontSize: "16px", fontWeight: 500 },
    body2: { fontSize: "13px" },
    caption: { fontSize: "12px" },
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
    },
  },

  spacing: 8,
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
        },
      },
    },
  },
});

export default theme;
