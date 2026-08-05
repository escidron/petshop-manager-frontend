import { Typography, Divider, Box } from "@mui/material";

export const LEGAL_CONTENT = {
  terms: {
    title: "Termos de Uso",
    content: (
      <Box sx={{ "& > h2": { mt: 3, mb: 1, fontWeight: 700, fontSize: "1.2rem", color: "text.primary" }, "& > p": { mb: 2, lineHeight: 1.6, color: "text.primary", fontSize: "0.95rem" } }}>
        <Typography variant="body1" sx={{ fontStyle: "italic", mb: 3 }}>
          Seja bem-vindo ao PetControle. Por favor, leia atentamente estes Termos de Uso antes de utilizar nossa plataforma.
        </Typography>

        <Typography variant="h6" component="h2">1. Aceitação dos Termos</Typography>
        <Typography variant="body1">
          Ao acessar, se cadastrar ou utilizar a plataforma PetControle (sistema de gestão para petshops), você ("Usuário") concorda em cumprir e estar legalmente vinculado a estes Termos de Uso e à nossa Política de Privacidade. Caso você não concorde com qualquer disposição aqui estabelecida, você não deverá utilizar a plataforma.
        </Typography>

        <Typography variant="h6" component="h2">2. Descrição dos Serviços</Typography>
        <Typography variant="body1">
          O PetControle é um software como serviço (SaaS) hospedado em nuvem que disponibiliza ferramentas para otimização e gestão administrativa, operacional e financeira de petshops e clínicas veterinárias parceiras. As funcionalidades incluem agendamento de serviços, prontuários de pets, controle de estoque, faturamento financeiro, comissão de funcionários e ferramentas de comunicação com clientes.
        </Typography>

        <Typography variant="h6" component="h2">3. Cadastro, Contas e Segurança</Typography>
        <Typography variant="body1">
          Para utilizar os recursos da plataforma, o Usuário deve realizar um cadastro fornecendo informações exatas, atualizadas e verdadeiras. É de responsabilidade exclusiva do Usuário manter o sigilo de suas credenciais de acesso (e-mail e senha). Qualquer atividade realizada sob sua conta será de sua inteira responsabilidade. No caso de suspeita de uso não autorizado da conta, o suporte do PetControle deve ser notificado imediatamente.
        </Typography>

        <Typography variant="h6" component="h2">4. Direitos e Obrigações do Usuário</Typography>
        <Typography variant="body1">
          O Usuário compromete-se a utilizar o PetControle apenas para finalidades lícitas e de acordo com a legislação vigente, incluindo as regras de proteção aos animais e a Lei Geral de Proteção de Dados (LGPD). É proibido:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Tentar burlar ou violar mecanismos de segurança da plataforma;</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Armazenar ou distribuir conteúdos ilícitos, maliciosos ou difamatórios;</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Usar robôs ou scripts automatizados para extração de dados sem consentimento prévio por escrito.</Typography>

        <Typography variant="h6" component="h2">5. Planos, Assinaturas e Pagamentos</Typography>
        <Typography variant="body1">
          O uso de determinados recursos da plataforma depende da contratação de planos de assinatura específicos. Os valores, prazos de vencimento, formas de cobrança e regras de rescisão ou upgrade estão detalhados na tela de planos e no painel administrativo do Usuário. O atraso no pagamento poderá acarretar na suspensão temporária do acesso aos serviços ou cancelamento da conta conforme políticas comerciais vigentes.
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          <strong>Direito de Arrependimento:</strong> Após o término do período de teste gratuito de 14 dias (quando aplicável), e a partir da data de confirmação do primeiro pagamento da assinatura (seja via Cartão de Crédito ou PIX), o Usuário tem o prazo de 7 (sete) dias corridos para solicitar o cancelamento com direito à devolução integral do valor pago. Após esse prazo estipulado por lei, ou em casos de renovações mensais subsequentes, o cancelamento interromperá futuras cobranças, mas não haverá estorno de valores já processados.
        </Typography>

        <Typography variant="h6" component="h2">6. Limitação de Responsabilidade</Typography>
        <Typography variant="body1">
          A plataforma é fornecida "como está" e "conforme disponível". Embora envidemos nossos melhores esforços para garantir a continuidade dos serviços, o PetControle não garante que o sistema será 100% ininterrupto, livre de bugs ou imune a ataques cibernéticos de terceiros. Não somos responsáveis por perdas financeiras decorrentes de falhas de conexão à internet, negligência de funcionários do Usuário ou interrupções programadas para manutenção.
        </Typography>

        <Typography variant="h6" component="h2">7. Alterações nos Termos de Uso</Typography>
        <Typography variant="body1">
          O PetControle reserva-se o direito de atualizar ou modificar estes Termos de Uso a qualquer momento, visando refletir mudanças legislativas ou melhorias técnicas. Quando houver alterações significativas, os usuários serão notificados por meio de avisos na plataforma ou por e-mail. A continuidade do uso do sistema após as alterações constitui aceitação tácita dos novos Termos.
        </Typography>

        <Typography variant="h6" component="h2">8. Lei Aplicável e Foro</Typography>
        <Typography variant="body1">
          Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para dirimir qualquer controvérsia decorrente deste instrumento, fica eleito o foro da comarca da sede da empresa operadora da plataforma.
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
        <Typography variant="body1" sx={{ fontStyle: "italic", mb: 3 }}>
          Esta Política de Privacidade explica como o PetControle coleta, armazena, utiliza e protege os seus dados pessoais, em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </Typography>

        <Typography variant="h6" component="h2">1. Informações que Coletamos</Typography>
        <Typography variant="body1">
          Durante o uso da plataforma PetControle, nós coletamos os seguintes tipos de dados pessoais de forma direta ou indireta:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>a) Dados do Usuário / Proprietário do Petshop:</strong> Nome completo, endereço de e-mail, telefone celular, senha criptografada, documento de identificação (CPF ou CNPJ) e endereço comercial.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>b) Dados dos Clientes dos Petshops:</strong> Informações inseridas pelos usuários sobre seus próprios clientes (Tutores), como nome, e-mail, telefone, CPF e endereço residencial.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>c) Dados dos Pets:</strong> Nome do animal, espécie, raça, idade/data de nascimento, peso, histórico médico, vacinas aplicadas e fotos do animal.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>d) Dados Financeiros e de Transações:</strong> Detalhes de faturamento, histórico de pagamentos, transações de compras e vendas na loja e informações parciais de cartão de crédito processadas via parceiro externo de pagamento de forma segura.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>e) Dados de Acesso e Navegação:</strong> Endereço IP, tipo de navegador, cookies essenciais, registros de data/hora de login e ações realizadas na interface do sistema.
        </Typography>

        <Typography variant="h6" component="h2">2. Finalidade e Base Legal do Tratamento</Typography>
        <Typography variant="body1">
          Tratamos os dados pessoais estritamente de acordo com as seguintes finalidades e bases legais baseadas na LGPD:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          • <strong>Execução de Contrato:</strong> Para criar e gerenciar a sua conta, processar pagamentos das mensalidades, permitir o agendamento de consultas/banhos e disponibilizar as ferramentas administrativas essenciais contratadas.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          • <strong>Cumprimento de Obrigação Legal ou Regulatória:</strong> Armazenamento de logs de acesso de acordo com o Marco Civil da Internet (Lei nº 12.965/2014) e emissão de notas fiscais de serviços.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          • <strong>Legítimo Interesse:</strong> Envio de comunicações de atualizações do sistema, suporte técnico e melhoria da experiência do usuário na plataforma.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          • <strong>Consentimento:</strong> Nos casos em que o usuário explicitamente autoriza a coleta de cookies opcionais ou comunicações de marketing externas.
        </Typography>

        <Typography variant="h6" component="h2">3. Compartilhamento de Dados</Typography>
        <Typography variant="body1">
          O PetControle preza pelo sigilo de suas informações. Não vendemos ou comercializamos quaisquer dados armazenados em nosso sistema. O compartilhamento ocorre apenas quando estritamente necessário para a prestação do serviço:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Provedores de hospedagem em nuvem (servidores seguros);</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Gateways e processadores de pagamento integrados (ex: Stripe);</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Autoridades públicas ou judiciais, mediante intimação ou obrigação legal.</Typography>

        <Typography variant="h6" component="h2">4. Segurança dos Dados</Typography>
        <Typography variant="body1">
          Adotamos medidas técnicas, físicas e organizacionais adequadas para proteger os dados pessoais sob nossa custódia contra destruição, perda, alteração ou acessos não autorizados. Isso inclui criptografia de dados em trânsito e em repouso (SSL/HTTPS), firewalls ativos e políticas internas rigorosas de restrição de acessos administrativos.
        </Typography>

        <Typography variant="h6" component="h2">5. Seus Direitos (Artigo 18 da LGPD)</Typography>
        <Typography variant="body1">
          Como titular de dados pessoais sob a LGPD, você possui os seguintes direitos garantidos:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Confirmar a existência de tratamento de seus dados;</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Acessar seus dados pessoais gratuitamente;</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Solicitar a correção de dados incompletos, inexatos ou desatualizados;</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Solicitar a eliminação dos dados desnecessários ou tratados em desconformidade;</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Portabilidade dos dados a outro fornecedor de serviços, mediante requisição expressa;</Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>• Revogar o consentimento previamente fornecido.</Typography>

        <Typography variant="h6" component="h2">6. Retenção e Exclusão de Dados</Typography>
        <Typography variant="body1">
          Os dados pessoais serão conservados enquanto a conta do Usuário estiver ativa ou pelo período necessário para cumprir obrigações legais, contratuais ou tributárias. Após a solicitação de cancelamento da conta, os dados serão excluídos permanentemente de nossos servidores ativos no prazo de 30 (trinta) dias, exceto as informações cuja retenção seja exigida ou autorizada por lei.
        </Typography>

        <Typography variant="h6" component="h2">7. Canal de Atendimento do DPO / Encarregado</Typography>
        <Typography variant="body1">
          Para exercer seus direitos de titular ou sanar qualquer dúvida referente a esta Política de Privacidade, entre em contato diretamente com o nosso Encarregado de Proteção de Dados (DPO) através do e-mail de suporte ou abrindo um chamado no painel da plataforma.
        </Typography>

        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" sx={{ textAlign: "center", fontStyle: "italic", opacity: 0.7 }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </Typography>
      </Box>
    )
  }
};

