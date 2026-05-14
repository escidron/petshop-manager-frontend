import { Typography, Divider, Box } from "@mui/material";

export const LEGAL_CONTENT = {
  terms: {
    title: "Termos de Uso",
    content: (
      <Box sx={{ "& > h2": { mt: 3, mb: 1, fontWeight: 700, fontSize: "1.2rem", color: "text.primary" }, "& > p": { mb: 2, lineHeight: 1.6, color: "text.primary", fontSize: "0.95rem" } }}>
        <Typography variant="h6" component="h2">1. Aceitação dos Termos</Typography>
        <Typography variant="body1">
          Ao acessar e usar a plataforma PetControle, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
        </Typography>

        <Typography variant="h6" component="h2">2. Descrição do Serviço</Typography>
        <Typography variant="body1">
          O PetControle é uma plataforma de gestão para petshops, oferecendo funcionalidades de agendamento, controle financeiro, gestão de estoque, prontuário de pets e comunicação com clientes.
        </Typography>

        <Typography variant="h6" component="h2">3. Cadastro e Segurança</Typography>
        <Typography variant="body1">
          Para utilizar certas funcionalidades, você deve criar uma conta. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.
        </Typography>

        <Typography variant="h6" component="h2">4. Uso Aceitável</Typography>
        <Typography variant="body1">
          Você concorda em usar a plataforma apenas para fins lícitos. É proibido: violar direitos de propriedade intelectual, transmitir malware ou tentar acessar áreas restritas sem autorização.
        </Typography>

        <Typography variant="h6" component="h2">5. Assinaturas e Pagamentos</Typography>
        <Typography variant="body1">
          Oferecemos planos gratuitos e pagos. Os termos de pagamento, cancelamento e reembolso são regidos pelo plano escolhido no momento da assinatura.
        </Typography>

        <Typography variant="h6" component="h2">6. Limitação de Responsabilidade</Typography>
        <Typography variant="body1">
          A plataforma é fornecida "como está". Não garantimos que os serviços serão ininterruptos ou livres de erros.
        </Typography>

        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" sx={{ textAlign: "center", fontStyle: "italic", opacity: 0.7 }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </Typography>
      </Box>
    )
  },
  privacy: {
    title: "Política de Privacidade",
    content: (
      <Box sx={{ "& > h2": { mt: 3, mb: 1, fontWeight: 700, fontSize: "1.2rem", color: "text.primary" }, "& > p": { mb: 2, lineHeight: 1.6, color: "text.primary", fontSize: "0.95rem" } }}>
        <Typography variant="h6" component="h2">1. Coleta de Informações</Typography>
        <Typography variant="body1">
          Coletamos informações que você nos fornece diretamente ao criar uma conta, como seu nome, e-mail, telefone e dados da sua empresa (petshop).
        </Typography>

        <Typography variant="h6" component="h2">2. Uso das Informações</Typography>
        <Typography variant="body1">
          Utilizamos as informações coletadas para fornecer, manter e melhorar nossos serviços, além de processar transações e enviar notificações.
        </Typography>

        <Typography variant="h6" component="h2">3. Compartilhamento de Dados</Typography>
        <Typography variant="body1">
          Não vendemos suas informações pessoais a terceiros. Compartilhamos dados apenas com fornecedores essenciais para a operação da plataforma.
        </Typography>

        <Typography variant="h6" component="h2">4. Segurança dos Dados</Typography>
        <Typography variant="body1">
          Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado ou perda.
        </Typography>

        <Typography variant="h6" component="h2">5. Seus Direitos (LGPD)</Typography>
        <Typography variant="body1">
          Você tem o direito de acessar, corrigir e solicitar a exclusão de seus dados, conforme garantido pela Lei Geral de Proteção de Dados.
        </Typography>

        <Typography variant="h6" component="h2">6. Contato</Typography>
        <Typography variant="body1">
          Se você tiver dúvidas sobre nossa Política de Privacidade, entre em contato conosco através do nosso suporte.
        </Typography>

        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" sx={{ textAlign: "center", fontStyle: "italic", opacity: 0.7 }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </Typography>
      </Box>
    )
  }
};
