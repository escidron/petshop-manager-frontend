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
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Grid,
} from "@mui/material";
import { X, Download, ArrowRight, ArrowLeft, CheckCircle2, FileSpreadsheet, Wand2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button/Button";
import {
  inspectProductMigrationFile,
  downloadConvertedProductMigrationExcel,
  startProductMigrationImport,
} from "../../api/services/products";
import { useToast } from "../../hooks/useToast";

type Props = {
  open: boolean;
  onClose: () => void;
  onJobStarted: (jobId: string) => void;
};

const TARGET_PRODUCT_FIELDS = [
  { key: "nome", label: "Nome do Produto", required: true },
  { key: "preco_venda", label: "Preço de Venda (R$)", required: true },
  { key: "estoque_atual", label: "Quantidade em Estoque", required: true },
  { key: "estoque_minimo", label: "Estoque Mínimo", required: true },
  { key: "codigo_barras", label: "Código de Barras", required: true },
  { key: "ncm", label: "NCM", required: true },
  { key: "unidade", label: "Unidade de Medida", required: true },
  
  { key: "categoria", label: "Categoria" },
  { key: "preco_custo", label: "Custo (R$)" },
  { key: "sku", label: "SKU / Código" },
  { key: "cest", label: "CEST" },
  { key: "cfop", label: "CFOP" },
  { key: "csosn", label: "CSOSN" },
  { key: "cst_pis", label: "CST PIS" },
  { key: "cst_cofins", label: "CST COFINS" },
  { key: "descricao", label: "Descrição" },
];

const KEYWORD_MAP: Record<string, string[]> = {
  nome: ["nome", "produto", "descricao produto", "descrição produto", "item"],
  preco_venda: ["preco", "preço", "venda", "preco venda", "preço venda", "valor"],
  estoque_atual: ["estoque", "qtd", "quantidade", "saldo"],
  estoque_minimo: ["minimo", "mínimo", "est_min"],
  codigo_barras: ["codigo", "código", "barras", "ean", "cod_barras"],
  ncm: ["ncm"],
  unidade: ["unidade", "un", "medida"],
  categoria: ["categoria", "grupo", "secao", "seção", "departamento"],
  preco_custo: ["custo", "preco custo", "preço custo", "valor custo"],
  sku: ["sku", "codigo", "código do produto"],
  cest: ["cest"],
  cfop: ["cfop"],
  csosn: ["csosn"],
  cst_pis: ["pis", "cst pis"],
  cst_cofins: ["cofins", "cst cofins"],
  descricao: ["obs", "observacao", "detalhes", "descricao"],
};

export default function ProductMigrationWizardModal({ open, onClose, onJobStarted }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [file1, setFile1] = useState<File | null>(null);
  const [headers1, setHeaders1] = useState<string[]>([]);
  const [inspecting, setInspecting] = useState(false);

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({
    unidade: "UN",
    estoque_atual: "1",
    estoque_minimo: "1",
    codigo_barras: "SEM GTIN",
  });
  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  const handleInspectFile = async () => {
    if (!file1) {
      toast.error("Por favor, selecione o arquivo de Produtos.");
      return;
    }
    try {
      setInspecting(true);
      const res = await inspectProductMigrationFile(file1);
      setHeaders1(res.file1_headers);
      autoMapHeaders(res.file1_headers);
      setInspecting(false);
      setActiveStep(1);
    } catch (error: any) {
      setInspecting(false);
      toast.error(error.response?.data?.detail || "Erro ao ler cabeçalhos.");
    }
  };

  const autoMapHeaders = (h1: string[]) => {
    const initialMap: Record<string, string> = {};
    TARGET_PRODUCT_FIELDS.forEach((f) => {
      const keywords = KEYWORD_MAP[f.key] || [f.key];
      for (const h of h1) {
        const hClean = h.toLowerCase().trim();
        for (const kw of keywords) {
          const regex = new RegExp(`\\b${kw.toLowerCase().trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}\\b`, "i");
          if (regex.test(hClean)) {
            initialMap[f.key] = h;
            break;
          }
        }
        if (initialMap[f.key]) break;
      }
    });
    setMapping(initialMap);
  };

  const validateRequired = (): boolean => {
    const missing: string[] = [];
    TARGET_PRODUCT_FIELDS.forEach((f) => {
      if (f.required && !mapping[f.key] && !defaultValues[f.key]) {
        missing.push(f.label);
      }
    });
    if (missing.length > 0) {
      toast.error(`Atenção: Mapeie ou forneça valor padrão para os campos obrigatórios: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const handleDownloadConverted = async () => {
    if (!file1) return;
    try {
      setProcessing(true);
      await downloadConvertedProductMigrationExcel(file1, { column_mapping: mapping, default_values: defaultValues });
      toast.success("Planilha de produtos convertida baixada com sucesso!");
    } catch {
      toast.error("Erro ao converter planilha.");
    } finally {
      setProcessing(false);
    }
  };

  const handleImportDirect = async () => {
    if (!file1) return;
    try {
      setProcessing(true);
      const res = await startProductMigrationImport(file1, { column_mapping: mapping, default_values: defaultValues });
      setProcessing(false);
      onJobStarted(res.job_id);
      toast.success(`Migração de produtos iniciada com ${res.total_items} itens!`);
      handleClose();
    } catch (error: any) {
      setProcessing(false);
      toast.error(error.response?.data?.detail || "Erro ao iniciar migração.");
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFile1(null);
    setHeaders1([]);
    setMapping({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Wand2 size={22} color="#1976d2" />
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Assistente de Migração de Produtos & Estoque
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step><StepLabel sx={{ "& .MuiStepLabel-label": { color: "text.primary" } }}>Arquivo</StepLabel></Step>
          <Step><StepLabel sx={{ "& .MuiStepLabel-label": { color: "text.primary" } }}>Mapeamento De-Para</StepLabel></Step>
          <Step><StepLabel sx={{ "& .MuiStepLabel-label": { color: "text.primary" } }}>Finalizar</StepLabel></Step>
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom color="text.primary">
              Selecione a planilha de produtos do seu sistema antigo:
            </Typography>
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2, mt: 2, borderColor: file1 ? "success.main" : "divider", bgcolor: file1 ? "#f1f8e9" : "transparent" }}>
              {file1 ? <CheckCircle2 size={42} color="#2e7d32" /> : <FileSpreadsheet size={42} color="#1976d2" />}
              <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600, color: file1 ? "success.dark" : "text.primary" }}>
                Planilha de Produtos & Estoque
              </Typography>
              
              {file1 ? (
                <Box mt={2} display="flex" justifyContent="center">
                  <Chip
                    icon={<CheckCircle2 size={16} />}
                    label={file1.name}
                    color="success"
                    onDelete={() => setFile1(null)}
                    deleteIcon={<X size={16} />}
                  />
                </Box>
              ) : (
                <MuiButton component="label" size="small" variant="outlined" sx={{ mt: 2 }}>
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
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }} icon={<Wand2 size={20} />}>
              <Typography variant="body2" fontWeight={600}>Mapeamento de Produtos</Typography>
              <Typography variant="caption" display="block">
                Associe os campos do sistema às colunas da sua planilha de produtos.
              </Typography>
            </Alert>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell width="40%" sx={{ fontWeight: 700, color: "text.primary", py: 1.5 }}>
                      Campo do Nosso Sistema
                    </TableCell>
                    <TableCell width="60%" sx={{ fontWeight: 700, color: "text.primary", py: 1.5 }}>
                      Coluna na sua Planilha Excel
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TARGET_PRODUCT_FIELDS.map((field) => {
                    const currentVal = mapping[field.key] || "";
                    const options = ["-- Ignorar / Não Existe --", ...headers1];
                    return (
                      <TableRow key={field.key} hover sx={{ bgcolor: currentVal ? "action.hover" : "transparent" }}>
                        <TableCell sx={{ py: 1.25 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                              {field.label}
                            </Typography>
                            {field.required && (
                              <Chip size="small" color="error" label="Obrigatório" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
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
                              setMapping((prev) => ({ ...prev, [field.key]: val }));
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                placeholder="Digite para buscar coluna..."
                                sx={{ "& .MuiInputBase-input": { fontWeight: 400, color: "#111827" } }}
                              />
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {Object.keys(defaultValues).length > 0 && (
              <Box mt={3}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fff8e1", borderColor: "#ffe082" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" gutterBottom>
                    Valores Padrão (caso a coluna não exista na planilha):
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">Unidade Padrão:</Typography>
                      <TextField fullWidth size="small" value={defaultValues.unidade || ""} onChange={(e) => setDefaultValues((prev) => ({ ...prev, unidade: e.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">Cód. Barras Padrão:</Typography>
                      <TextField fullWidth size="small" value={defaultValues.codigo_barras || ""} onChange={(e) => setDefaultValues((prev) => ({ ...prev, codigo_barras: e.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">Estoque Atual Padrão:</Typography>
                      <TextField fullWidth size="small" type="number" value={defaultValues.estoque_atual || ""} onChange={(e) => setDefaultValues((prev) => ({ ...prev, estoque_atual: e.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="caption" fontWeight={600} color="text.primary">Estoque Mín. Padrão:</Typography>
                      <TextField fullWidth size="small" type="number" value={defaultValues.estoque_minimo || ""} onChange={(e) => setDefaultValues((prev) => ({ ...prev, estoque_minimo: e.target.value }))} />
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}
          </Box>
        )}

        {activeStep === 2 && (
          <Box textAlign="center" py={2}>
            <CheckCircle2 size={56} color="#2e7d32" />
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mt: 1 }}>
              Mapeamento de Produtos Concluído!
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ maxW: 500, mx: "auto", mt: 1, mb: 4 }}>
              Escolha como deseja prosseguir com a importação de produtos.
            </Typography>

            <Box display="flex" gap={3} alignItems="stretch" mt={2}>
              <Paper variant="outlined" sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", textAlign: "center", borderRadius: 2 }}>
                <Box>
                  <Download size={40} color="#1976d2" />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mt: 1 }}>
                    Baixar Planilha Convertida
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1, mb: 3 }}>
                    Gera um arquivo Excel formatado no modelo de produtos para conferência.
                  </Typography>
                </Box>
                <Button fullWidth variant="outlined" disabled={processing} onClick={handleDownloadConverted}>
                  Baixar (.xlsx)
                </Button>
              </Paper>

              <Paper variant="outlined" sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", textAlign: "center", borderRadius: 2, bgcolor: "grey.50" }}>
                <Box>
                  <Wand2 size={40} color="#2e7d32" />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mt: 1 }}>
                    Importar Direto no Sistema
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1, mb: 3 }}>
                    Dispara a importação assíncrona de produtos em segundo plano.
                  </Typography>
                </Box>
                <Button fullWidth disabled={processing} onClick={handleImportDirect}>
                  Importar Direto
                </Button>
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Button variant="text" disabled={activeStep === 0 || processing} startIcon={<ArrowLeft size={16} />} onClick={() => setActiveStep((prev) => prev - 1)}>
          Voltar
        </Button>

        {activeStep === 0 && (
          <Button disabled={!file1 || inspecting} endIcon={inspecting ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />} onClick={handleInspectFile}>
            {inspecting ? "Analisando..." : "Próximo: Mapear Colunas"}
          </Button>
        )}

        {activeStep === 1 && (
          <Button endIcon={<ArrowRight size={16} />} onClick={() => validateRequired() && setActiveStep(2)}>
            Próximo: Finalizar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
