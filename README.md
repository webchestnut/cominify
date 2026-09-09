# Cominify — maximum compression edition

This version is designed to reduce file size more aggressively while avoiding unnecessary content removal.

## PDF
Cominify tests two candidates: safe structural optimization and an optional visual rebuild. The visual rebuild renders pages around 150 DPI and JPEG-compresses them; it is selected only if it produces the smallest result. Because pages can become images, selectable text, forms, bookmarks and some PDF-specific features may not survive that candidate.

## DOCX / Pages
The package is rebuilt with DEFLATE level 9. JPEG images inside `word/media/` can be recompressed and oversized images can be resized. PNGs are kept unless a clearly smaller safe result is available; some opaque PNG photos can be converted to JPG and relationship references are updated.

Already optimized files may not shrink. Cominify never replaces a file with a larger processed version.

All processing runs locally in the browser; files are not uploaded to a Cominify server.

## Files
- index.html
- style.css
- script.js
- logo.png
- README.md
