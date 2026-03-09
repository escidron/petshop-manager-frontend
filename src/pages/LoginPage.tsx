import { Box, Typography } from "@mui/material";
import CustomCard from "../components/Card/CustomCard";
import { useState } from "react";

import { useNavigate } from "react-router";
import { login, type LoginPayload } from "../api/services/users";
import UserLoginForm from "../features/users/UserLoginForm";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const [userForm, setUserForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const {setUser} = useAuth();
  const handleAuth = async () => {
    try {
      const response = await login(userForm);
      setUser(response);                      // atualiza estado global
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
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
        <Typography variant="h1" color="text.secondary">
          Bem-vindo de volta
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acesse sua conta para continuar gerenciando seu negócio.
        </Typography>
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
          <Typography variant="h1">Entrar</Typography>
          <Typography variant="body1" color="text.disabled">
            Acesse sua conta para continuar gerenciando seu negócio.
          </Typography>
          <UserLoginForm
            user={userForm}
            onChange={setUserForm}
            handleSubmit={handleAuth}
          />
        </CustomCard>
      </Box>
    </Box>
  );
};

export default LoginPage;
