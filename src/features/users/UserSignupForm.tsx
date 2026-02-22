import { Box, FormControl, FormLabel, Stack, Typography } from "@mui/material";
import CustomTextField from "../../components/Textfield/CustomTextfield";
import { Button } from "../../components/Button/Button";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserFormData } from "./types";
import { userSchema } from "./schemas";
import { DEFAULT_USER_FORM } from "./constants";
import { useState } from "react";

type Props = {
  onSubmit: (data: UserFormData) => void;
};
const UserSignupForm = ({ onSubmit }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const handleRedirect = () => navigate("/login");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { ...DEFAULT_USER_FORM },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
      {/* Nome */}
      <FormControl error={!!errors.name}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <User size={18} />
            <Typography>Nome completo</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              required
              placeholder="ex: Pedro da Silva"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
      </FormControl>

      {/* Email */}
      <FormControl error={!!errors.email}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Mail size={16} />
            <Typography>Email</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              required
              placeholder="ex: nome@email.com"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
      </FormControl>

      {/* Senha */}
      <FormControl error={!!errors.password}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Lock size={16} />
            <Typography>Senha</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              icon={
                showPassword ? (
                  <EyeOff
                    style={{ cursor: "pointer" }}
                    size={16}
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    style={{ cursor: "pointer" }}
                    size={16}
                    onClick={() => setShowPassword(true)}
                  />
                )
              }
              iconPosition="end"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Digite sua senha"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          )}
        />
      </FormControl>

      {/* Confirmar Senha */}
      <FormControl error={!!errors.confirmPassword}>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Lock size={16} />
            <Typography>Confirmar senha</Typography>
          </Stack>
        </FormLabel>

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              icon={
                showConfirmPassword ? (
                  <EyeOff
                    style={{ cursor: "pointer" }}
                    size={16}
                    onClick={() => setShowConfirmPassword(false)}
                  />
                ) : (
                  <Eye
                    style={{ cursor: "pointer" }}
                    size={16}
                    onClick={() => setShowConfirmPassword(true)}
                  />
                )
              }
              iconPosition="end"
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Digite sua senha"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
          )}
        />
      </FormControl>

      <Button
        sx={{ marginTop: 2, fontWeight: 600, fontSize: "18px" }}
        onClick={handleSubmit((data: UserFormData) => onSubmit(data))}
      >
        Criar conta
      </Button>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <Typography>Ja possui uma conta?</Typography>
        <Typography
          onClick={handleRedirect}
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
