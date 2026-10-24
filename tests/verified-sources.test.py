import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
from email.message import Message
import urllib.error

spec = importlib.util.spec_from_file_location('verified', Path(__file__).resolve().parents[1] / 'scripts/sync_verified_jobs.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SourceTruthTests(unittest.TestCase):
    def fixture(self, **changes):
        raw = dict(title='Software Engineer', companyName='Fixture company', categories=['Engineering'], parentCategories=[],
                   guid='https://himalayas.app/companies/fixture/jobs/software-engineer',
                   applicationLink='https://himalayas.app/companies/fixture/jobs/software-engineer?utm_source=api',
                   description='<p>Python APIs</p>', pubDate=1792675549, expiryDate=1795259343,
                   minSalary=100, maxSalary=150, currency='USD', salaryPeriod='hourly', seniority=['Senior'],
                   employmentType='Full Time', locationRestrictions=['Brazil'], timezoneRestrictions=[-3])
        raw.update(changes)
        return raw

    def test_currency_period_and_application_url_are_preserved(self):
        raw = self.fixture()
        row = module.normalize(raw, 'Himalayas', '2026-10-24T12:00:00+00:00')
        self.assertEqual((row['salary_min'],row['salary_max'],row['salary_currency'],row['salary_period']),(100,150,'USD','hourly'))
        self.assertEqual(row['external_url'],raw['applicationLink'])
        self.assertIsNone(row['employment_type'])  # Full Time does not establish CLT.
        self.assertEqual(row['seniority'],'senior')
        self.assertIsNone(row['location_city'])
        self.assertEqual(row['location_restrictions'],['Brazil'])

    def test_missing_data_is_not_guessed(self):
        row=module.normalize(self.fixture(minSalary=None,maxSalary=None,seniority=[],employmentType=None), 'Himalayas', '2026-10-24T12:00:00+00:00')
        self.assertIsNone(row['salary_min'])
        self.assertIsNone(row['seniority'])
        self.assertIsNone(row['employment_type'])
        self.assertFalse(row['is_featured'])

    def test_expired_or_wrong_origin_is_not_published(self):
        for changes in [dict(expiryDate=1),dict(guid='https://example.com/fake'),dict(applicationLink='javascript:alert(1)'),dict(description='')]:
            self.assertIsNone(module.normalize(self.fixture(**changes),'Himalayas','2026-10-24T12:00:00+00:00'))

    def test_non_tech_job_is_filtered(self):
        self.assertIsNone(module.normalize(self.fixture(title='Warehouse Assistant',categories=['Logistics']),'Himalayas','2026-10-24T12:00:00+00:00'))

    def test_payload_hash_tracks_evidence(self):
        first=module.normalize(self.fixture(),'Himalayas','2026-10-24T12:00:00+00:00')
        changed=module.normalize(self.fixture(description='Changed requirements'),'Himalayas','2026-10-24T12:00:00+00:00')
        self.assertNotEqual(first['source_payload_hash'],changed['source_payload_hash'])

    def test_rate_limit_is_not_bypassed_or_converted_to_empty_feed(self):
        headers=Message();headers['Retry-After']='600'
        error=urllib.error.HTTPError('https://himalayas.app/jobs/api',429,'Too Many Requests',headers,None)
        with patch.object(module.urllib.request,'urlopen',side_effect=error) as mocked:
            with self.assertRaises(module.SourceRateLimit) as result:
                module.fetch('https://himalayas.app/jobs/api')
            self.assertEqual(result.exception.seconds,600)
            self.assertEqual(mocked.call_count,1)

    def test_lever_location_and_employment_are_not_invented(self):
        raw=dict(text='Senior Developer Python',categories={'team':'Development','location':'Brazil','commitment':'Full Time'},country='BR',descriptionPlain='Python APIs',id='fixture',createdAt=1792675549000,workplaceType='hybrid',hostedUrl='https://jobs.lever.co/ciandt/fixture',applyUrl='https://jobs.lever.co/ciandt/fixture/apply')
        row=module.normalize(raw,'CI&T (Lever)','2026-10-24T12:00:00+00:00')
        self.assertEqual(row['modality'],'hybrid')
        self.assertEqual(row['source_location_text'],'Brazil')
        self.assertTrue(row['published_at'].startswith('2026-'))
        self.assertIsNone(row['employment_type'])
        self.assertIsNone(row['salary_min'])

if __name__=='__main__': unittest.main()
