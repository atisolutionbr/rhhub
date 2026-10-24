# Mapa e validação dos portais

Atualização em 24/10/2026: catálogo auditado em [AUDITORIA_VAGAS.md](AUDITORIA_VAGAS.md). Dados demonstrativos foram isolados; somente anúncios com origem conferida participam da busca pública.

Verificação em 23/10/2026 no backend PostgreSQL da VPS. Os três acessos solicitados foram configurados e autenticados. Senhas ficam fora deste documento e do Git.

| Portal | Endereço | Conta | Seções |
|---|---|---|---|
| Candidato | /candidato | demo@atisolution.com.br | Visão Geral, Candidaturas, Favoritos, Alertas, Meu Perfil |
| Empresa | /empresa | empresa@atisolution.com.br | Visão Geral, Minhas Vagas, Candidatos, Perfil da Empresa |
| Admin | /admin | admin@atisolution.com.br | Visão Geral, Vagas, Usuários, Empresas, Fontes de Dados, Logs de Sincronização, Planos |

## Permissões e funções

Candidato consulta e edita o próprio perfil, envia/baixa seu currículo, registra candidaturas, acompanha status, mantém favoritos e configura alertas. A configuração do alerta é persistida; o envio automático de notificações depende de um serviço de entrega ainda não configurado.

Empresa mantém seu cadastro, envia suas vagas para revisão administrativa e gerencia o status das candidaturas recebidas. A consulta de nome, e-mail, telefone, título profissional e currículo exige uma candidatura a uma vaga dessa empresa. A nova função company_applicants não expõe candidatos sem essa relação. O banco impede autoverificação da empresa e alteração da identidade de uma candidatura.

Admin consulta indicadores, busca e pagina toda a base de vagas, modera vagas, altera o tipo de usuário, verifica empresas, gerencia fontes e consulta logs e planos. A gestão de vagas deixou de limitar a consulta às últimas 50. A seção Planos é de consulta; não existe editor de planos nesse painel. Fontes de Dados cadastra e ativa fontes; a coleta documentada de Himalayas, Remotive e CI&T/Lever está agendada; as integrações legadas foram desativadas. O indicador de fonte habilitada não representa execução do importador. Planos pagos e cobranças estão indisponíveis.

Rotas privadas exigem o papel correspondente. Banco e APIs também aplicam as restrições: candidato não cria empresa, não edita vaga e não se promove a admin; empresa não acessa alertas privados nem transfere candidaturas; usuários anônimos não consultam candidaturas. Admin possui gestão dos dados do sistema.

## Evidências

tests/portal-integration.py é restrito a staging descartável e valida os logins dos três perfis e o fluxo empresa cria rascunho → envia para revisão → admin publica vaga → candidato se candidata → empresa recebe dados autorizados → altera status → candidato acompanha → admin modera. Também verifica favoritos, alertas e negativas de permissão. Os registros de teste usam UUIDs próprios e são removidos ao final. As credenciais são lidas de arquivo privado na VPS.

Extração de texto, PDF e DOCX e armazenamento privado foram validados na implantação anterior. O binário de um currículo da origem ainda não foi recuperado. Recuperação de senha por e-mail depende de SMTP. Nenhum teste aqui afirma entrega de alertas por e-mail, cobrança automática ou funcionamento de todos os portais externos de importação.

Favicon atualizado para o ícone PNG existente da marca, também usado na instalação PWA.
