import dotenv from 'dotenv';
import { saveJob } from './services/supabase.js';
import { scrapeLinkedIn, scrapeIndeed } from './scrapers/core-scrapers.js';
import { scrapeStepStone, scrapeArbeitNow, scrapeAdzuna } from './scrapers/additional-scrapers.js';

dotenv.config();

const TITLES = ['RPA Developer', 'UiPath Developer', 'Automation Engineer', 'Intelligent Automation', 'RPA Entwickler'];
const COUNTRIES = [
    { name: 'Germany', code: 'de' },
    { name: 'Netherlands', code: 'nl' },
    { name: 'Belgium', code: 'be' },
    { name: 'Luxembourg', code: 'lu' }
];

async function runDiscovery() {
    console.log('--- Starting RPA Job Discovery v2 ---');
    let totalNew = 0;
    const summary: Record<string, number> = {};

    for (const title of TITLES) {
        for (const country of COUNTRIES) {
            console.log(`Searching for "${title}" in ${country.name}...`);

            const tasks = [
                scrapeLinkedIn(title, country.name),
                scrapeIndeed(title, country.name),
                scrapeStepStone(title, country.name),
                scrapeArbeitNow(title),
                scrapeAdzuna(title, country.code)
            ];

            const results = await Promise.all(tasks);
            const allJobs = results.flat();

            for (const job of allJobs) {
                const success = await saveJob(job);
                if (success) {
                    totalNew++;
                    summary[job.source] = (summary[job.source] || 0) + 1;
                }
            }
        }
    }

    console.log('--- Discovery Summary ---');
    console.log(`Total jobs processed: ${totalNew}`);
    Object.entries(summary).forEach(([source, count]) => {
        console.log(`${source}: ${count} new jobs`);
    });
}

runDiscovery().catch(err => {
    console.error('Fatal Discovery Error:', err);
    process.exit(1);
});
