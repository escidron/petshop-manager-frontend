import MuiButton, { type ButtonProps } from '@mui/material/Button';
import { CircularProgress } from '@mui/material';

interface Props extends ButtonProps {
  color?: 'primary' | 'secondary' | 'error' | 'success';
  loading?: boolean;
}

export const Button = ({
  variant = 'contained',
  color = 'primary',
  sx,
  loading,
  disabled,
  children,
  ...props
}: Props) => {
  return (
    <MuiButton
      variant={variant}
      color={color ? color : 'primary'}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
      sx={{
        textTransform: 'none',
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};
