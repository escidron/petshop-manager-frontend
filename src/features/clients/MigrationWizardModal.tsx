import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button as MuiButton,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
} from "@mui/material";
import { X, Download, ArrowRight, ArrowLeft, CheckCircle2, FileSpreadsheet, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button/Button";
import {
  inspectMigrationFiles,
  downloadConvertedMigrationExcel,
  startMigrationImport,
  type MigrationConfigPayload,
} from "../../api/services/clients";
import { useToast } from "../../hooks/useToast";

type Props = {
  open: boolean;
  onClose: () => void;
  onJobStarted: (jobId: string) => void;
};

const TARGET_CLIENT_FIELDS = [
  { key: "cliente_nome", label: "Nome do Cliente", required: true },
  { key: "cliente_telefone", label: "Telefone Principal", required: true },
  { key: "cliente_email", label: "E-mail do Cliente" },
  { key: "cliente_documento", label: "CPF / CNPJ do Cliente" },
  { key: "cliente_data_nascimento", label: "Data de Nascimento" },
  { key: "cliente_telefone_2", label: "Telefone 2 (Secundário)" },
  { key: "cliente_nome_contato_2", label: "Nome do Contato 2 (ex: Esposa)" },
  { key: "cliente_telefone_3", label: "Telefone 3 (Terciário)" },
  { key: "cliente_nome_contato_3", label: "Nome do Contato 3" },
  { key: "cliente_instagram", label: "Instagram" },
  { key: "cliente_facebook", label: "Facebook" },
  { key: "cliente_cep", label: "CEP do Endereço" },
  { key: "cliente_logradouro", label: "Rua / Logradouro" },
  { key: "cliente_numero", label: "Número" },
  { key: "cliente_complemento", label: "Complemento" },
  { key: "cliente_bairro", label: "Bairro" },
  { key: "cliente_cidade", label: "Cidade" },
  { key: "cliente_estado", label: "Estado (UF)" },
];

const TARGET_PET_FIELDS = [
  { key: "pet_nome", label: "Nome do Pet", required: true },
  { key: "pet_especie", label: "Espécie (Canino, Felino)", required: true },
  { key: "pet_raca", label: "Raça do Pet" },
  { key: "pet_genero", label: "Gênero (Macho, Fêmea)" },
  { key: "pet_porte", label: "Porte (PP, P, M, G, GG)" },
  { key: "pet_tipo_pelagem", label: "Pelagem (Curta, Média, Longa)" },
  { key: "pet_cor_pelagem", label: "Cor da Pelagem" },
  { key: "pet_castrado", label: "Castrado (Sim, Não)" },
  { key: "pet_obito", label: "Falecido / Óbito (0=Não, 1=Sim)" },
  { key: "pet_data_nascimento", label: "Data de Nasc. do Pet" },
  { key: "pet_idade_aproximada", label: "Idade Aproximada" },
  { key: "pet_unidade_idade", label: "Unidade da Idade (Meses/Anos)" },
  { key: "pet_observacoes", label: "Observações do Pet" },
];

// Dictionary of keywords to smartly match competitor column names to system fields
const KEYWORD_MAP: Record<string, string[]> = {
  cliente_nome: ["nome", "razao", "razão", "cliente", "tutor", "proprietario", "proprietário", "dono", "razão social"],
  cliente_telefone: ["tel1", "tel 1", "telefone 1", "celular 1", "cel1", "fone1", "fone 1", "whatsapp", "telefone principal", "celular principal", "tel/cel"],
  cliente_email: ["email", "e-mail", "mail", "e-mail principal", "email principal"],
  cliente_documento: ["cpf", "cnpj", "doc", "documento", "cpf/cnpj", "doc cpf/cnpj"],
  cliente_data_nascimento: ["nasc", "nascimento", "aniversario", "aniversário", "data nasc", "dt nasc"],
  // Telefones extras
  cliente_telefone_2: ["tel2", "tel 2", "telefone 2", "celular 2", "cel2", "fone2", "fone 2", "telefone secundario", "whatsapp 2", "contato 2"],
  cliente_nome_contato_2: ["contato2", "nome contato 2", "responsavel 2", "nome tel 2", "contato secundario"],
  cliente_telefone_3: ["tel3", "tel 3", "telefone 3", "celular 3", "cel3", "fone3", "fone 3", "contato 3"],
  cliente_nome_contato_3: ["contato3", "nome contato 3", "responsavel 3", "nome tel 3"],
  // Redes sociais
  cliente_instagram: ["instagram", "insta", "@instagram"],
  cliente_facebook: ["facebook", "fb", "face"],
  // Endereço
  cliente_cep: ["cep", "zip", "cod postal", "código postal"],
  cliente_logradouro: ["rua", "logradouro", "endereco", "endereço", "end", "lograd"],
  cliente_numero: ["nº", "numero", "número", "num", "n°"],
  cliente_complemento: ["compl", "complemento", "apto", "apartamento"],
  cliente_bairro: ["bairro", "district"],
  cliente_cidade: ["cidade", "municipio", "município", "city"],
  cliente_estado: ["uf", "estado", "state"],
  // Pet
  pet_nome: ["animal", "pet", "bicho", "nome do animal", "nome pet", "nome do pet", "pete"],
  pet_especie: ["especie", "espécie", "tipo animal", "especie animal", "sp", "species"],
  pet_raca: ["raça", "raca", "breed", "rça"],
  pet_genero: ["genero", "gênero", "sexo", "sex", "gender"],
  pet_porte: ["porte", "tamanho", "size"],
  pet_tipo_pelagem: ["pelagem", "pelo", "tipo pelo", "tipo pelagem", "coat"],
  pet_cor_pelagem: ["cor", "pelagem cor", "cor pelo", "cor do pelo"],
  pet_castrado: ["castrado", "castrada", "castra", "castration", "neutered"],
  pet_obito: ["obito", "óbito", "falecido", "falecimento", "deceased", "morto", "morte"],
  pet_data_nascimento: ["nasc pet", "data pet", "data nasc pet", "nascimento pet", "data nascimento animal", "dt nasc"],
  pet_idade_aproximada: ["idade", "age", "idade aprox"],
  pet_unidade_idade: ["unidade idade", "unit", "unidade", "anos/meses", "meses/anos"],
  pet_observacoes: ["obs", "observacao", "observação", "observacoes", "observações", "notas", "notes", "descricao", "descrição"],
};

export default function MigrationWizardModal({ open, onClose, onJobStarted }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0); // 0 = Clientes, 1 = Pets
  const [mode, setMode] = useState<"single_file" | "two_files">("single_file");
  
  // Files & Headers
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [headers1, setHeaders1] = useState<string[]>([]);
  const [headers2, setHeaders2] = useState<string[]>([]);
  const [inspecting, setInspecting] = useState(false);

  // Link keys for two_files mode
  const [clientLinkKey, setClientLinkKey] = useState("");
  const [petLinkKey, setPetLinkKey] = useState("");

  // Column Mappings
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [clientMapping, setClientMapping] = useState<Record<string, string>>({});
  const [petMapping, setPetMapping] = useState<Record<string, string>>({});

  // Default values for missing fields
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({
    pet_especie: "Canino",
    pet_genero: "Desconhecido",
    pet_porte: "M",
  });


  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  const handleInspectFiles = async () => {
    if (!file1) {
      toast.error("Por favor, selecione o arquivo principal.");
      return;
    }
    if (mode === "two_files" && !file2) {
      toast.error("Por favor, selecione o arquivo de Pets.");
      return;
    }

    try {
      setInspecting(true);
      const res = await inspectMigrationFiles(file1, mode === "two_files" ? file2 : null);
      setHeaders1(res.file1_headers);
      setHeaders2(res.file2_headers);

      autoMapHeaders(res.file1_headers, res.file2_headers);

      setInspecting(false);
      setActiveStep(1);
    } catch (error: any) {
      setInspecting(false);
      toast.error(error.response?.data?.detail || "Erro ao ler os cabeçalhos dos arquivos.");
    }
  };

  const findBestHeaderMatch = (fieldKey: string, availableHeaders: string[]): string => {
    const keywords = KEYWORD_MAP[fieldKey] || [fieldKey.replace("cliente_", "").replace("pet_", "")];
    
    // Pass 1: Exact equality match
    for (const h of availableHeaders) {
      const hClean = h.toLowerCase().trim();
      for (const kw of keywords) {
        if (hClean === kw.toLowerCase().trim()) return h;
      }
    }

    // Pass 2: Whole word token match using word boundaries (\b)
    for (const h of availableHeaders) {
      const hClean = h.toLowerCase().trim();
      for (const kw of keywords) {
        const kwClean = kw.toLowerCase().trim();
        const escaped = kwClean.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        if (regex.test(hClean)) {
          return h;
        }
      }
    }

    return "";
  };


  const autoMapHeaders = (h1: string[], h2: string[]) => {
    if (mode === "single_file") {
      const initialMap: Record<string, string> = {};
      [...TARGET_CLIENT_FIELDS, ...TARGET_PET_FIELDS].forEach((f) => {
        const found = findBestHeaderMatch(f.key, h1);
        if (found) initialMap[f.key] = found;
      });
      setMapping(initialMap);
    } else {
      const initialClientMap: Record<string, string> = {};
      TARGET_CLIENT_FIELDS.forEach((f) => {
        const found = findBestHeaderMatch(f.key, h1);
        if (found) initialClientMap[f.key] = found;
      });
      setClientMapping(initialClientMap);

      const initialPetMap: Record<string, string> = {};
      TARGET_PET_FIELDS.forEach((f) => {
        const found = findBestHeaderMatch(f.key, h2);
        if (found) initialPetMap[f.key] = found;
      });
      setPetMapping(initialPetMap);

      const link1 = h1.find((h) => /id|cod|cpf|cliente/i.test(h)) || h1[0] || "";
      const link2 = h2.find((h) => /id|cod|dono|proprietario|cliente/i.test(h)) || h2[0] || "";
      setClientLinkKey(link1);
      setPetLinkKey(link2);
    }
  };

  const buildPayloadConfig = (): MigrationConfigPayload => {
    return {
      mode,
      client_link_key: mode === "two_files" ? clientLinkKey : undefined,
      pet_link_key: mode === "two_files" ? petLinkKey : undefined,
      column_mapping: mode === "single_file" ? mapping : undefined,
      client_column_mapping: mode === "two_files" ? clientMapping : undefined,
      pet_column_mapping: mode === "two_files" ? petMapping : undefined,
      default_values: defaultValues,
    };
  };

  const handleDownloadConverted = async () => {
    if (!file1) return;
    try {
      setProcessing(true);
      const config = buildPayloadConfig();
      await downloadConvertedMigrationExcel(file1, config, file2);
      toast.success("Planilha convertida gerada e baixada com sucesso!");
    } catch {
      toast.error("Erro ao converter e baixar planilha.");
    } finally {
      setProcessing(false);
    }
  };

  const handleImportDirect = async () => {
    if (!file1) return;
    try {
      setProcessing(true);
      const config = buildPayloadConfig();
      const res = await startMigrationImport(file1, config, file2);
      setProcessing(false);
      onJobStarted(res.job_id);
      toast.success(`Migração iniciada com ${res.total_items} registros!`);
      handleClose();
    } catch (error: any) {
      setProcessing(false);
      toast.error(error.response?.data?.detail || "Erro ao iniciar migração.");
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFile1(null);
    setFile2(null);
    setHeaders1([]);
    setHeaders2([]);
    setMapping({});
    setClientMapping({});
    setPetMapping({});
    onClose();
  };

  const countMappedFields = (fields: typeof TARGET_CLIENT_FIELDS, isPet = false) => {
    const mapObj = mode === "single_file" ? mapping : isPet ? petMapping : clientMapping;
    return fields.filter((f) => !!mapObj[f.key]).length;
  };

  const validateRequiredMappings = (): boolean => {
    const missing: string[] = [];

    TARGET_CLIENT_FIELDS.forEach((f) => {
      if (f.required) {
        const val = mode === "single_file" ? mapping[f.key] : clientMapping[f.key];
        if (!val) missing.push(f.label);
      }
    });

    TARGET_PET_FIELDS.forEach((f) => {
      if (f.required) {
        const val = mode === "single_file" ? mapping[f.key] : petMapping[f.key];
        if (!val) missing.push(f.label);
      }
    });

    if (missing.length > 0) {
      toast.error(`Atenção: Mapeie os campos obrigatórios ausentes: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  return (
    <Dialog open={open} onClose={(_, reason) => { if (reason !== "backdropClick" && reason !== "escapeKeyDown") handleClose(); }} disableEscapeKeyDown maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Wand2 size={22} color="#1976d2" />
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Assistente de Migração de Dados
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Stepper Header */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  color: "text.primary",
                  fontWeight: 500,
                  "&.Mui-active": { fontWeight: 700, color: "primary.main" },
                  "&.Mui-completed": { color: "success.main" },
                },
                "& .MuiStepIcon-root": {
                  color: "action.disabled",
                  "&.Mui-active": { color: "primary.main" },
                  "&.Mui-completed": { color: "success.main" },
                },
              }}
            >
              Origem & Arquivos
            </StepLabel>
          </Step>
          <Step>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  color: "text.primary",
                  fontWeight: 500,
                  "&.Mui-active": { fontWeight: 700, color: "primary.main" },
                  "&.Mui-completed": { color: "success.main" },
                },
                "& .MuiStepIcon-root": {
                  color: "action.disabled",
                  "&.Mui-active": { color: "primary.main" },
                  "&.Mui-completed": { color: "success.main" },
                },
              }}
            >
              Mapeamento De-Para
            </StepLabel>
          </Step>
          <Step>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  color: "text.primary",
                  fontWeight: 500,
                  "&.Mui-active": { fontWeight: 700, color: "primary.main" },
                  "&.Mui-completed": { color: "success.main" },
                },
                "& .MuiStepIcon-root": {
                  color: "action.disabled",
                  "&.Mui-active": { color: "primary.main" },
                  "&.Mui-completed": { color: "success.main" },
                },
              }}
            >
              Conversão & Importação
            </StepLabel>
          </Step>
        </Stepper>

        {/* STEP 0: Upload & Mode Selection */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom color="text.primary">
              Como estão os arquivos exportados do seu sistema antigo?
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as any)}>
                <FormControlLabel
                  value="single_file"
                  control={<Radio sx={{ color: "text.primary" }} />}
                  label={
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      Arquivo Único (1 planilha contendo Clientes e Pets juntos)
                    </Typography>
                  }
                />
                <FormControlLabel
                  value="two_files"
                  control={<Radio sx={{ color: "text.primary" }} />}
                  label={
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                      Dois Arquivos Separados (1 planilha de Clientes + 1 planilha de Pets)
                    </Typography>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: mode === "two_files" ? 6 : 12 }}>
                <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2, borderColor: file1 ? "success.main" : "divider", bgcolor: file1 ? "#f1f8e9" : "transparent" }}>
                  {file1 ? <CheckCircle2 size={36} color="#2e7d32" /> : <FileSpreadsheet size={36} color="#1976d2" />}
                  <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600, color: file1 ? "success.dark" : "text.primary" }}>
                    {mode === "two_files" ? "1. Planilha de Clientes" : "Planilha Única (Clientes + Pets)"}
                  </Typography>
                  
                  {file1 ? (
                    <Box mt={1.5} display="flex" justifyContent="center">
                      <Chip
                        icon={<CheckCircle2 size={16} />}
                        label={file1.name}
                        color="success"
                        onDelete={() => setFile1(null)}
                        deleteIcon={<X size={16} />}
                      />
                    </Box>
                  ) : (
                    <MuiButton component="label" size="small" variant="outlined" sx={{ mt: 1.5 }}>
                      Selecionar Arquivo (.xlsx)
                      <input
                        type="file"
                        hidden
                        accept=".xlsx"
                        onChange={(e) => e.target.files?.[0] && setFile1(e.target.files[0])}
                      />
                    </MuiButton>
                  )}
                </Paper>
              </Grid>

              {mode === "two_files" && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 2, borderColor: file2 ? "success.main" : "divider", bgcolor: file2 ? "#f1f8e9" : "transparent" }}>
                    {file2 ? <CheckCircle2 size={36} color="#2e7d32" /> : <FileSpreadsheet size={36} color="#9c27b0" />}
                    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600, color: file2 ? "success.dark" : "text.primary" }}>
                      2. Planilha de Pets
                    </Typography>
                    
                    {file2 ? (
                      <Box mt={1.5} display="flex" justifyContent="center">
                        <Chip
                          icon={<CheckCircle2 size={16} />}
                          label={file2.name}
                          color="success"
                          onDelete={() => setFile2(null)}
                          deleteIcon={<X size={16} />}
                        />
                      </Box>
                    ) : (
                      <MuiButton component="label" size="small" variant="outlined" sx={{ mt: 1.5 }}>
                        Selecionar Arquivo (.xlsx)
                        <input
                          type="file"
                          hidden
                          accept=".xlsx"
                          onChange={(e) => e.target.files?.[0] && setFile2(e.target.files[0])}
                        />
                      </MuiButton>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              💡 O sistema tratará automaticamente DDD, DDI (+55), e pontuações de telefone durante a importação.
            </Alert>
          </Box>
        )}

        {/* STEP 1: 2-Column Table Mapping with Autocomplete */}
        {activeStep === 1 && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }} icon={<Wand2 size={20} />}>
              <Typography variant="body2" fontWeight={600}>
                Mapeamento Automático Concluído!
              </Typography>
              <Typography variant="caption" display="block">
                Na <strong>coluna da esquerda</strong> estão os campos do nosso sistema, e na <strong>coluna da direita</strong> você pode digitar para buscar e selecionar qual coluna da sua planilha preenche aquele dado.
              </Typography>
            </Alert>

            {mode === "two_files" && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary.main">
                  Vínculo entre as duas planilhas (Chave de Ligação):
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" fontWeight={600} color="text.primary">
                      Coluna ID na Planilha de Clientes:
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={clientLinkKey}
                      onChange={(e) => setClientLinkKey(e.target.value)}
                    >
                      {headers1.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                    </Select>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" fontWeight={600} color="text.primary">
                      Coluna ID Dono na Planilha de Pets:
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={petLinkKey}
                      onChange={(e) => setPetLinkKey(e.target.value)}
                    >
                      {headers2.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                    </Select>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Tabs for Clients and Pets */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
                <Tab
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={700} color="text.primary">👤 Dados do Cliente</Typography>
                      <Chip
                        size="small"
                        color="primary"
                        label={`${countMappedFields(TARGET_CLIENT_FIELDS)}/${TARGET_CLIENT_FIELDS.length}`}
                      />
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={700} color="text.primary">🐾 Dados do Pet</Typography>
                      <Chip
                        size="small"
                        color="secondary"
                        label={`${countMappedFields(TARGET_PET_FIELDS, true)}/${TARGET_PET_FIELDS.length}`}
                      />
                    </Box>
                  }
                />
              </Tabs>
            </Box>

            {/* TAB 0: CLIENT FIELDS TABLE */}
            {activeTab === 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                      <TableCell width="40%" sx={{ fontWeight: 700, color: "text.primary", py: 1.5 }}>
                        Campo do Nosso Sistema
                      </TableCell>
                      <TableCell width="60%" sx={{ fontWeight: 700, color: "text.primary", py: 1.5 }}>
                        Coluna Correspondente na sua Planilha Excel
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {TARGET_CLIENT_FIELDS.map((field) => {
                      const currentVal = mode === "single_file" ? mapping[field.key] || "" : clientMapping[field.key] || "";
                      const sourceHeaders = headers1;
                      const options = ["-- Ignorar / Não Existe --", ...sourceHeaders];

                      return (
                        <TableRow
                          key={field.key}
                          hover
                          sx={{
                            bgcolor: currentVal ? "action.hover" : "transparent",
                          }}
                        >
                          <TableCell sx={{ py: 1.25 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight={600} color="text.primary">
                                {field.label}
                              </Typography>
                              {field.required && (
                                <Chip
                                  size="small"
                                  color="error"
                                  label="Obrigatório"
                                  sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Autocomplete
                              size="small"
                              options={options}
                              value={currentVal || "-- Ignorar / Não Existe --"}
                              onChange={(_, newValue) => {
                                const val = !newValue || newValue === "-- Ignorar / Não Existe --" ? "" : newValue;
                                if (mode === "single_file") {
                                  setMapping((prev) => ({ ...prev, [field.key]: val }));
                                } else {
                                  setClientMapping((prev) => ({ ...prev, [field.key]: val }));
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  placeholder="Digite para buscar coluna..."
                                  sx={{
                                    "& .MuiInputBase-input": {
                                      fontWeight: 400,
                                      color: "#111827",
                                    },
                                  }}
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" {...props} key={option}>
                                  <Typography
                                    variant="body2"
                                    color="text.primary"
                                    fontWeight={option === "-- Ignorar / Não Existe --" ? 400 : 500}
                                  >
                                    {option === "-- Ignorar / Não Existe --" ? option : `📊 ${option}`}
                                  </Typography>
                                </Box>
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 1: PET FIELDS TABLE */}
            {activeTab === 1 && (
              <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "grey.100" }}>
                      <TableRow>
                        <TableCell width="40%" sx={{ fontWeight: 700, color: "text.primary", py: 1.5 }}>
                          Campo do Nosso Sistema
                        </TableCell>
                        <TableCell width="60%" sx={{ fontWeight: 700, color: "text.primary", py: 1.5 }}>
                          Coluna Correspondente na sua Planilha Excel
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {TARGET_PET_FIELDS.map((field) => {
                        const currentVal = mode === "single_file" ? mapping[field.key] || "" : petMapping[field.key] || "";
                        const sourceHeaders = mode === "single_file" ? headers1 : headers2;
                        const options = ["-- Ignorar / Não Existe --", ...sourceHeaders];

                        return (
                          <TableRow
                            key={field.key}
                            hover
                            sx={{
                              bgcolor: currentVal ? "action.hover" : "transparent",
                            }}
                          >
                            <TableCell sx={{ py: 1.25 }}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" fontWeight={600} color="text.primary">
                                  {field.label}
                                </Typography>
                                {field.required && (
                                  <Chip
                                    size="small"
                                    color="error"
                                    label="Obrigatório"
                                    sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                              <Autocomplete
                                size="small"
                                options={options}
                                value={currentVal || "-- Ignorar / Não Existe --"}
                                onChange={(_, newValue) => {
                                  const val = !newValue || newValue === "-- Ignorar / Não Existe --" ? "" : newValue;
                                  if (mode === "single_file") {
                                    setMapping((prev) => ({ ...prev, [field.key]: val }));
                                  } else {
                                    setPetMapping((prev) => ({ ...prev, [field.key]: val }));
                                  }
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    size="small"
                                    placeholder="Digite para buscar coluna..."
                                    sx={{
                                      "& .MuiInputBase-input": {
                                        fontWeight: 400,
                                        color: "#111827",
                                      },
                                    }}
                                  />
                                )}
                                renderOption={(props, option) => (
                                  <Box component="li" {...props} key={option}>
                                    <Typography
                                      variant="body2"
                                      color="text.primary"
                                      fontWeight={option === "-- Ignorar / Não Existe --" ? 400 : 500}
                                    >
                                      {option === "-- Ignorar / Não Existe --" ? option : `📊 ${option}`}
                                    </Typography>
                                  </Box>
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 3 }} />

                <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom color="text.primary">
                    Valores Padrão (para campos não existentes na planilha):
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">
                        Espécie Padrão:
                      </Typography>
                      <Select
                        fullWidth
                        size="small"
                        value={defaultValues.pet_especie || "Canino"}
                        onChange={(e) => setDefaultValues((prev) => ({ ...prev, pet_especie: e.target.value }))}
                      >
                        <MenuItem value="Canino">Canino (Cão)</MenuItem>
                        <MenuItem value="Felino">Felino (Gato)</MenuItem>
                        <MenuItem value="Exoticos">Exóticos</MenuItem>
                      </Select>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">
                        Gênero Padrão:
                      </Typography>
                      <Select
                        fullWidth
                        size="small"
                        value={defaultValues.pet_genero || "Desconhecido"}
                        onChange={(e) => setDefaultValues((prev) => ({ ...prev, pet_genero: e.target.value }))}
                      >
                        <MenuItem value="Macho">Macho</MenuItem>
                        <MenuItem value="Fêmea">Fêmea</MenuItem>
                        <MenuItem value="Desconhecido">Desconhecido</MenuItem>
                      </Select>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">
                        Porte Padrão:
                      </Typography>
                      <Select
                        fullWidth
                        size="small"
                        value={defaultValues.pet_porte || "M"}
                        onChange={(e) => setDefaultValues((prev) => ({ ...prev, pet_porte: e.target.value }))}
                      >
                        <MenuItem value="PP">PP (Mini)</MenuItem>
                        <MenuItem value="P">P (Pequeno)</MenuItem>
                        <MenuItem value="M">M (Médio)</MenuItem>
                        <MenuItem value="G">G (Grande)</MenuItem>
                        <MenuItem value="GG">GG (Gigante)</MenuItem>
                      </Select>
                    </Grid>
                  </Grid>

                </Paper>
              </Box>
            )}
          </Box>
        )}

        {/* STEP 2: Conversion & Actions */}
        {activeStep === 2 && (
          <Box textAlign="center" py={2}>
            <CheckCircle2 size={56} color="#2e7d32" />
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mt: 1 }}>
              Mapeamento Concluído com Sucesso!
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ maxW: 500, mx: "auto", mt: 1, mb: 4 }}>
              Escolha abaixo como deseja prosseguir com os dados mapeados.
            </Typography>

            <Box display="flex" gap={3} alignItems="stretch" mt={2}>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign: "center",
                  borderRadius: 2,
                  "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                }}
              >
                <Box>
                  <Download size={40} color="#1976d2" />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mt: 1 }}>
                    Baixar Planilha Convertida
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1, mb: 3 }}>
                    Gera um arquivo Excel formatado no nosso modelo padrão para você conferir ou guardar como backup.
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={processing}
                  startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />}
                  onClick={handleDownloadConverted}
                >
                  Baixar (.xlsx)
                </Button>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign: "center",
                  borderRadius: 2,
                  bgcolor: "grey.50",
                  borderColor: "primary.light",
                  "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                }}
              >
                <Box>
                  <Wand2 size={40} color="#2e7d32" />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mt: 1 }}>
                    Importar Direto no Sistema
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1, mb: 3 }}>
                    Converte em memória e dispara a importação assíncrona direto para o seu petshop.
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  disabled={processing}
                  startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={16} />}
                  onClick={handleImportDirect}
                >
                  Importar Direto
                </Button>
              </Paper>
            </Box>


          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button
          variant="text"
          disabled={activeStep === 0 || processing}
          startIcon={<ArrowLeft size={16} />}
          onClick={() => setActiveStep((prev) => prev - 1)}
        >
          Voltar
        </Button>

        {activeStep === 0 && (
          <Button
            disabled={!file1 || inspecting}
            endIcon={inspecting ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}
            onClick={handleInspectFiles}
          >
            {inspecting ? "Analisando Colunas..." : "Próximo: Mapear Colunas"}
          </Button>
        )}

        {activeStep === 1 && (
          <Button
            endIcon={<ArrowRight size={16} />}
            onClick={() => {
              if (validateRequiredMappings()) {
                setActiveStep(2);
              }
            }}
          >
            Próximo: Finalizar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
