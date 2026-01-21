import MuiButton, { type ButtonProps } from '@mui/material/Button';

interface Props extends ButtonProps {
  color?: 'primary' | 'secondary' | 'error' | 'success'; 
}

export const Button = ({
  variant = 'contained',  
  color = 'primary',
  sx,
  ...props
}: Props) => {
  return (
    <MuiButton
      variant={variant}
      color={color ? color : 'primary'}
      sx={{
        textTransform: 'none', 
        ...sx,
      }}
      {...props}
    />
  );
};
