import { Box, FormControl, FormLabel, Stack, Typography } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Lock, Mail, User } from "lucide-react";
import type { LoginPayload } from "../../api/services/users";
import { useNavigate } from "react-router";

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
  user: LoginPayload;
  onChange: (value: LoginPayload) => void;
  handleSubmit: () => void;
};
const UserLoginForm = ({ user, onChange, handleSubmit }: Props) => {
  const navigate = useNavigate();
  const handleRedirect = () => navigate("/signup");
  const handleChange =
    (field: keyof LoginPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...user,
        [field]: e.target.value,
      });
    };
  return (
    <Box
      component="form"
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}
    >
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
      <Button
        type="submit"
        sx={{ marginTop: 2, fontWeight: 600, fontSize: "18px" }}
      >
        Entrar
      </Button>
      <Button
        variant="outlined"
        sx={{ fontWeight: 600, fontSize: "18px" }}
        onClick={handleRedirect}
      >
        Criar Conta
      </Button>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <Typography>Esqueceu sua senha?</Typography>
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
          Recuperar
        </Typography>
      </Box>
    </Box>
  );
};

export default UserLoginForm;
