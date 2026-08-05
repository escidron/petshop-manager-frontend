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
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, ChevronDown, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "../../components/Button/Button";
import {
  startProductsImport,
  getProductImportStatus,
  downloadImportTemplate,
} from "../../api/services/products";
import type { ImportJobStatus } from "../../api/services/clients";
import { useToast } from "../../hooks/useToast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeJobId: string | null;
  onJobStarted: (jobId: string) => void;
  onJobFinished: () => void;
};

export default function ImportProductsModal({
  open,
  onClose,
  onSuccess,
  activeJobId,
  onJobStarted,
  onJobFinished,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [jobStatus, setJobStatus] = useState<ImportJobStatus | null>(null);
  const [successCalled, setSuccessCalled] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toast = useToast();

  const isDone = jobStatus?.status === "done" || jobStatus?.status === "error";
  const isRunning = uploading || (!!activeJobId && !isDone);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    if (open && activeJobId && !pollingRef.current && !isDone) {
      startPolling(activeJobId);
    }
    if (!open) {
      stopPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeJobId]);

  const startPolling = (job_id: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const status = await getProductImportStatus(job_id);
        setJobStatus(status);

        if (status.status === "done") {
          stopPolling();
          onJobFinished();
          if (!successCalled) {
            setSuccessCalled(true);
            const created = status.created ?? 0;
            const updated = status.updated ?? 0;
            if (created > 0 || updated > 0) {
              const parts: string[] = [];
              if (created > 0) parts.push(`${created} criado(s)`);
              if (updated > 0) parts.push(`${updated} atualizado(s)`);
              toast.success(`Importação concluída: ${parts.join(", ")}!`);
              onSuccess();
            } else {
              toast.info("Nenhum produto novo ou alterado encontrado.");
            }
          }
          if (status.errors.length > 0) {
            toast.warning(`${status.errors.length} linha(s) com erro.`);
          }
        } else if (status.status === "error") {
          stopPolling();
          onJobFinished();
          toast.error("Erro inesperado durante a importação.");
        }
      } catch {
        // Silent — retry on next interval
      }
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setJobStatus(null);
      setSuccessCalled(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".xlsx")) {
        setFile(dropped);
        setJobStatus(null);
        setSuccessCalled(false);
      } else {
        toast.error("Por favor, envie apenas arquivos .xlsx");
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setUploading(true);
      const { job_id } = await startProductsImport(file);
      setUploading(false);
      onJobStarted(job_id);
      startPolling(job_id);
    } catch (error: any) {
      setUploading(false);
      toast.error(error.response?.data?.detail || "Erro ao enviar arquivo para importação");
    }
  };

  const handleClose = () => {
    if (isRunning && !isDone) {
      toast.warning("A importação continua rodando em segundo plano.");
    }
    setFile(null);
    stopPolling();
    onClose();
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadImportTemplate();
    } catch {
      toast.error("Erro ao baixar o modelo.");
    } finally {
      setDownloading(false);
    }
  };

  const handleNewUpload = () => {
    setFile(null);
    setJobStatus(null);
    setSuccessCalled(false);
  };

  const progressValue = jobStatus?.progress ?? 0;
  const importedCount = jobStatus?.imported ?? 0;
  const totalRows = jobStatus?.total ?? 0;
  const progressLabel = totalRows > 0
    ? `${importedCount.toLocaleString("pt-BR")} de ${totalRows.toLocaleString("pt-BR")} linhas`
    : "Preparando...";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight="bold">Importar Produtos</Typography>
        <IconButton onClick={handleClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.primary" gutterBottom>
            Importe seus produtos em massa usando uma planilha Excel (XLSX).
            Recomendamos o uso do nosso modelo padrão para evitar erros de formatação.
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={downloading}
              startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />}
              onClick={handleDownload}
            >
              {downloading ? "Gerando..." : "Baixar Modelo (Excel)"}
            </Button>
          </Box>

          <Accordion sx={{ mt: 2, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
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
                    primary="nome * e preco_venda *"
                    secondary="Nome do produto e preço de venda. (Obrigatórios)"
                    primaryTypographyProps={{ fontWeight: "bold", fontSize: "13px", color: "text.primary" }}
                    secondaryTypographyProps={{ color: "text.primary", fontSize: "12px" }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="codigo_barras ou sku"
                    secondary="Código de barras ou SKU do produto. Usados para identificar produtos existentes e atualizá-los."
                    primaryTypographyProps={{ fontWeight: "bold", fontSize: "13px", color: "text.primary" }}
                    secondaryTypographyProps={{ color: "text.primary", fontSize: "12px" }}
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.primary" sx={{ opacity: 0.8 }}>
                  Importar o mesmo arquivo duas vezes atualiza os dados existentes sem criar duplicatas.
                </Typography>
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* File picker */}
        {!activeJobId && !jobStatus && !uploading && (
          <Box
            sx={{
              border: "2px dashed",
              borderColor: isDragging || file ? "primary.main" : "divider",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              bgcolor: isDragging || file ? "action.hover" : "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { bgcolor: "action.hover" },
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("products-excel-upload")?.click()}
          >
            <input
              type="file"
              id="products-excel-upload"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {file ? (
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <FileText size={40} color="#1976d2" />
                <Typography variant="subtitle1" fontWeight="500">{file.name}</Typography>
                <Typography variant="caption" color="text.primary">
                  {(file.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Upload size={40} color="#9e9e9e" />
                <Typography variant="subtitle1" fontWeight="500">Clique ou arraste o arquivo aqui</Typography>
                <Typography variant="caption" color="text.primary">Apenas arquivos .xlsx são suportados</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Upload spinner */}
        {uploading && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={3}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.primary">Enviando arquivo...</Typography>
          </Box>
        )}

        {/* Real-time progress bar */}
        {activeJobId && !isDone && (
          <Box sx={{ mt: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
              <Typography variant="body2" fontWeight={500} color="text.primary">
                Importando produtos...
              </Typography>
              {progressValue > 0 && (
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {progressValue}%
                </Typography>
              )}
            </Box>
            <LinearProgress
              variant={progressValue > 0 ? "determinate" : "indeterminate"}
              value={progressValue}
              sx={{ borderRadius: 2, height: 10 }}
            />
            <Typography variant="caption" color="text.primary" sx={{ mt: 0.75, display: "block" }}>
              {progressLabel}
            </Typography>
            <Typography variant="caption" color="text.primary" sx={{ mt: 0.25, display: "block", fontStyle: "italic" }}>
              Você pode fechar este painel, a importação continua em segundo plano.
            </Typography>
          </Box>
        )}

        {/* Done result */}
        {isDone && jobStatus && (
          <Box>
            <Alert
              severity={
                jobStatus.status === "error"
                  ? "error"
                  : jobStatus.errors.length === 0
                  ? "success"
                  : "warning"
              }
              icon={
                jobStatus.status === "error" || jobStatus.errors.length > 0
                  ? <AlertCircle />
                  : <CheckCircle2 />
              }
              sx={{ mb: 2 }}
            >
              {jobStatus.status === "error" ? (
                "Ocorreu um erro inesperado durante a importação."
              ) : (
                <Box>
                  {(jobStatus.created ?? 0) > 0 && (
                    <div><strong>{jobStatus.created.toLocaleString("pt-BR")}</strong> produtos criados.</div>
                  )}
                  {(jobStatus.updated ?? 0) > 0 && (
                    <div><strong>{jobStatus.updated.toLocaleString("pt-BR")}</strong> produtos atualizados.</div>
                  )}
                  {(jobStatus.created ?? 0) === 0 && (jobStatus.updated ?? 0) === 0 && (
                    <div>Nenhum produto novo ou alterado encontrado.</div>
                  )}
                </Box>
              )}
            </Alert>

            {jobStatus.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Erros Encontrados ({jobStatus.errors.length}):
                </Typography>
                <Box
                  sx={{
                    maxHeight: 180,
                    overflow: "auto",
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <List dense>
                    {jobStatus.errors.map((error, idx) => (
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

            <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={handleNewUpload}>
              Fazer outro upload
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" onClick={handleClose}>
          {isRunning && !isDone ? "Minimizar" : "Fechar"}
        </Button>
        {!activeJobId && !jobStatus && (
          <Button
            onClick={handleImport}
            disabled={!file || uploading}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={18} />}
          >
            {uploading ? "Enviando..." : "Confirmar Importação"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
