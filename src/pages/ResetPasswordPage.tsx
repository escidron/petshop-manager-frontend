import { useState } from "react";
import { Box, Typography, Button, Stack, FormControl, FormLabel, alpha, Divider } from "@mui/material";
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
        background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 50%, #E2E8F0 100%)",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Blobs for Visual Depth */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          bgcolor: "rgba(49, 52, 133, 0.03)",
          filter: "blur(80px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          bgcolor: "rgba(76, 175, 80, 0.04)",
          filter: "blur(100px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ width: "100%", maxWidth: 460, p: 2, zIndex: 1 }}>
        <CustomCard
          sx={{
            p: 4.5,
            borderRadius: 6,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.04)",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Circular Icon Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "success.main",
                boxShadow: "0 8px 20px rgba(76, 175, 80, 0.08)",
              }}
            >
              <ShieldCheck size={30} />
            </Box>
          </Box>

          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ mb: 1, letterSpacing: "-0.5px" }}>
              Nova Senha
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ fontSize: "0.95rem", px: 2 }}>
              Informe o código recebido no e-mail e defina a sua nova senha de acesso.
            </Typography>
          </Box>

          <form onSubmit={handleReset}>
            <Stack spacing={2.5}>
              <FormControl>
                <FormLabel sx={{ color: "text.primary", fontWeight: 700, mb: 0.75, fontSize: "0.85rem", textAlign: "center" }}>
                  Código de 6 dígitos
                </FormLabel>
                <CustomTextField
                  value={formData.otp_code}
                  required
                  placeholder="000000"
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' } }}
                  onChange={(e) => setFormData({ ...formData, otp_code: e.target.value })}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                    }
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel sx={{ color: "text.primary", fontWeight: 700, mb: 0.75, fontSize: "0.85rem" }}>Nova Senha</FormLabel>
                <CustomTextField
                  type="password"
                  value={formData.new_password}
                  required
                  placeholder="Defina sua nova senha"
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                    }
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel sx={{ color: "text.primary", fontWeight: 700, mb: 0.75, fontSize: "0.85rem" }}>Confirmar Senha</FormLabel>
                <CustomTextField
                  type="password"
                  value={formData.confirm_password}
                  required
                  placeholder="Confirme a nova senha"
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                    }
                  }}
                />
              </FormControl>

              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                sx={{
                  py: 1.6,
                  fontWeight: 700,
                  fontSize: "1rem",
                  bgcolor: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.dark",
                    transform: "translateY(-1px)",
                    boxShadow: "0 8px 20px rgba(25, 118, 210, 0.25)",
                  },
                  borderRadius: 3,
                  display: "flex",
                  gap: 1,
                  transition: "all 0.2s ease",
                  textTransform: "none",
                  mt: 1,
                }}
                fullWidth
              >
                {loading ? "Processando..." : "Alterar Senha"}
                {!loading && <ShieldCheck size={18} />}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3.5 }} />

          <Box sx={{ textAlign: "center" }}>
            <Button
              startIcon={<ArrowLeft size={16} />}
              onClick={() => navigate("/forgot-password")}
              sx={{
                textTransform: "none",
                color: "text.primary",
                fontWeight: 600,
                fontSize: "0.9rem",
                "&:hover": {
                  color: "primary.main",
                  bgcolor: "transparent",
                }
              }}
            >
              Voltar para etapa anterior
            </Button>
          </Box>
        </CustomCard>
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;
