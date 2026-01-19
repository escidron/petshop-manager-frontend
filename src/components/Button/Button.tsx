import MuiButton, { type ButtonProps } from '@mui/material/Button';

interface Props extends ButtonProps {
  color?: 'primary' | 'secondary'; 
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
      color={color === 'primary' ? 'primary' : 'secondary'}
      sx={{
        textTransform: 'none', 
        ...sx,
      }}
      {...props}
    />
  );
};
