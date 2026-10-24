# Implantação auditada — 24/10/2026

Aplicação: https://rh.atisolution.com.br
Repositório: https://github.com/atisolutionbr/rhhub

Versão r9 conectada ao PostgreSQL da VPS. Catálogo público após retomada: 3.271 anúncios com origem identificada — 3.144 Himalayas, 125 CI&T/Lever e dois Remotive. Valores, moeda, período, localizações e links preservam as condições da fonte. A coleta inicial da Himalayas foi parcial por HTTP 429, e foi retomada até concluir, com limites e checkpoint configurados. Não há conexão alegada a portais privados sem acesso real.

Os 5.028 anúncios antigos foram preservados em quarentena, incluindo 5.000 gerados por migração de demonstração. Referências salariais, rankings e cadastros sem evidência não participam das páginas públicas. As contas e os vínculos existentes foram preservados.

Foram removidos números comerciais, vagas internas fictícias e promessas de IA sem implementação. Salários são dos anúncios, não estimativas. Planos pagos ficaram indisponíveis. Novas vagas internas precisam de revisão administrativa. Importadores legados foram desativados; APIs documentadas e serviço systemd fazem a coleta.

Build TypeScript/Vite aprovado; testes de acesso, cache e formato salarial aprovados. Testes de normalização, ausência de dados e rate limit aprovados. Vinte verificações não destrutivas passaram por HTTPS/PostgreSQL. A captura visual final não pôde ser refeita por falha local da ferramenta de navegador; não apresentar screenshots antigos como evidência desta versão.

Relatório completo: AUDITORIA_VAGAS.md. Operação: OPERACAO.md. Portais e acessos: PORTAIS.md. Segredos e backups permanecem fora do Git.

Continuam pendentes o binário de um currículo original, SMTP e envio de alertas. A disponibilidade e a veracidade de declarações de empregadores não podem ser garantidas permanentemente por um agregador; os anúncios têm fonte, evidência e prazo de reconferência.
