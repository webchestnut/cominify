const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const dropZone = document.getElementById("dropZone");
const statusCard = document.getElementById("statusCard");
const resultCard = document.getElementById("resultCard");
const fileName = document.getElementById("fileName");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const resultTitle = document.getElementById("resultTitle");
const resultDetails = document.getElementById("resultDetails");
const downloadBtn = document.getElementById("downloadBtn");

let resultBlob = null;
let resultFileName = "";

chooseBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) processFile(fileInput.files[0]);
});

["dragenter", "dragover"].forEach(type => {
  dropZone.addEventListener(type, e => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(type => {
  dropZone.addEventListener(type, e => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

downloadBtn.addEventListener("click", () => {
  if (!resultBlob) return;
  const url = URL.createObjectURL(resultBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = resultFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function setProgress(value, text) {
  progressBar.style.width = `${Math.max(0, Math.min(100, value))}%`;
  statusText.textContent = text;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024;
    unit = units[i];
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

async function processFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (!["pdf", "docx", "pages"].includes(ext)) {
    showResult("Unsupported file", "Please choose PDF, DOCX or Pages.", false);
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showResult("File is too large", "The browser version currently accepts files up to 50 MB.", false);
    return;
  }

  statusCard.classList.remove("hidden");
  resultCard.classList.add("hidden");
  fileName.textContent = file.name;
  setProgress(8, "Reading file…");

  try {
    let blob;

    if (ext === "pdf") {
      blob = await compressPdf(file);
    } else {
      blob = await compressZipDocument(file);
    }

    setProgress(100, "Finished");

    if (blob.size >= file.size) {
      resultBlob = file;
      resultFileName = file.name;
      showResult(
        "No smaller copy found",
        `${formatBytes(file.size)} — Cominify kept the original because the processed version was not smaller.`,
        true
      );
      resultTitle.textContent = "Original file is ready";
      return;
    }

    resultBlob = blob;
    resultFileName = file.name.replace(/\.(pdf|docx|pages)$/i, "") + "-cominify." + ext;

    const saved = file.size - blob.size;
    const percent = Math.round((saved / file.size) * 100);

    showResult(
      "Your file is smaller",
      `${formatBytes(file.size)} → ${formatBytes(blob.size)} · saved ${formatBytes(saved)} (${percent}%)`,
      true
    );
  } catch (error) {
    console.error(error);
    setProgress(0, "Error");
    showResult("Could not process this file", "Try another file or format.", false);
  }
}

async function compressPdf(file) {
  setProgress(25, "Optimizing PDF…");
  const bytes = await file.arrayBuffer();
  const pdf = await PDFLib.PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false
  });

  setProgress(60, "Cleaning metadata…");
  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);
  pdf.setCreator("");
  pdf.setProducer("");

  setProgress(80, "Building smaller copy…");
  const out = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false
  });

  return new Blob([out], { type: "application/pdf" });
}

async function compressZipDocument(file) {
  setProgress(25, "Opening document package…");
  const input = await JSZip.loadAsync(await file.arrayBuffer());
  const output = new JSZip();

  const names = Object.keys(input.files).filter(name =>
    !name.startsWith("__MACOSX/") &&
    !name.endsWith(".DS_Store") &&
    !name.endsWith("/")
  );

  let processed = 0;

  for (const name of names) {
    const entry = input.files[name];
    const data = await entry.async("uint8array");

    // Rebuild the package with clean DEFLATE compression.
    output.file(name, data, {
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    processed++;
    setProgress(25 + Math.round((processed / names.length) * 55), "Rebuilding document…");
  }

  setProgress(90, "Finalizing…");
  const out = await output.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });

  const mime =
    file.name.toLowerCase().endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/octet-stream";

  return new Blob([out], { type: mime });
}

function showResult(title, details, canDownload) {
  resultCard.classList.remove("hidden");
  resultTitle.textContent = title;
  resultDetails.textContent = details;
  downloadBtn.disabled = !canDownload;
  downloadBtn.style.opacity = canDownload ? "1" : ".45";
  downloadBtn.style.pointerEvents = canDownload ? "auto" : "none";
}
