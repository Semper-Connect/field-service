// Files picked on the phone, and their sizes.

// Phone photos are ~4000px: shrink them before storing.
export function compressImage(file, maxSide = 1600, quality = 0.72) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.naturalWidth * scale);
            canvas.height = Math.round(img.naturalHeight * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("invalid image"));
        };
        img.src = url;
    });
}

export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// e.g. "12 Ko", "1,2 Mo"
export function sizeLabel(bytes) {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

// Size of the file in a base64 data URL.
export const dataUrlBytes = (dataUrl) => ((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4;
