const utils = {
    /**
     * Ritorna la data/ora corrente in formato ISO 8601
     */
    nowISO() {
        return new Date().toISOString();
    },

    /**
     * Valida codice colore esadecimale a 6 cifre (case–insensitive)
     * @param {string} color
     * @returns {boolean}
     */
    isValidHexColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
};

// Permetti importazione CommonJS-like se necessario
if (typeof module !== 'undefined') {
    module.exports = utils;
}