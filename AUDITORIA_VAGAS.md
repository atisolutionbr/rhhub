# Auditoria de origem e integridade — 24/10/2026

## Diagnóstico comprovado

A base herdada tinha 5.028 anúncios. A migração `20260704104222_005_populate_jobs.sql` gera 5.000 registros em um loop, com salários, empresas, localizações, visualizações e candidaturas artificiais. Os outros 28 registros não tinham evidência suficiente de disponibilidade atual. A quantidade exibida anteriormente representava registros importados, não vagas reais verificadas; a validação anterior dos portais não havia demonstrado a veracidade desse catálogo.

Não havia agendador RHHub instalado para os importadores. Onze fontes estavam habilitadas em configuração, incluindo URLs de páginas iniciais apresentadas como feeds RSS. Os scrapers antigos usavam caminhos e extração por regex frágeis, limites de 15 vagas e valores padrão não comprovados: CLT, Pleno, presencial/remoto e localização Brasil. Faltava o índice único exigido pelo `ON CONFLICT(external_id)`, impedindo as atualizações. Havia ainda políticas de escrita anônima em referências salariais, rankings e logs.

Páginas públicas continham números comerciais, vagas internas de demonstração, rankings, referências salariais e promessas de IA sem implementação correspondente.

## Correções

- Backup PostgreSQL integral e quarentena com payload original: 5.028 anúncios, 16 cadastros de empresa, 48 referências salariais e 20 rankings. Registros, contas e vínculos das candidaturas foram preservados. A quarentena não participa da busca pública e não pode ser republicada pelo painel.
- As cinco entradas de importação legada retornam HTTP 410. O parser de currículo e o cadastro permanecem ativos. Escritas anônimas nos dados de mercado e logs foram removidas.
- Nova coleta apenas por APIs públicas documentadas, com ID externo único, atualização idempotente, resposta original, hash, link de origem, data de conferência e prazo de disponibilidade. A prova confirma publicação na fonte; não é garantia de contratação nem auditoria independente do empregador.
- Valores salariais, moeda e período são preservados. Informação ausente permanece ausente; `Full Time` não vira CLT. Texto salarial não estruturado é exibido como recebido. Nenhuma conversão cambial foi introduzida.
- `live_jobs` aplica as regras de publicação e validade inclusive para o admin que navega nas páginas públicas. Anúncios externos sem reconferência por 36 horas ou com prazo vencido saem da consulta pública.
- Estatísticas calculadas no PostgreSQL sobre toda a base válida, sem limite silencioso de 1.000 linhas. Empresas exibidas são citadas nas fontes, sem alegação de parceria. Salários são valores dos anúncios, não médias inventadas.
- Candidaturas externas abrem o link original sem exigir cadastro e sem alegar que um currículo foi enviado. Anúncios internos são enviados para revisão administrativa antes da publicação.
- Removidas vagas internas fictícias, estatísticas comerciais e promessas de IA sem implementação. Planos pagos herdados ficaram inativos; não há cobrança publicada.

## Fontes efetivamente consultadas

| Fonte | Consulta observada | Anúncios preparados na primeira coleta |
|---|---|---:|
| Himalayas | API pública com filtro de elegibilidade Brasil e condições geográficas preservadas | 1.158 |
| Remotive | API pública; apenas anúncios técnicos com abrangência compatível | 2 |
| CI&T / Lever | Mural público do empregador, país BR | 125 |

Total inicial: **1.285 anúncios**, não uma garantia de 1.285 posições distintas entre todos os portais. A deduplicação é feita pelo identificador de cada fonte. São 143 anúncios com valores salariais numéricos na primeira coleta; moeda e período variam.

### Resultado após retomada do serviço

Às 08:48 de 24/10/2026 (Brasília), o serviço systemd terminou com sucesso e concluiu a varredura paginada da Himalayas. O catálogo chegou a **3.271 anúncios**: 3.144 Himalayas, 125 CI&T/Lever e dois Remotive. A segunda etapa examinou 3.947 registros da fonte, inseriu 1.986 anúncios técnicos e atualizou três já conhecidos. Os números variam com novas publicações e encerramentos; não são um total fixo prometido pelo portal.

A Himalayas respondeu HTTP 429 após a página 108. A execução inicial foi registrada como parcial; após a espera, retomou da página 109 e concluiu a varredura. Novas execuções seguem checkpoint e cooldown, sem contornar limites. A sondagem do mural Nubank/Greenhouse retornou lista vazia e não foi apresentada como conexão com vagas disponíveis. LinkedIn, Catho, Indeed, InfoJobs, Gupy e TheirStack não foram apresentados como conectados sem acesso real.

## Operação e limites

`rhhub-sync.timer` verifica a fila a cada hora. Uma coleta completa de uma fonte tem intervalo mínimo de 12 horas; varreduras interrompidas retomam após o prazo de espera. HTTP 429 respeita `Retry-After` ou uma espera conservadora de 15 minutos. Erros não são convertidos em sucesso ou em listas vazias. Anúncios ausentes são expirados somente depois de uma varredura completa da fonte.

Categorias e tecnologias são organização derivada de termos presentes no anúncio, não requisitos acrescentados pelo portal. Campos originais ficam preservados no payload. Fontes podem mudar o anúncio, encerrar a vaga ou alterar suas APIs; consulte sempre a origem antes de candidatar-se. Não há garantia honesta de disponibilidade permanente de 100% das vagas de sites terceiros.

SMTP, envio de alertas e cobrança automática não foram ativados nem anunciados como disponíveis. Os testes com mutações de vagas exigem staging descartável; não se publicam anúncios artificiais em produção para testar.

Backups e snapshots privados na VPS: `/var/backups/rhhub/audit-20261024`, `/opt/rhhub/backup/verified-feeds`. Configuração: `infra/ingestion`. Verificação não destrutiva: `tests/production-integrity.py`; normalização e formatação: `tests/verified-sources.test.py`, `tests/salary-truth.test.cjs`.

Documentação primária: [Himalayas](https://himalayas.app/docs/remote-jobs-api), [Remotive](https://github.com/remotive-com/remote-jobs-api), [Lever](https://github.com/lever/postings-api), [mural oficial CI&T](https://ciandt.com/br/pt-br/carreiras/oportunidades).
