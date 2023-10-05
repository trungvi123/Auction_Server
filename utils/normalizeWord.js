function normalizeWord(keyword) {
    if (!keyword) return ''
    return keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export default normalizeWord;