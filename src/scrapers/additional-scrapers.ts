import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job, generateJobHash } from '../services/supabase.js';
import { normalizeWorkMode } from '../utils/normalization.js';

export const scrapeStepStone = async (keyword: string, location: string): Promise<Job[]> => {
    const jobs: Job[] = [];
    try {
        const url = `https://www.stepstone.de/jobs/${encodeURIComponent(keyword)}/in-${encodeURIComponent(location)}?radius=30`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const nextData = $('#__NEXT_DATA__').html();
        if (nextData) {
            const data = JSON.parse(nextData);
            const results = data.props?.pageProps?.results || [];
            for (const res of results) {
                // StepStone usually has a relative date or absolute date in the payload
                // If it's too old, we skip it.
                jobs.push({
                    job_hash: generateJobHash(res.url, res.title, res.companyName),
                    title: res.title,
                    company: res.companyName,
                    location: res.location,
                    work_mode: normalizeWorkMode(res.description || ''),
                    url: `https://www.stepstone.de${res.url}`,
                    source: 'StepStone',
                    date_found: new Date().toISOString(),
                    posted_at: res.publicationDatetime
                });
            }
        }
    } catch (err) {
        console.error('StepStone Scraper Error:', err);
    }
    return jobs;
};

export const scrapeArbeitNow = async (keyword: string): Promise<Job[]> => {
    const jobs: Job[] = [];
    try {
        const url = `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(keyword)}`;
        const response = await axios.get(url);
        const results = response.data.data || [];
        for (const res of results) {
            jobs.push({
                job_hash: generateJobHash(res.url, res.title, res.company_name),
                title: res.title,
                company: res.company_name,
                location: res.location,
                work_mode: res.remote ? 'Remote' : 'Onsite',
                url: res.url,
                source: 'ArbeitNow',
                date_found: new Date().toISOString(),
                posted_at: new Date(res.created_at * 1000).toISOString(),
            });
        }
    } catch (err) {
        console.error('ArbeitNow Scraper Error:', err);
    }
    return jobs;
};

export const scrapeAdzuna = async (keyword: string, country: string): Promise<Job[]> => {
    const jobs: Job[] = [];
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return jobs;
    try {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&what=${encodeURIComponent(keyword)}&max_days_old=7`;
        const response = await axios.get(url);
        const results = response.data.results || [];
        for (const res of results) {
            jobs.push({
                job_hash: generateJobHash(res.redirect_url, res.title, res.company.display_name),
                title: res.title,
                company: res.company.display_name,
                location: res.location.display_name,
                work_mode: normalizeWorkMode(res.description),
                url: res.redirect_url,
                source: 'Adzuna',
                date_found: new Date().toISOString(),
                posted_at: res.created,
            });
        }
    } catch (err) {
        console.error('Adzuna Scraper Error:', err);
    }
    return jobs;
};
