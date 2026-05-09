const store = new Map();
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export function createVerificationCode(email) {
    const code = generateCode();
    const key = email.toLowerCase();
    store.set(key, { code, email: key, expiresAt: Date.now() + 10 * 60 * 1000 });
    return code;
}
export function verifyCode(email, code) {
    const key = email.toLowerCase();
    const entry = store.get(key);
    if (!entry)
        return false;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return false;
    }
    if (entry.code !== code)
        return false;
    store.delete(key);
    return true;
}
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.expiresAt)
            store.delete(key);
    }
}, 60_000);
//# sourceMappingURL=verification.js.map