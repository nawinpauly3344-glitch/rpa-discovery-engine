import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Job {
    job_hash: string;
    title: string;
    company: string;
    location: string;
    work_mode: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown';
    url: string;
    source: string;
    date_found: string;
}

export const generateJobHash = (url: string, title: string, company: string): string => {
    return crypto
        .createHash('sha256')
        .update(`${url}${title}${company}`)
        .digest('hex');
};

export const saveJob = async (job: Job) => {
    const { data, error } = await supabase
        .from('jobs')
        .upsert(job, { onConflict: 'job_hash' });

    if (error) {
        console.error('Error saving job to Supabase:', error);
        return false;
    }
    return true;
};
