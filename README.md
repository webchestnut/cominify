# Cominify

Minimalist browser-based file size reduction website.

## Files

- `index.html` — page structure
- `style.css` — black / graphite / gray design
- `script.js` — file processing logic
- `logo.png` — Cominify logo
- `README.md` — this file

## Supported formats

- PDF
- DOCX
- Pages

## Important

The current browser version does not guarantee a smaller result for every file. It only offers the processed copy when it is actually smaller; otherwise it keeps the original.

PDF processing uses `pdf-lib`, and DOCX/Pages packages use `JSZip` from jsDelivr CDN.

## GitHub Pages

Upload these files to a repository and enable GitHub Pages. No backend is required for the current version.
