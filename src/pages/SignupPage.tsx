import { Box, Typography } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import { DEFAULT_USER_FORM } from "../features/users/constants";
import { useState } from "react";
import UserSignupForm, {
  type User,
  type UserForm,
} from "../features/users/UserSignupForm";
import { createUser } from "../api/services/users";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import type { TenantForm } from "../features/tenants/TenantForm";
import { DEFAULT_TENANT_FORM } from "../features/tenants/constants";
import TenantCreateForm from "../features/tenants/TenantForm";
import { createTenant } from "../api/services/tenants";
import { useNavigate } from "react-router";

const SignupPage = () => {
  const [userForm, setUserForm] = useState<UserForm>(DEFAULT_USER_FORM);
  const [user, setUser] = useState<User | null>(null);
  const [tenantForm, setTenantForm] = useState<TenantForm>(DEFAULT_TENANT_FORM);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  console.log(loading);

  const handleSubmitUser = async () => {
    try {
      setLoading(true);
      const newUser = await createUser(userForm);
      setUser(newUser);
      toast.success("Usuário criado com sucesso");
    } catch (error: unknown) {
      let message = "Erro inesperado ao criar usuário";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
      }
      console.error(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTenant = async () => {
    try {
      setLoading(true);
      if (user !== null) {
        const newTenant = await createTenant(tenantForm, user?.id);
        if (newTenant) {
          toast.success("Estabelecimento criado com sucesso");
          navigate("/");
        }
      }
    } catch (error: unknown) {
      let message = "Erro inesperado ao criar Estabelecimento";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.detail ?? message;
      }
      console.error(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        p: 4,
      }}
    >
      <Box
        sx={{
          width: "40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "primary.main",
          borderRadius: 10,
          p: 4,
        }}
      >
        {!user && (
          <>
            <Typography variant="h1" color="text.secondary">
              Bem-vindo!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Centralize a gestão do seu estabelecimento e ganhe mais tempo para
              cuidar do que realmente importa.
            </Typography>
          </>
        )}
        {user && (
          <>
            <Typography variant="h1" color="text.secondary">
              Estamos quase lá
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Agora só falta criar seu estabelecimento para começar a usar a
              plataforma.
            </Typography>
          </>
        )}
        <img
          src="/signup.png"
          alt="signup"
          style={{
            width: "80%",
            height: "80%",
            objectFit: "contain",
          }}
        />{" "}
      </Box>
      <Box
        sx={{
          width: "60%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CustomCard sx={{ maxWidth: "550px", maxHeight: "600px" }}>
          {!user && (
            <>
              <Typography variant="h1">Criar conta</Typography>
              <Typography variant="body1" color="text.disabled">
                Crie sua conta e comece a gerenciar seu negocio em poucos
                minutos.
              </Typography>
              <UserSignupForm
                user={userForm}
                onChange={setUserForm}
                handleSubmit={handleSubmitUser}
              />
            </>
          )}

          {user && (
            <>
              <Typography variant="h1">Crie seu estabelecimento</Typography>
              <Typography variant="body1" color="text.disabled">
                Preencha as informações abaixo. Você poderá editar tudo depois.
              </Typography>
              <TenantCreateForm
                tenant={tenantForm}
                onChange={setTenantForm}
                handleSubmit={handleSubmitTenant}
              />
            </>
          )}
        </CustomCard>
      </Box>
    </Box>
  );
};

export default SignupPage;
