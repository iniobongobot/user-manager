const sanitizeString = (str) => {
    if (!str) return str;
    if (typeof str !== 'string') return '';

    return str.replace(/[^a-z0-9\s]/gi, '').trim();
};

export { sanitizeString };