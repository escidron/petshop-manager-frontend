import { useState } from "react";
import { Box, Typography, Button, Stack, FormControl, FormLabel } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import CustomTextField from "../components/Textfield/CustomTextfield";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { resetPassword } from "../api/services/users";
import { useToast } from "../hooks/useToast";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    otp_code: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (formData.otp_code.length !== 6) {
      toast.error("O código deve ter 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: formData.email,
        otp_code: formData.otp_code,
        new_password: formData.new_password,
      });
      toast.success("Senha alterada com sucesso!");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao alterar senha. Verifique o código e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        bgcolor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 500, p: 2 }}>
        <Button
          startIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/forgot-password")}
          sx={{ mb: 4, textTransform: "none", color: "text.secondary" }}
        >
          Voltar
        </Button>

        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={900} color="primary.main">
            Nova Senha
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Informe o código recebido no e-mail e sua nova senha.
          </Typography>
        </Box>

        <CustomCard sx={{ p: 4, borderRadius: 5, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
          <form onSubmit={handleReset}>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Código de 6 dígitos</FormLabel>
                <CustomTextField
                  value={formData.otp_code}
                  required
                  placeholder="000000"
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' } }}
                  onChange={(e) => setFormData({ ...formData, otp_code: e.target.value })}
                  fullWidth
                />
              </FormControl>

              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Nova Senha</FormLabel>
                <CustomTextField
                  type="password"
                  value={formData.new_password}
                  required
                  placeholder="********"
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  fullWidth
                />
              </FormControl>

              <FormControl>
                <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Confirmar Senha</FormLabel>
                <CustomTextField
                  type="password"
                  value={formData.confirm_password}
                  required
                  placeholder="********"
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  fullWidth
                />
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                  borderRadius: 2,
                  display: "flex",
                  gap: 1
                }}
                fullWidth
              >
                {loading ? "Processando..." : "Alterar Senha"}
                {!loading && <ShieldCheck size={18} />}
              </Button>
            </Stack>
          </form>
        </CustomCard>
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;
