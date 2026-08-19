function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function sanitizeString(str, maxLen = 255) {
    if (!str) return str;
    return String(str).trim().substring(0, maxLen);
}

module.exports = { validateEmail, validatePassword, sanitizeString };
