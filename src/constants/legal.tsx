import { Typography, Divider, Box, Alert, AlertTitle } from "@mui/material";

export const LEGAL_CONTENT = {
  terms: {
    title: "Termos de Uso e Condições Gerais de Contratação",
    content: (
      <Box
        sx={{
          "& > h2": {
            mt: 4,
            mb: 1.5,
            fontWeight: 800,
            fontSize: "1.15rem",
            color: "text.primary",
            letterSpacing: "-0.01em",
          },
          "& > p": {
            mb: 2,
            lineHeight: 1.7,
            color: "text.secondary",
            fontSize: "0.95rem",
            textAlign: "justify",
          },
          "& > ul": {
            mb: 2,
            pl: 3,
            color: "text.secondary",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          },
        }}
      >
        <Typography variant="body1" sx={{ fontStyle: "italic", mb: 3, color: "text.primary", fontWeight: 500 }}>
          Seja bem-vindo à plataforma <strong>Data Pet</strong>. Estes Termos de Uso e Condições Gerais de Contratação constituem um contrato vinculante entre você (na qualidade de pessoa física ou jurídica titular de estabelecimento comercial, doravante denominado "Contratante" ou "Usuário") e a operadora da plataforma Data Pet ("Data Pet" ou "Nós"). Por favor, leia atentamente as cláusulas a seguir antes de criar uma conta ou utilizar os serviços.
        </Typography>

        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Resumo Operacional Importante</AlertTitle>
          A plataforma Data Pet é um sistema de gestão voltado exclusivamente a <strong>Petshops, Centros de Estética Animal e Serviços de Banho e Tosa</strong>. O sistema oferece período de avaliação gratuita de <strong>1 (um) mês (30 dias)</strong>, ferramentas de cálculo gerencial de comissões de colaboradores e canal centralizado de notificações via WhatsApp. A plataforma não presta serviços médico-veterinários e não assume qualquer vínculo empregatício com os profissionais do Contratante.
        </Alert>

        <Typography variant="h6" component="h2">1. Objeto e Definições Fundamentais</Typography>
        <Typography variant="body1">
          1.1. <strong>Objeto:</strong> O presente instrumento tem por objeto a concessão de licença de uso temporária, revogável, não exclusiva e intransferível de software hospedado em nuvem ("SaaS - Software as a Service"), sob a marca Data Pet, destinado à automação, organização e gestão operacional, cadastral e financeira de petshops e estabelecimentos de estética animal (banho, tosa e higienização pet).
        </Typography>
        <Typography variant="body1">
          1.2. <strong>Delimitação de Escopo (Ausência de Atividade Médico-Veterinária):</strong> A plataforma Data Pet destina-se estritamente à gestão de petshops, comércio de mercadorias para animais domésticos e serviços de estética/higiene animal. A Data Pet <strong>NÃO</strong> é clínica veterinária, hospital veterinário nem consultório médico animal, não fornece diagnósticos, não prescreve terapias e não substitui a responsabilidade técnica de profissionais habilitados perante os Conselhos de Medicina Veterinária.
        </Typography>
        <Typography variant="body1">
          1.3. <strong>Definições de Partes:</strong>
        </Typography>
        <Box component="ul">
          <li><strong>Contratante (ou "Tenant"):</strong> A pessoa jurídica ou empresário individual que contrata a assinatura da plataforma para administrar seu petshop.</li>
          <li><strong>Colaboradores:</strong> Banhistas, tosadores, operadores de caixa, recepcionistas e demais prestadores de serviço devidamente cadastrados pelo Contratante no sistema.</li>
          <li><strong>Tutores:</strong> Os clientes finais do petshop, proprietários ou responsáveis pelos animais domésticos atendidos.</li>
        </Box>

        <Typography variant="h6" component="h2">2. Cadastro, Acesso e Segurança da Conta</Typography>
        <Typography variant="body1">
          2.1. <strong>Capacidade e Veracidade:</strong> O acesso aos recursos da plataforma requer cadastro prévio com fornecimento de dados precisos, completos e verídicos (incluindo CNPJ ou CPF regular, e-mail comercial e telefone válido). O Contratante assume total responsabilidade civil e criminal pela autenticidade das informações declaradas.
        </Typography>
        <Typography variant="body1">
          2.2. <strong>Sigilo de Credenciais:</strong> As senhas de acesso geradas para a conta administradora e para os colaboradores são estritamente pessoais e intransferíveis. O Contratante é o único e exclusivo responsável por manter a confidencialidade de suas credenciais, respondendo integralmente por quaisquer atos, transações, exclusões ou lançamentos efetuados sob sua conta.
        </Typography>
        <Typography variant="body1">
          2.3. <strong>Notificação Imediata:</strong> Em caso de perda, extravio, furto de credenciais ou qualquer suspeita de acesso não autorizado, o Contratante deve comunicar imediatamente a equipe de suporte da Data Pet para que as medidas cabíveis de bloqueio e redefinição de segurança sejam adotadas.
        </Typography>

        <Typography variant="h6" component="h2">3. Relações de Trabalho, Não Vínculo Empregatício e Módulo de Comissões</Typography>
        <Typography variant="body1">
          3.1. <strong>Inexistência Total de Vínculo Empregatício (Arts. 2º e 3º da CLT):</strong> A Data Pet disponibiliza ferramentas puramente tecnológicas e computacionais. Em nenhuma hipótese haverá relação de emprego, subordinação jurídica, técnica ou econômica, habitualidade direcionada ou dependência hierárquica entre a Data Pet e os colaboradores, tosadores, banhistas ou atendentes cadastrados pelo Contratante.
        </Typography>
        <Typography variant="body1">
          3.2. <strong>Natureza do Módulo de Comissões e Escalas de Trabalho:</strong> O módulo de controle de escalas, dias de trabalho e comissões da plataforma constitui mera calculadora e livro-razão computacional gerencial. Todos os parâmetros, alíquotas de comissionamento (percentuais ou fixas), regras de prioridade, atribuições de serviços e validações de pagamento são configurados, decididos e alimentados com absoluta liberdade e autonomia exclusiva pelo Contratante.
        </Typography>
        <Typography variant="body1">
          3.3. <strong>Responsabilidade Exclusiva Trabalhista e Previdenciária do Contratante:</strong> O Contratante é o único e exclusivo responsável por:
        </Typography>
        <Box component="ul">
          <li>Definir e fiscalizar a qualificação e a modalidade de contratação de sua equipe (seja celetista com carteira assinada, prestador de serviço autônomo, MEI ou profissional parceiro);</li>
          <li>Calcular e recolher todos os encargos trabalhistas, fiscais e previdenciários devidos (INSS, FGTS, IRRF);</li>
          <li>Cumprir integralmente o pagamento de salários, horas extras, reflexos em Descanso Semanal Remunerado (DSR - Súmula nº 27 do TST), gratificação natalina (13º salário) e férias com terço constitucional decorrentes das comissões registradas no sistema (Arts. 457 e 466 da CLT);</li>
          <li>Manter o controle formal e legal da jornada de trabalho de seus empregados em conformidade com as normas do Ministério do Trabalho e Emprego.</li>
        </Box>
        <Typography variant="body1">
          3.4. <strong>Cláusula de Desoneração e Indenização Regressiva (Hold Harmless):</strong> Caso a Data Pet venha a ser indicada, acionada ou condenada em qualquer reclamação trabalhista, auto de infração ou procedimento fiscal instaurado por empregados, colaboradores ou prestadores de serviços do Contratante, este se compromete formalmente a:
          (a) comparecer espontaneamente aos autos e requerer a imediata e integral exclusão da Data Pet da lide;
          (b) assumir a responsabilidade direta pelo débito questionado; e
          (c) ressarcir imediatamente à Data Pet todas as custas judiciais, depósitos recursais, indenizações, honorários periciais e honorários advocatícios comprovadamente despendidos em virtude da referida demanda.
        </Typography>

        <Typography variant="h6" component="h2">4. Serviço Centralizado de Notificações via WhatsApp</Typography>
        <Typography variant="body1">
          4.1. <strong>Operação por Canal Centralizado da Plataforma:</strong> A Data Pet disponibiliza funcionalidade de envio automatizado de mensagens transacionais aos tutores (tais como lembretes de agendamentos, confirmações de horário e alertas de animal pronto para retirada). Referidas mensagens são transmitidas através de um <strong>número oficial centralizado e compartilhado da plataforma Data Pet</strong> que atende coletivamente aos petshops cadastrados.
        </Typography>
        <Typography variant="body1">
          4.2. <strong>Garantia de Consentimento dos Tutores:</strong> O Contratante declara e garante sob as penas da lei que obteve a prévia e expressa autorização de seus clientes (tutores) para o cadastramento de seus números de telefone celular e para o envio de mensagens de natureza operacional relacionadas aos serviços do petshop.
        </Typography>
        <Typography variant="body1">
          4.3. <strong>Vedações Rígidas e Política Anti-Spam:</strong> É terminantemente proibido utilizar o canal de notificações da Data Pet para:
        </Typography>
        <Box component="ul">
          <li>Envio de publicidade não solicitada, spam, correntes ou mensagens em massa indiscriminadas;</li>
          <li>Transmissão de conteúdos ofensivos, difamatórios, fraudulentos, obscenos, políticos ou que violem os Termos de Serviço da Meta / WhatsApp Business;</li>
          <li>Divulgação de produtos ilícitos ou alheios ao estrito escopo da rotina de petshop e estética animal.</li>
        </Box>
        <Typography variant="body1">
          4.4. <strong>Proteção do Canal Centralizado e Responsabilidade por Bloqueios:</strong> O Contratante reconhece que o número centralizado da Data Pet constitui recurso estratégico compartilhado por diversos estabelecimentos parceiros. Na hipótese de o Contratante violar as diretrizes anti-spam ou as políticas da Meta, ensejando denúncias por usuários, advertências, bloqueio temporário ou banimento definitivo do número central da Data Pet, a Data Pet reserva-se o direito irrevogável de:
          (i) suspender imediatamente a funcionalidade de mensagens do Contratante sem direito a reembolso de créditos;
          (ii) rescindir unilateralmente o contrato por infração culposa grave; e
          (iii) ingressar com ação de indenização integral por perdas e danos materiais e morais provocados à Data Pet e aos demais contratantes prejudicados pela indisponibilidade do canal.
        </Typography>
        <Typography variant="body1">
          4.5. <strong>Direito de Descadastramento (Opt-Out):</strong> Todo tutor que receber notificações através do canal centralizado terá garantido o direito de solicitar a interrupção do envio de mensagens (opt-out), hipótese em que o sistema poderá bloquear automaticamente novos disparos para o referido número.
        </Typography>

        <Typography variant="h6" component="h2">5. Planos de Assinatura, Período de Teste Gratuito e Pagamentos</Typography>
        <Typography variant="body1">
          5.1. <strong>Período de Avaliação Gratuita (Trial de 1 Mês):</strong> O Contratante novo tem direito a 1 (um) mês (30 dias corridos) de teste gratuito sem custo de assinatura (R$ 0,00), a contar da data de conclusão do cadastro. Durante o período de teste, o Contratante poderá usufruir das ferramentas do sistema sem qualquer compromisso de fidelidade ou contratação compulsória.
        </Typography>
        <Typography variant="body1">
          5.2. <strong>Contratação da Assinatura Mensal:</strong> Transcorridos os 30 (trinta) dias de avaliação gratuita, a continuidade de uso da plataforma exigirá a ativação do plano de assinatura mensal (no valor vigente divulgado na plataforma, atualmente de R$ 99,90/mês) e, caso desejado, a aquisição de pacotes adicionais ou combos de mensagens de WhatsApp.
        </Typography>
        <Typography variant="body1">
          5.3. <strong>Processamento Financeiro e Meios de Cobrança:</strong> As assinaturas são cobradas na modalidade pré-paga recorrente mensal, via Cartão de Crédito ou PIX dinâmico, sendo as transações processadas com segurança através da infraestrutura de gateway de pagamento parceiro homologado (Pagar.me / StoneCo).
        </Typography>
        <Typography variant="body1">
          5.4. <strong>Direito de Arrependimento (Artigo 49 do Código de Defesa do Consumidor):</strong> O Contratante tem o prazo improrrogável de 7 (sete) dias corridos, contados a partir da data de confirmação do primeiro pagamento da assinatura paga (pós-trial), para exercer o direito de arrependimento legal, solicitando o cancelamento com restituição integral da quantia desembolsada. Em renovações mensais automáticas subsequentes ou contratações de pacotes de consumo, o cancelamento interrompe cobranças futuras no próximo ciclo, sem direito à restituição proporcional de parcelas do mês em curso já disponibilizado.
        </Typography>

        <Typography variant="h6" component="h2">6. Inadimplência, Período de Carência (Grace Period) e Política de Bloqueio</Typography>
        <Typography variant="body1">
          6.1. <strong>Período de Carência de 3 Dias:</strong> Em caso de não compensação ou recusa na cobrança da mensalidade (situação de atraso ou inadimplência - status "past_due"), a Data Pet concede automaticamente um período de carência de <strong>3 (três) dias corridos</strong> a partir do vencimento, permitindo ao Contratante regularizar o meio de pagamento sem qualquer restrição de uso durante esse interregno.
        </Typography>
        <Typography variant="body1">
          6.2. <strong>Bloqueio de Escrita com Preservação da Leitura:</strong> Decorrido o período de carência de 3 (três) dias sem que ocorra a regularização financeira, o acesso do Contratante à plataforma será parcialmente suspenso:
        </Typography>
        <Box component="ul">
          <li><strong>Operações de Escrita Bloqueadas (HTTP 403):</strong> Fica vedada a inserção, edição ou exclusão de agendamentos, clientes, pets, vendas, comissões ou produtos;</li>
          <li><strong>Garantia de Acesso Somente Leitura (HTTP 200 - Leitura):</strong> Em observância aos princípios da boa-fé e da não retenção abusiva de informações, o Contratante permanecerá com acesso de visualização aos dados cadastrais e históricos já inseridos, possibilitando a consulta de informações enquanto providencia a quitação.</li>
        </Box>
        <Typography variant="body1">
          6.3. <strong>Reativação:</strong> Confirmada a quitação do débito pendente, todas as funcionalidades de gravação e gerenciamento do sistema serão restabelecidas imediatamente de forma automática.
        </Typography>

        <Typography variant="h6" component="h2">7. Responsabilidade pela Custódia e Bem-Estar dos Animais</Typography>
        <Typography variant="body1">
          7.1. <strong>Responsabilidade Civil e Penal Exclusiva do Petshop:</strong> A Data Pet fornece exclusivamente infraestrutura lógica e computacional de software. A custódia física, contenção, higiene, manipulação técnica de lâminas e tesouras, temperatura da água e do soprador, administração de produtos cosméticos, segurança das instalações, prevenção de fugas e bem-estar dos animais atendidos são de responsabilidade civil e criminal exclusiva do Contratante e de seus colaboradores e operadores.
        </Typography>
        <Typography variant="body1">
          7.2. <strong>Isenção por Intercorrências Físicas:</strong> A Data Pet não se responsabiliza por acidentes, cortes, escoriações, dermatites, estresse térmico, fugas, quedas, mordeduras, transmissão de ectoparasitas ou eventuais óbitos de animais domésticos ocorridos nas dependências do estabelecimento do Contratante ou em seus veículos de transporte (táxi dog).
        </Typography>

        <Typography variant="h6" component="h2">8. Frente de Caixa (PDV), Controle Financeiro e Aspectos Fiscais</Typography>
        <Typography variant="body1">
          8.1. <strong>Natureza Gerencial do Módulo Financeiro:</strong> As telas de ponto de venda (PDV), abertura e fechamento de caixa, sangrias, suprimentos e contas a pagar/receber destinam-se exclusivamente à escrituração gerencial interna do petshop.
        </Typography>
        <Typography variant="body1">
          8.2. <strong>Inexistência de Intermediação Financeira ou Assessoria Contábil:</strong> A Data Pet não é instituição financeira, banco, operadora de cartão de crédito nem escritório de contabilidade.
        </Typography>
        <Typography variant="body1">
          8.3. <strong>Obrigações Fiscais e Emissão de Documentos:</strong> Cabe única e exclusivamente ao Contratante emitir as respectivas Notas Fiscais ao Consumidor (NFC-e / NFS-e), recolher os tributos federais, estaduais e municipais aplicáveis à sua atividade comercial (como ICMS e ISS) e arquivar os livros contábeis exigidos pela legislação tributária. A Data Pet não responde pela omissão ou inexatidão fiscal cometida pelo Contratante.
        </Typography>

        <Typography variant="h6" component="h2">9. Propriedade Intelectual</Typography>
        <Typography variant="body1">
          9.1. <strong>Titularidade dos Direitos:</strong> Todos os direitos relativos à plataforma Data Pet, incluindo código-fonte, arquitetura, design visual, bancos de dados, algoritmos, logotipos, marcas e documentações correlatas, são de propriedade intelectual exclusiva da Data Pet.
        </Typography>
        <Typography variant="body1">
          9.2. <strong>Vedações de Cópia e Engenharia Reversa:</strong> É expressamente vedado ao Contratante ou a terceiros copiar, descompilar, realizar engenharia reversa, sublicenciar, comercializar ou desenvolver produtos concorrentes derivados da plataforma Data Pet, sob pena de responsabilização civil e criminal.
        </Typography>

        <Typography variant="h6" component="h2">10. Disponibilidade do Serviço (SLA) e Limitação de Responsabilidade</Typography>
        <Typography variant="body1">
          10.1. <strong>Padrão de Disponibilidade:</strong> A Data Pet emprega padrões técnicos compatíveis com a indústria para manter a plataforma disponível de maneira contínua e estável. Todavia, interrupções temporárias decorrentes de manutenções técnicas essenciais (preferencialmente informadas com antecedência), eventos de força maior ou caso fortuito não constituem descumprimento contratual.
        </Typography>
        <Typography variant="body1">
          10.2. <strong>Exclusões de Responsabilidade:</strong> A Data Pet não responderá por prejuízos resultantes de:
        </Typography>
        <Box component="ul">
          <li>Falhas ou interrupções nos serviços de provedores de internet ou dispositivos locais do Contratante;</li>
          <li>Indisponibilidades pontuais ou bloqueios efetuados pela infraestrutura da Meta / WhatsApp Business;</li>
          <li>Erros de preenchimento, negligência na guarda de senhas ou imperícia cometida pelos operadores do Contratante;</li>
          <li>Lucros cessantes, perdas indiretas, danos morais ou danos reflexos de qualquer natureza.</li>
        </Box>
        <Typography variant="body1">
          10.3. <strong>Teto Indenizatório:</strong> Em qualquer situação em que venha a ser judicialmente reconhecida responsabilidade material da Data Pet, a indenização total máxima devida ao Contratante estará expressamente limitada ao montante total efetivamente pago pelo Contratante à Data Pet nos últimos 3 (três) meses anteriores ao evento.
        </Typography>

        <Typography variant="h6" component="h2">11. Rescisão, Portabilidade e Descarte de Dados</Typography>
        <Typography variant="body1">
          11.1. <strong>Cancelamento Voluntário:</strong> O Contratante poderá cancelar sua assinatura a qualquer momento através do painel administrativo da conta, surtindo efeitos ao término do ciclo mensal vigente contratado.
        </Typography>
        <Typography variant="body1">
          11.2. <strong>Direito de Portabilidade e Exportação:</strong> É assegurado ao Contratante o direito de extrair e exportar suas informações operacionais (relatórios de clientes, pets e vendas) durante a vigência do contrato ou no prazo de até 30 (trinta) dias após o cancelamento.
        </Typography>
        <Typography variant="body1">
          11.3. <strong>Descarte Definitivo:</strong> Decorrido o prazo de 30 (trinta) dias contados do encerramento definitivo ou rescisão contratual, a Data Pet reserva-se o direito de eliminar permanentemente os dados operacionais vinculados ao tenant de seus servidores em produção, com exceção daqueles cuja guarda seja obrigatória por imposição do Marco Civil da Internet (Lei nº 12.965/2014) ou legislação fiscal correlata.
        </Typography>

        <Typography variant="h6" component="h2">12. Modificações dos Termos de Uso</Typography>
        <Typography variant="body1">
          12.1. A Data Pet poderá revisar e atualizar estes Termos periodicamente para contemplar melhorias tecnológicas, novas funcionalidades ou adequações a atos regulatórios. As atualizações substanciais serão comunicadas aos usuários através de avisos no painel da plataforma ou por mensagem eletrônica. A continuidade da utilização do software após a vigência das alterações consubstancia a concordância expressa com as novas disposições.
        </Typography>

        <Typography variant="h6" component="h2">13. Legislação Aplicável e Foro de Eleição</Typography>
        <Typography variant="body1">
          13.1. Este contrato é regido e interpretado segundo as leis da República Federativa do Brasil. Para a resolução de qualquer controvérsia, litígio ou reivindicação decorrente destes Termos, as partes elegem o foro da comarca da sede da empresa operadora da plataforma Data Pet, renunciando a qualquer outro, por mais privilegiado que seja.
        </Typography>

        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" sx={{ textAlign: "center", fontStyle: "italic", opacity: 0.7 }}>
          Versão 2.1 — Atualizado formalmente em {new Date().toLocaleDateString("pt-BR")}
        </Typography>
      </Box>
    ),
  },
  privacy: {
    title: "Política de Privacidade e Proteção de Dados (LGPD)",
    content: (
      <Box
        sx={{
          "& > h2": {
            mt: 4,
            mb: 1.5,
            fontWeight: 800,
            fontSize: "1.15rem",
            color: "text.primary",
            letterSpacing: "-0.01em",
          },
          "& > p": {
            mb: 2,
            lineHeight: 1.7,
            color: "text.secondary",
            fontSize: "0.95rem",
            textAlign: "justify",
          },
          "& > ul": {
            mb: 2,
            pl: 3,
            color: "text.secondary",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          },
        }}
      >
        <Typography variant="body1" sx={{ fontStyle: "italic", mb: 3, color: "text.primary", fontWeight: 500 }}>
          A plataforma <strong>Data Pet</strong> reconhece a relevância fundamental da privacidade e da proteção de dados pessoais. Esta Política de Privacidade disciplina como os dados pessoais são coletados, tratados, armazenados e protegidos em nosso ecossistema de software, em estrita conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong> e o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
        </Typography>

        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Declaração Expressa de Papéis sob a LGPD</AlertTitle>
          Nos termos do Art. 5º da LGPD: o <strong>Petshop Contratante é o CONTROLADOR</strong> dos dados pessoais de seus clientes (tutores) e funcionários inseridos no sistema. A <strong>Data Pet atua como OPERADORA</strong>, tratando referidos dados exclusivamente em nome e conforme as instruções legítimas do Contratante para viabilizar as rotinas da plataforma.
        </Alert>

        <Typography variant="h6" component="h2">1. Definições e Papéis no Tratamento de Dados</Typography>
        <Typography variant="body1">
          1.1. Para os fins da presente política e em consonância com o Artigo 5º da Lei nº 13.709/2018:
        </Typography>
        <Box component="ul">
          <li><strong>Controlador:</strong> A pessoa jurídica ou empresário titular do petshop que decide sobre as finalidades e os meios de tratamento dos dados de seus tutores e colaboradores cadastrados na plataforma.</li>
          <li><strong>Operadora (Data Pet):</strong> A provedora de infraestrutura de software que realiza o processamento dos dados estritamente para a execução do contrato de licença de software e prestação de serviços tecnológicos.</li>
          <li><strong>Titulares:</strong> As pessoas naturais às quais os dados pessoais se referem (proprietários de petshops, colaboradores/funcionários e tutores clientes finais).</li>
          <li><strong>Encarregado (DPO):</strong> Pessoa indicada para atuar como canal de comunicação entre o controlador, os titulares e a Autoridade Nacional de Proteção de Dados (ANPD).</li>
        </Box>

        <Typography variant="h6" component="h2">2. Categorias de Informações Tratadas na Plataforma</Typography>
        <Typography variant="body1">
          2.1. O ecossistema Data Pet processa as seguintes categorias de dados para suas finalidades operacionais:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>a) Dados do Contratante e Administradores:</strong> Razão social, nome fantasia, CNPJ ou CPF do responsável, endereço completo do estabelecimento, telefone, e-mail comercial, senha criptografada com algoritmo irreversível e logs de acesso.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>b) Dados dos Colaboradores do Petshop:</strong> Nome completo, cargo/função (ex: banhista, tosador, operador), telefone de contato, dias e horários de escala de trabalho e registros de comissões auferidas por atendimento.
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>c) Dados dos Clientes Finais (Tutores):</strong> Nome, número de telefone celular (para envio de notificações via WhatsApp), endereço residencial para transporte/leva-e-traz e CPF (quando informado para emissão de comprovantes de venda pelo petshop).
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>d) Informações dos Animais de Estimação (Pets):</strong> Nome do animal, espécie (cão, gato, etc.), raça, idade/data de nascimento, peso, histórico de banhos e tosas, fotografias e observações comportamentais ou restrições físicas (ex: sensibilidade na pele, histórico de mordedura ou agressividade).
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>e) Dados de Faturamento e Assinatura SaaS:</strong> Informações de pagamento da mensalidade do software (dados de cartão tokenizados e gerenciados de forma compatível com o padrão PCI-DSS pelo gateway Pagar.me, sem armazenamento de código de segurança CVV em nossos servidores).
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, mb: 1 }}>
          <strong>f) Registros de Conexão e Navegação:</strong> Endereço IP de origem, data e hora de cada transação, tipo de navegador e identificador de dispositivo, armazenados em cumprimento ao Art. 15 do Marco Civil da Internet.
        </Typography>

        <Typography variant="h6" component="h2">3. Finalidades e Bases Legais do Tratamento</Typography>
        <Typography variant="body1">
          3.1. Os dados são tratados estritamente mediante bases legais autorizadas pela LGPD:
        </Typography>
        <Box component="ul">
          <li><strong>Execução de Contrato (Art. 7º, V da LGPD):</strong> Viabilizar a criação de contas, gestão de agendamentos, emissão de tickets de serviço, cálculo de comissões e funcionamento regular das ferramentas de PDV e estoque;</li>
          <li><strong>Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II da LGPD):</strong> Manutenção obrigatória dos logs de aplicação pelo prazo mínimo de 6 (seis) meses (Lei nº 12.965/2014) e emissão de notas fiscais do serviço de software;</li>
          <li><strong>Legítimo Interesse (Art. 7º, IX da LGPD):</strong> Aprimoramento da estabilidade do sistema, implementação de medidas antifraude, suporte técnico e melhoria contínua da experiência de uso;</li>
          <li><strong>Consentimento (Art. 7º, I da LGPD):</strong> Coletado e garantido pelo Contratante perante seus tutores e colaboradores para inclusão de suas informações e recepção de notificações via WhatsApp.</li>
        </Box>

        <Typography variant="h6" component="h2">4. Comunicações Transacionais via WhatsApp Centralizado</Typography>
        <Typography variant="body1">
          4.1. <strong>Operação pelo Número Central:</strong> Os disparos de lembretes e status de atendimento aos tutores ocorrem por meio de número oficial centralizado da Data Pet. O tráfego de dados restringe-se exclusivamente aos parâmetros indispensáveis para a mensagem transacional (primeiro nome do tutor, nome do animal, horário e identificação do petshop contratante).
        </Typography>
        <Typography variant="body1">
          4.2. <strong>Responsabilidade pela Licitude do Envio:</strong> O Contratante é o exclusivo responsável por certificar que os tutores cadastrados autorizaram o contato telefônico para fins de prestação de serviços de petshop. A plataforma repudia a transmissão de mensagens intrusivas ou desprovidas de vínculo com o serviço contratado.
        </Typography>
        <Typography variant="body1">
          4.3. <strong>Descadastramento (Opt-Out):</strong> Qualquer titular poderá solicitar a interrupção do recebimento de mensagens a qualquer tempo, seja sinalizando diretamente ao petshop contratante, seja solicitando descadastramento através de resposta ao canal emissor.
        </Typography>

        <Typography variant="h6" component="h2">5. Compartilhamento de Dados com Terceiros (Subprocessadores)</Typography>
        <Typography variant="body1">
          5.1. <strong>Vedação de Venda de Dados:</strong> A Data Pet <strong>NÃO</strong> comercializa, aluga, repassa nem monetiza bases de dados de seus contratantes, colaboradores ou tutores sob qualquer pretexto.
        </Typography>
        <Typography variant="body1">
          5.2. <strong>Compartilhamento Estritamente Operacional:</strong> Os dados podem ser compartilhados unicamente com parceiros de infraestrutura indispensáveis para a operação do sistema:
        </Typography>
        <Box component="ul">
          <li>Provedores de Nuvem e Servidores Seguros (infraestrutura de cloud hosting com certificações ISO 27001 e SOC 2);</li>
          <li>Gateways de Pagamento e Adquirentes (Pagar.me / StoneCo) para processamento financeiro seguro das assinaturas e pacotes;</li>
          <li>Provedores e APIs de Telecomunicação/Mensageria (Meta / WhatsApp Cloud API) para entrega dos disparos transacionais aos tutores;</li>
          <li>Órgãos Governamentais e Autoridades Judiciais, exclusivamente mediante ordem judicial fundamentada ou exigência legal expressa.</li>
        </Box>

        <Typography variant="h6" component="h2">6. Segurança da Informação e Criptografia</Typography>
        <Typography variant="body1">
          6.1. A Data Pet implementa controles técnicos e organizacionais rigorosos para proteger os dados pessoais contra acessos não autorizados, perdas, destruição ou alterações acidentais:
        </Typography>
        <Box component="ul">
          <li>Criptografia de ponta a ponta nas conexões via protocolo HTTPS / SSL / TLS;</li>
          <li>Armazenamento de senhas mediante funções de dispersão criptográfica irreversível (*hashing* com salt);</li>
          <li>Isolamento lógico e estrutural estrito entre as bases de dados dos diferentes tenants (multi-tenant com controle de acesso por token);</li>
          <li>Rotinas automatizadas de cópias de segurança (backups periódicos protegidos);</li>
          <li>Políticas internas restritivas de privilégios de acesso aos servidores da aplicação.</li>
        </Box>

        <Typography variant="h6" component="h2">7. Direitos dos Titulares de Dados (Artigo 18 da LGPD)</Typography>
        <Typography variant="body1">
          7.1. Os titulares de dados pessoais possuem os direitos assegurados pelo Art. 18 da LGPD, incluindo:
        </Typography>
        <Box component="ul">
          <li>Confirmação da existência de tratamento e acesso aos dados tratados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
          <li>Portabilidade dos dados a outro fornecedor de serviço, mediante requisição expressa;</li>
          <li>Eliminação dos dados pessoais tratados com consentimento, ressalvadas as hipóteses legais de guarda;</li>
          <li>Revogação do consentimento.</li>
        </Box>
        <Typography variant="body1">
          7.2. <strong>Fluxo de Atendimento a Tutores e Colaboradores:</strong> Considerando que o Petshop Contratante é o Controlador direto dos dados de seus tutores e colaboradores, os pedidos de retificação, acesso ou exclusão de tais titulares devem ser direcionados prioritariamente ao próprio Petshop, o qual dispõe de ferramentas nativas no sistema para atualizar, exportar ou inativar os registros.
        </Typography>

        <Typography variant="h6" component="h2">8. Retenção, Ciclo de Vida e Descarte Seguro dos Dados</Typography>
        <Typography variant="body1">
          8.1. Os dados permanecerão armazenados durante o período de vigência da assinatura do Contratante na plataforma.
        </Typography>
        <Typography variant="body1">
          8.2. <strong>Prazos Pós-Cancelamento:</strong> Após a solicitação de cancelamento da assinatura ou transcorrido o período de tolerância sem quitação, a conta entrará em período de exportação por até 30 (trinta) dias. Findo este período, os dados operacionais vinculados ao tenant serão eliminados permanentemente dos bancos de produção ativos.
        </Typography>
        <Typography variant="body1">
          8.3. <strong>Guarda por Obrigação Legal:</strong> Em conformidade com o Artigo 15 da Lei nº 12.965/2014 (Marco Civil da Internet), os registros de conexão à aplicação (logs com IP, data e hora) serão mantidos sob sigilo em ambiente controlado pelo prazo estipulado por lei de 6 (seis) meses antes do seu expurgo definitivo.
        </Typography>

        <Typography variant="h6" component="h2">9. Gestão de Incidentes de Segurança</Typography>
        <Typography variant="body1">
          9.1. Em caso de ocorrência de qualquer incidente de segurança comprovado que possa acarretar risco ou dano relevante aos titulares de dados pessoais, a Data Pet adotará medidas técnicas imediatas de contenção e comunicará formalmente os Contratantes afetados e a Autoridade Nacional de Proteção de Dados (ANPD), prestando os esclarecimentos necessários em prazo razoável, nos termos do Art. 48 da LGPD.
        </Typography>

        <Typography variant="h6" component="h2">10. Cookies e Tecnologias de Sessão</Typography>
        <Typography variant="body1">
          10.1. A plataforma Data Pet utiliza cookies estritamente operacionais e de autenticação (tokens de sessão e cookies de segurança) indispensáveis para manter o usuário logado e assegurar a integridade do ambiente. A desativação desses cookies pelo navegador impedirá a autenticação e o uso regular do software.
        </Typography>

        <Typography variant="h6" component="h2">11. Canal de Comunicação do Encarregado de Dados (DPO)</Typography>
        <Typography variant="body1">
          11.1. Para exercer os direitos previstos na LGPD, dirimir dúvidas sobre esta Política de Privacidade ou submeter requisições formais, o titular poderá entrar em contato com o nosso Encarregado de Proteção de Dados (DPO) através do canal de suporte oficial:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2, fontWeight: 600, color: "primary.main" }}>
          E-mail do Encarregado (DPO): dpo@datapet.com.br
        </Typography>

        <Divider sx={{ my: 4 }} />
        <Typography variant="body2" sx={{ textAlign: "center", fontStyle: "italic", opacity: 0.7 }}>
          Versão 2.1 — Atualizado formalmente em {new Date().toLocaleDateString("pt-BR")}
        </Typography>
      </Box>
    ),
  },
};


