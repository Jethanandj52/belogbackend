// src/utils/slugify.js

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // spaces => -
    .replace(/[^\w\-]+/g, '')     // remove non-word chars
    .replace(/\-\-+/g, '-');      // multiple - => single -
}

module.exports = slugify; // ✅ correct export
