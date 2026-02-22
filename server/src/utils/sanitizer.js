const sanitizeString = (str) => {
    if (!str) return str;
    if (typeof str !== 'string') return '';

    return str.replace(/[^a-zA-Z\s'-]/gi, '').trim();
};

export { sanitizeString };