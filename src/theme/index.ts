import { createTheme } from "@mui/material/styles";
import { red, grey, green, amber, blue } from "@mui/material/colors";
import { ptBR } from "@mui/material/locale";

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
    fontFamily: "'Outfit', sans-serif",
    h1: { fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontSize: "1.75rem", fontWeight: 700 },
    h4: { fontSize: "1.5rem", fontWeight: 700 },
    h5: { fontSize: "1.25rem", fontWeight: 600 },
    h6: { fontSize: "1.125rem", fontWeight: 600 },
    subtitle1: { fontSize: "1rem", fontWeight: 500 },
    body1: { fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    caption: { fontSize: "0.75rem" },
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
    MuiAutocomplete: {
      defaultProps: {
        noOptionsText: "Nenhum resultado encontrado",
        loadingText: "Carregando...",
      },
      styleOverrides: {
        noOptions: {
          color: "#3d4048",
        },
      },
    },
  },
}, ptBR);

export default theme;
