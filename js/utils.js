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
    },

    /**
     * Converte testo con URL in HTML con link cliccabili
     * @param {string} text - Il testo da processare
     * @returns {string} - HTML con link cliccabili
     */
    autoLinkUrls(text) {
        if (!text) return '';

        // Regex per identificare URL (http, https, ftp, www)
        const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+|ftp:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;

        return text.replace(urlRegex, (url) => {
            let href = url;
            // Aggiungi http:// se inizia con www.
            if (url.startsWith('www.')) {
                href = 'http://' + url;
            }

            // Tronca URL molto lunghi per la visualizzazione
            const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;

            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all">${displayUrl}</a>`;
        });
    },

    /**
     * Estrae immagini base64 da testo e restituisce oggetto con testo pulito e immagini
     * @param {string} text - Il testo che può contenere immagini base64
     * @returns {object} - {text: string, images: Array}
     */
    extractBase64Images(text) {
        if (!text) return { text: '', images: [] };

        const images = [];
        const base64Regex = /data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+/gi;

        // Estrai tutte le immagini base64
        let match;
        while ((match = base64Regex.exec(text)) !== null) {
            images.push({
                id: this.generateId(),
                data: match[0],
                type: match[1]
            });
        }

        // Rimuovi le immagini base64 dal testo per evitare di mostrare la stringa lunga
        const cleanText = text.replace(base64Regex, '[IMAGE]');

        return { text: cleanText, images };
    },

    /**
     * Valida se una stringa è un'immagine base64 valida
     * @param {string} dataUrl - La stringa data URL da validare
     * @returns {boolean}
     */
    isValidBase64Image(dataUrl) {
        if (!dataUrl || typeof dataUrl !== 'string') return false;

        const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/i;
        return base64Regex.test(dataUrl);
    },

    /**
     * Ridimensiona un'immagine base64 se supera le dimensioni massime
     * @param {string} dataUrl - L'immagine base64
     * @param {number} maxWidth - Larghezza massima (default: 800)
     * @param {number} maxHeight - Altezza massima (default: 600)
     * @param {number} quality - Qualità JPEG (default: 0.8)
     * @returns {Promise<string>} - Promise che risolve con l'immagine ridimensionata
     */
    resizeBase64Image(dataUrl, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calcola le nuove dimensioni mantenendo le proporzioni
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                // Disegna l'immagine ridimensionata
                ctx.drawImage(img, 0, 0, width, height);

                // Converti in base64 con qualità specificata
                const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(resizedDataUrl);
            };
            img.src = dataUrl;
        });
    },

    /**
     * Converte un file immagine in base64
     * @param {File} file - Il file immagine
     * @returns {Promise<string>} - Promise che risolve con l'immagine base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('File must be an image'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },

    /**
     * Genera un ID univoco
     * @returns {string}
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Escape HTML per prevenire XSS
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Permetti importazione CommonJS-like se necessario
if (typeof module !== 'undefined') {
    module.exports = utils;
}