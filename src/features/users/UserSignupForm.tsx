import { Box, FormControl, FormLabel, Stack, Typography } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Lock, Mail, User } from "lucide-react";

export type UserForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type User = {
  id: number; // id gerado pelo backend
  name: string;
  email: string;
  is_active: boolean;
  phone?: string; // opcional se não preenchido
  role: string;
  created_at: string; // ou Date, dependendo do retorno
};

type Props = {
  user: UserForm;
  onChange: (value: UserForm) => void;
  handleSubmit: () => void;
};
const UserSignupForm = ({ user, onChange, handleSubmit }: Props) => {
  const handleChange =
    (field: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...user,
        [field]: e.target.value,
      });
    };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <User size={18} />
            <Typography>Nome completo</Typography>
          </Stack>
        </FormLabel>

        <CustomTextField
          value={user.name}
          required
          placeholder="ex: Pedro da Silva"
          onChange={handleChange("name")}
        />
      </FormControl>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Mail size={16} />
            <Typography>Email</Typography>
          </Stack>
        </FormLabel>
        <CustomTextField
          value={user.email}
          required
          placeholder="ex: nome@email.com"
          onChange={handleChange("email")}
        />
      </FormControl>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Lock size={16} />
            <Typography>Senha</Typography>
          </Stack>
        </FormLabel>
        <CustomTextField
          type="password"
          value={user.password}
          required
          placeholder="Digite sua senha"
          onChange={handleChange("password")}
        />
      </FormControl>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Lock size={16} />
            <Typography>Confirmar senha</Typography>
          </Stack>
        </FormLabel>
        <CustomTextField
          type="password"
          value={user.confirmPassword}
          required
          placeholder="Digite sua senha"
          onChange={handleChange("confirmPassword")}
        />
      </FormControl>
      <Button
        sx={{ marginTop: 2, fontWeight: 600, fontSize: "18px" }}
        onClick={handleSubmit}
      >
        Criar conta
      </Button>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <Typography>Ja possui uma conta?</Typography>
        <Typography
          sx={{
            color: "primary.main",
            cursor: "pointer",
            textUnderlineOffset: "2px",
            textDecoration: "underline",
            ml: 1,
            fontWeight: 600,
          }}
        >
          Entrar
        </Typography>
      </Box>
    </Box>
  );
};

export default UserSignupForm;
