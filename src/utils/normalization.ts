export const normalizeWorkMode = (description: string): 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown' => {
    const desc = description.toLowerCase();
    if (desc.includes('remote') || desc.includes('home office') || desc.includes('telecommute')) {
        return 'Remote';
    }
    if (desc.includes('hybrid')) {
        return 'Hybrid';
    }
    if (desc.includes('onsite') || desc.includes('on-site') || desc.includes('office-based')) {
        return 'Onsite';
    }
    return 'Unknown';
};

export const normalizeJobType = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes('full-time') || t.includes('fulltime') || t.includes('festanstellung')) {
        return 'Full-time';
    }
    if (t.includes('contract') || t.includes('freelance') || t.includes('freier mitarbeiter')) {
        return 'Contract';
    }
    return 'Other';
};

export const isRecentJob = (postedAt: string | undefined): boolean => {
    if (!postedAt) return true; // Default to true if not provided (assume scraper filtered it)
    try {
        const postedDate = new Date(postedAt);
        const now = new Date();
        const diffDays = (now.getTime() - postedDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
    } catch (e) {
        return true;
    }
};
