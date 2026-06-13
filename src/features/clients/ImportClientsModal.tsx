import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button/Button";
import { importClients, downloadImportTemplate } from "../../api/services/clients";
import { useToast } from "../../hooks/useToast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ImportResult = {
  imported: number;
  errors: string[];
};

export default function ImportClientsModal({ open, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx")) {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast.error("Por favor, envie apenas arquivos .xlsx");
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);
      const res = await importClients(file);
      setResult(res);
      
      if (res.imported > 0) {
        toast.success(`${res.imported} registros processados com sucesso!`);
        onSuccess();
      }
      
      if (res.errors.length > 0) {
        toast.warning("Houve erros em algumas linhas do arquivo.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Erro ao importar arquivo");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setFile(null);
      setResult(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="bold">Importar Clientes e Pets</Typography>
        <IconButton onClick={handleClose} disabled={importing}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.primary" gutterBottom>
            Importe seus clientes e pets em massa usando uma planilha Excel (XLSX). 
            Recomendamos o uso do nosso modelo padrão para evitar erros de formatação.
          </Typography>
          
          <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download size={16} />}
              onClick={() => downloadImportTemplate()}
            >
              Baixar Modelo (Excel)
            </Button>
          </Box>

          <Accordion defaultExpanded sx={{ mt: 2, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
            <AccordionSummary expandIcon={<ChevronDown size={18} />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Info size={16} color="#1976d2" />
                <Typography variant="subtitle2" color="text.primary">Instruções das Colunas</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="cliente_nome * e cliente_telefone *" 
                    secondary="Nome completo e telefone do cliente. Se o cliente for repetido em múltiplas linhas, os pets serão agrupados sob o mesmo cadastro. (Obrigatório)" 
                    primaryTypographyProps={{ fontWeight: "bold", fontSize: "13px", color: "text.primary" }}
                    secondaryTypographyProps={{ color: "text.primary", fontSize: "12px" }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="pet_nome" 
                    secondary="Nome do pet. Se deixado em branco, apenas o cliente será cadastrado/atualizado. (Opcional)" 
                    primaryTypographyProps={{ fontWeight: "bold", fontSize: "13px", color: "text.primary" }}
                    secondaryTypographyProps={{ color: "text.primary", fontSize: "12px" }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="pet_especie" 
                    secondary="Espécie do animal. Opções: Canino, Felino. (Obrigatório se o 'pet_nome' estiver preenchido)" 
                    primaryTypographyProps={{ fontWeight: "bold", fontSize: "13px", color: "text.primary" }}
                    secondaryTypographyProps={{ color: "text.primary", fontSize: "12px" }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Outros dados do Pet" 
                    secondary="pet_raca, pet_genero (Macho, Fêmea, Desconhecido), pet_porte (PP, P, M, G, GG), pet_castrado (Sim, Não), data de nascimento e observações. (Opcional)" 
                    primaryTypographyProps={{ fontWeight: "bold", fontSize: "13px", color: "text.primary" }}
                    secondaryTypographyProps={{ color: "text.primary", fontSize: "12px" }}
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                  O sistema evita duplicar o cliente se o Nome + Telefone (ou CPF/CNPJ) coincidir com um cadastro existente.
                </Typography>
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>

        {!result ? (
          <Box
            sx={{
              border: "2px dashed",
              borderColor: isDragging || file ? "primary.main" : "divider",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              bgcolor: isDragging || file ? "action.hover" : "transparent",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s",
              "&:hover": { bgcolor: "action.hover" }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("clients-excel-upload")?.click()}
          >
            <input
              type="file"
              id="clients-excel-upload"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {file ? (
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <FileText size={40} color="#1976d2" />
                <Typography variant="subtitle1" fontWeight="500">
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Upload size={40} color="#9e9e9e" />
                <Typography variant="subtitle1" fontWeight="500">
                  Clique ou arraste o arquivo aqui
                </Typography>
                <Typography variant="caption" color="text.primary">
                  Apenas arquivos .xlsx são suportados
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Alert 
              severity={result.errors.length === 0 ? "success" : "warning"}
              icon={result.errors.length === 0 ? <CheckCircle2 /> : <AlertCircle />}
              sx={{ mb: 2 }}
            >
              <strong>{result.imported}</strong> linhas processadas com sucesso.
            </Alert>

            {result.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Erros Encontrados ({result.errors.length}):
                </Typography>
                <Box
                  sx={{
                    maxHeight: 200,
                    overflow: "auto",
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider"
                  }}
                >
                  <List dense>
                    {result.errors.map((error, idx) => (
                      <ListItem key={idx}>
                        <ListItemText 
                          primary={error} 
                          primaryTypographyProps={{ fontSize: "12px", color: "error.main" }} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            )}
            
            <Button 
              fullWidth 
              variant="outlined" 
              sx={{ mt: 2 }} 
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              Fazer outro upload
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" onClick={handleClose} disabled={importing}>
          Cancelar
        </Button>
        {!result && (
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={18} />}
          >
            {importing ? "Importando..." : "Confirmar Importação"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
