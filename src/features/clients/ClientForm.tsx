import {
  Autocomplete,
  Box,
  Divider,
  FormControl,
  FormLabel,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import CustomTextField from "../../components/Textfield/CustomTextfield";
import { ChevronDown, ChevronUp, Info, Minus, Plus, Search } from "lucide-react";
import theme from "../../theme";
import { useState } from "react";
import { Button } from "../../components/Button/Button";

export type ClientFormData = {
  name: string;
  email?: string;
  phone?: string;

  phone_secondary_name?: string;
  phone_secondary?: string;

  phone_tertiary_name?: string;
  phone_tertiary?: string;

  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;

  instagram?: string;
  facebook?: string;
  x?: string;
};

type Props = {
  client: ClientFormData;
  onChange: (data: ClientFormData) => void;
};

export default function ClientForm({ client, onChange }: Props) {
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [addPhone, setAddPhone] = useState(false);
  const handleChange =
    (field: keyof ClientFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...client,
        [field]: e.target.value,
      });
    };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Divider />
      <Box>
        <Typography variant="h6">Cadastro Básico</Typography>
        <Typography fontSize={"12px"} color="text.disabled">
          Campos obrigatórios
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
        <FormControl sx={{ width: "100%" }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            Nome completo
          </FormLabel>
          <CustomTextField
            value={client.name}
            onChange={handleChange("name")}
            required
            placeholder="ex: Pedro da Silva"
          />
        </FormControl>
        <FormControl sx={{ width: "100%" }}>
          <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
            Telefone
          </FormLabel>
          <CustomTextField
            value={client.phone}
            onChange={handleChange("phone")}
            placeholder="ex: (11) 99999-9999"
          />
        </FormControl>
      </Box>
      <Divider />
      <Box>
        <Typography variant="h6">Informações Opcionais</Typography>
        <Typography fontSize={"12px"} color="text.disabled">
          Campos não obrigatórios
        </Typography>
      </Box>
      <FormControl>
        <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>E-mail</FormLabel>
        <CustomTextField
          value={client.email}
          onChange={handleChange("email")}
          placeholder="ex: email@exemplo.com"
        />
      </FormControl>
      <Button
        onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
        variant="text"
        startIcon={showAdditionalInfo ? <ChevronUp /> : <ChevronDown />}
      >
        {showAdditionalInfo ? "Ocultar" : "Mostrar mais informações"}
      </Button>
      {showAdditionalInfo && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Info size={16} color={theme.palette.text.disabled} />
            <Typography fontSize={"13px"} color="text.disabled">
              O endereço ajuda no transporte do pet, quando necessário.
            </Typography>
          </Box>
          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}
          >
            <FormControl sx={{ width: "25%" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>Cep</FormLabel>
              <CustomTextField
                iconPosition="start"
                icon={<Search size={18} />}
                value={client.cep}
                onChange={handleChange("cep")}
                required
              />
            </FormControl>
            <FormControl sx={{ width: "75%" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Endereço
              </FormLabel>
              <CustomTextField
                value={client.street}
                onChange={handleChange("street")}
                placeholder=""
              />
            </FormControl>
          </Box>
          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}
          >
            <FormControl sx={{ width: "25%" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Numero
              </FormLabel>
              <CustomTextField
                value={client.number}
                onChange={handleChange("number")}
                required
              />
            </FormControl>
            <FormControl sx={{ width: "75%" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Complemento
              </FormLabel>
              <CustomTextField
                value={client.complement}
                onChange={handleChange("complement")}
                placeholder=""
              />
            </FormControl>
          </Box>
          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}
          >
            <FormControl sx={{ width: "25%" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>UF</FormLabel>
              <Autocomplete
                value={client.state}
                // sx={{ width: "70%" }}
                options={[]}
                size="small"
                // getOptionLabel={(option) => option.name}
                // onChange={(_, value) => onPetChange(value || undefined)}
                renderInput={(params) => <TextField {...params} />}
              />
            </FormControl>
            <FormControl sx={{ width: "40%" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Bairro
              </FormLabel>
              <CustomTextField
                value={client.neighborhood}
                onChange={handleChange("neighborhood")}
                placeholder=""
              />
            </FormControl>
            <FormControl sx={{ width: "30%" }}>
              <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                Cidade
              </FormLabel>
              <CustomTextField
                value={client.city}
                onChange={handleChange("city")}
                placeholder=""
              />
            </FormControl>
          </Box>
          <Divider />
          <Button
          onClick={()=>setAddPhone(!addPhone)}
            variant="text"
            startIcon={addPhone ? <Minus size={16} /> : <Plus size={16} />}
            sx={{ display: "flex", marginRight: "auto" }}
          >
            {addPhone ? "Ocultar telefones adicionais" : "Adicionar telefone de contato"}
          </Button>
          {addPhone && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl sx={{ width: "40%" }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Telefone 2
                  </FormLabel>
                  <CustomTextField
                    value={client.email}
                    onChange={handleChange("email")}
                    placeholder="ex: (11) 99999-9999"
                  />
                </FormControl>
                <FormControl sx={{ width: "60%" }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Nome do contato 2
                  </FormLabel>
                  <CustomTextField
                    value={client.email}
                    onChange={handleChange("email")}
                  />
                </FormControl>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl sx={{ width: "40%" }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Telefone 3
                  </FormLabel>
                  <CustomTextField
                    value={client.email}
                    onChange={handleChange("email")}
                    placeholder="ex: (11) 99999-9999"
                  />
                </FormControl>
                <FormControl sx={{ width: "60%" }}>
                  <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
                    Nome do contato 3
                  </FormLabel>
                  <CustomTextField
                    value={client.email}
                    onChange={handleChange("email")}
                  />
                </FormControl>
              </Box>
            </Box>
          )}

          <Divider />

          <FormControl>
            <FormLabel sx={{ color: "text.primary", mb: 0.5 }}>
              Redes Sociais
            </FormLabel>
            <Box sx={{ display: "flex", gap: 2 }}>
              <CustomTextField
                placeholder="Instagram"
                value={client.instagram}
                onChange={handleChange("instagram")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          component="img"
                          src="/instagram.png"
                          alt="Instagram"
                          sx={{ width: 30, height: 30 }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <CustomTextField
                placeholder="Facebook"
                value={client.facebook}
                onChange={handleChange("facebook")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          component="img"
                          src="/facebook.png"
                          alt="Facebook"
                          sx={{ width: 30, height: 30 }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <CustomTextField
                placeholder="x (Twitter)"
                value={client.x}
                onChange={handleChange("x")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          component="img"
                          src="/x.png"
                          alt="X"
                          sx={{ width: 30, height: 30 }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </FormControl>
        </Box>
      )}
    </Box>
  );
}
