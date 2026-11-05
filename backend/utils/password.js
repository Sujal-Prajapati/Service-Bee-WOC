const crypto = require('crypto');

const hashWithSalt = (password, salt) =>
    crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

/** Returns { salt, hash } ready to be stored. */
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    return { salt, hash: hashWithSalt(password, salt) };
};

const verifyPassword = (password, salt, hash) => {
    const candidate = Buffer.from(hashWithSalt(password, salt), 'hex');
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
};

module.exports = { hashPassword, verifyPassword };
