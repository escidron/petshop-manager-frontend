import { useState } from "react";
import { Box, FormControl, FormLabel, Stack, Typography, IconButton, InputAdornment } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
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
  loading?: boolean;
};

const UserLoginForm = ({ user, onChange, handleSubmit, loading }: Props) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleRedirect = () => navigate("/signup");
  const handleChange =
    (field: keyof LoginPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...user,
        [field]: e.target.value,
      });
    };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Scrolla suavemente o campo para o centro do viewport quando o teclado virtual mobile sobe
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 280);
  };

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      sx={{ display: "flex", flexDirection: "column", gap: 2, mt: { xs: 1, sm: 2 } }}
    >
      <FormControl>
        <FormLabel sx={{ color: "#334155", mb: 0.5, fontWeight: 700, fontSize: "0.82rem" }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Mail size={15} color="#313485" />
            <Typography sx={{ fontSize: "inherit", fontWeight: "inherit" }}>Email</Typography>
          </Stack>
        </FormLabel>
        <CustomTextField
          value={user.email}
          required
          type="email"
          autoComplete="email"
          placeholder="ex: nome@email.com"
          onChange={handleChange("email")}
          onFocus={handleFocus}
          slotProps={{
            input: {
              sx: { bgcolor: "#FFFFFF", borderRadius: 2 },
            },
          }}
        />
      </FormControl>

      <FormControl>
        <FormLabel sx={{ color: "#334155", mb: 0.5, fontWeight: 700, fontSize: "0.82rem" }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Lock size={15} color="#313485" />
            <Typography sx={{ fontSize: "inherit", fontWeight: "inherit" }}>Senha</Typography>
          </Stack>
        </FormLabel>
        <CustomTextField
          type={showPassword ? "text" : "password"}
          value={user.password}
          required
          autoComplete="current-password"
          placeholder="Digite sua senha"
          onChange={handleChange("password")}
          onFocus={handleFocus}
          slotProps={{
            input: {
              sx: { bgcolor: "#FFFFFF", borderRadius: 2 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    sx={{ color: "#94A3B8" }}
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </FormControl>

      <Button
        type="submit"
        loading={loading}
        sx={{
          mt: 1,
          fontWeight: 700,
          fontSize: "1rem",
          minHeight: 46,
          borderRadius: 2.5,
        }}
      >
        Entrar
      </Button>

      <Button
        variant="outlined"
        sx={{
          fontWeight: 700,
          fontSize: "0.95rem",
          minHeight: 44,
          borderRadius: 2.5,
        }}
        onClick={handleRedirect}
      >
        Criar Conta
      </Button>

      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
          Esqueceu sua senha?
        </Typography>
        <Typography
          onClick={() => navigate("/forgot-password")}
          variant="body2"
          sx={{
            color: "primary.main",
            cursor: "pointer",
            textUnderlineOffset: "2px",
            textDecoration: "underline",
            ml: 0.75,
            fontWeight: 700,
            fontSize: "0.85rem",
          }}
        >
          Recuperar
        </Typography>
      </Box>
    </Box>
  );
};

export default UserLoginForm;
