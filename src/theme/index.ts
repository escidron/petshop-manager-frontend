// src/theme/index.ts
import { createTheme } from '@mui/material/styles';
import { red, grey, green } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0A1624',
    },
    secondary: {
      main: '#EEF2F5', // cinza para backgrounds
    },

    success: {
      main: green[600],   // verde padrão
      light: green[300],   // verde bem clarinho (background)
      dark: green[800],
    },

    error: {
      main: red[600],     // vermelho padrão
      light: red[300],     // vermelho claro (background)
      dark: red[800],
    },

    background: {
      default: grey[100],
    },

    text: {
      primary: '#1A1A1A',   // quase preto (confortável)
      secondary: '#FAFAFA', // quase branco
      disabled: '#9E9E9E',  // cinza padrão p/ textos desativados
    },
  },

  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    body1: { fontSize: '1rem' },
  },

  spacing: 8,
});

export default theme;
