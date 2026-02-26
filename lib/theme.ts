import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#db2777', // Deep Pink
      light: '#f9a8d4',
      dark: '#9d174d',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f472b6', // Lighter Pink
      light: '#fbcfe8',
      dark: '#be185d',
      contrastText: '#fff',
    },
    background: {
      default: '#ffffff', // Pure White
      paper: '#ffffff',
    },
    text: {
      primary: '#831843', // Deepest Pink
      secondary: '#be185d', // Medium Pink
    },
    divider: '#fce7f3',
  },
  typography: {
    fontFamily: 'inherit',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(233, 30, 99, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fff',
          color: '#212121',
        },
      },
    },
  },
});

export default theme;
