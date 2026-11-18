// For searches: "Chaudière" is found by typing "chaudiere"; empty parts are skipped.
export const searchText = (...parts) =>
    parts
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
