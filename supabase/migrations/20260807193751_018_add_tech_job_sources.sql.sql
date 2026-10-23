/*
# Add new tech job sources

1. New job sources:
- Gupy (scraping) - tech jobs from gupy.com.br
- Melhores Empregos (scraping) - tech jobs from melhoresempregos.com
- Theirstack (api) - tech jobs aggregator
- Glassdoor (scraping) - tech jobs from glassdoor.com

2. Notes:
- All sources are active and focused on IT/technology jobs
*/

INSERT INTO job_sources (name, url, source_type, is_active, sync_interval_minutes)
VALUES
  ('Gupy', 'https://www.gupy.com.br', 'scraping', true, 360),
  ('Melhores Empregos', 'https://www.melhoresempregos.com', 'scraping', true, 360),
  ('Theirstack', 'https://www.theirstack.com', 'api', true, 360),
  ('Glassdoor', 'https://www.glassdoor.com', 'scraping', true, 360);