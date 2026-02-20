import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job, generateJobHash } from '../services/supabase.js';
import { normalizeWorkMode } from '../utils/normalization.js';

export const scrapeLinkedIn = async (keyword: string, location: string): Promise<Job[]> => {
    const jobs: Job[] = [];
    try {
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_TPR=r604800&start=0`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $ = cheerio.load(response.data);
        $('.base-search-card').each((i, element) => {
            const title = $(element).find('.base-search-card__title').text().trim();
            const company = $(element).find('.base-search-card__subtitle').text().trim();
            const jobLocation = $(element).find('.job-search-card__location').text().trim();
            const jobUrl = $(element).find('.base-card__full-link').attr('href') || '';

            if (title && company && jobUrl) {
                jobs.push({
                    job_hash: generateJobHash(jobUrl, title, company),
                    title,
                    company,
                    location: jobLocation,
                    work_mode: normalizeWorkMode(title + ' ' + jobLocation),
                    url: jobUrl,
                    source: 'LinkedIn',
                    date_found: new Date().toISOString(),
                });
            }
        });

        if (jobs.length === 0 && process.env.SERPAPI_KEY) {
            const serpUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(`${keyword} site:linkedin.com/jobs`)}&location=${encodeURIComponent(location)}&api_key=${process.env.SERPAPI_KEY}`;
            const serpResp = await axios.get(serpUrl);
            const serpResults = serpResp.data.jobs_results || [];
            for (const job of serpResults) {
                jobs.push({
                    job_hash: generateJobHash(job.related_links?.[0]?.link || job.title, job.title, job.company_name),
                    title: job.title,
                    company: job.company_name,
                    location: job.location,
                    work_mode: normalizeWorkMode(job.description || ''),
                    url: job.related_links?.[0]?.link || '',
                    source: 'LinkedIn (SerpAPI)',
                    date_found: new Date().toISOString(),
                });
            }
        }
    } catch (err) {
        console.error('LinkedIn Scraper Error:', err);
    }
    return jobs;
};

export const scrapeIndeed = async (keyword: string, location: string): Promise<Job[]> => {
    const jobs: Job[] = [];
    try {
        const url = `https://de.indeed.com/rss?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}&fromage=7`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data, { xmlMode: true });
        $('item').each((i, element) => {
            const title = $(element).find('title').text().trim();
            const link = $(element).find('link').text().trim();
            const description = $(element).find('description').text().trim();
            const parts = title.split(' - ');
            const jobTitle = parts[0]?.trim() || title;
            const company = parts[1]?.trim() || 'Unknown';

            if (jobTitle && link) {
                jobs.push({
                    job_hash: generateJobHash(link, jobTitle, company),
                    title: jobTitle,
                    company,
                    location,
                    work_mode: normalizeWorkMode(description),
                    url: link,
                    source: 'Indeed',
                    date_found: new Date().toISOString(),
                    posted_at: $(element).find('pubDate').text().trim(),
                });
            }
        });
    } catch (err) {
        console.error('Indeed Scraper Error:', err);
    }
    return jobs;
};
