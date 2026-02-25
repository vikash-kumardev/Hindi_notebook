const canvas = document.getElementById("writingCanvas");
const ctx = canvas.getContext("2d");
const typingArea = document.getElementById("typingArea");
const pageCounter = document.getElementById("pageCounter");

const STORAGE_KEY = "hindiNotebookData";

let pages = [];
let currentPage = 0;
let currentColor = "black";
let drawing = false;

/* ===============================
   CANVAS RESIZE
================================= */
function resizeCanvas() {
    const savedDrawing = canvas.toDataURL();
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    if (savedDrawing) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = savedDrawing;
    }
}
window.addEventListener("resize", resizeCanvas);

/* ===============================
   STORAGE
================================= */
function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    pages = saved ? JSON.parse(saved) : [];

    if (!pages.length) {
        pages = [{ text: "", drawing: null }];
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

/* ===============================
   PAGE CONTROL
================================= */
function updateCounter() {
    pageCounter.innerText =
        "Page " + (currentPage + 1) + " of " + pages.length;
}

function saveCurrentPage() {
    pages[currentPage] = {
        text: typingArea.innerHTML,
        drawing: canvas.toDataURL()
    };
    saveToStorage();
}

function loadPage(index) {
    const page = pages[index];

    typingArea.innerHTML = page.text || "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (page.drawing) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = page.drawing;
    }

    updateCounter();
}

function newPage() {
    saveCurrentPage();
    pages.push({ text: "", drawing: null });
    currentPage = pages.length - 1;
    saveToStorage();
    loadPage(currentPage);
}

function nextPage() {
    if (currentPage < pages.length - 1) {
        saveCurrentPage();
        currentPage++;
        loadPage(currentPage);
    }
}

function prevPage() {
    if (currentPage > 0) {
        saveCurrentPage();
        currentPage--;
        loadPage(currentPage);
    }
}

/* ===============================
   MODE SWITCH
================================= */
function enableTyping() {
    canvas.style.display = "none";
    typingArea.focus();
}

function enableDrawing() {
    canvas.style.display = "block";
}

/* ===============================
   COLOR
================================= */
function setColor(color) {
    currentColor = color;

    document.execCommand("styleWithCSS", false, true);
    document.execCommand("foreColor", false, color);

    typingArea.focus();
}

/* ===============================
   DRAWING
================================= */
function startDraw(e) {
    drawing = true;
    draw(e);
}

function endDraw() {
    drawing = false;
    ctx.beginPath();
    saveCurrentPage();
}

function draw(e) {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = currentColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

/* ===============================
   CLEAR
================================= */
function clearBoard() {
    typingArea.innerHTML = "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCurrentPage();
}

/* ===============================
   DOWNLOAD PAGE
================================= */
function downloadPage() {
    saveCurrentPage();
    const pageElement = document.querySelector(".page");

    html2canvas(pageElement).then(canvasImage => {
        const link = document.createElement("a");
        link.download = "Notebook_Page_" + (currentPage + 1) + ".png";
        link.href = canvasImage.toDataURL("image/png");
        link.click();
    });
}

/* ===============================
   DOWNLOAD FULL PDF
================================= */
async function downloadFullPDF() {
    saveCurrentPage();

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const originalPage = currentPage;

    for (let i = 0; i < pages.length; i++) {
        loadPage(i);
        await new Promise(r => setTimeout(r, 300));

        const pageElement = document.querySelector(".page");
        const canvasImage = await html2canvas(pageElement);

        const imgData = canvasImage.toDataURL("image/png");
        const imgWidth = 210;
        const imgHeight = (canvasImage.height * imgWidth) / canvasImage.width;

        if (i !== 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }

    pdf.save("Hindi_Notebook.pdf");
    loadPage(originalPage);
}

/* ===============================
   SAFE SHORTCUTS (Mac Friendly)
================================= */
document.addEventListener("keydown", function (e) {
    const key = e.key.toLowerCase();

    // ALT based shortcuts (safe)
    if (e.altKey) {
        e.preventDefault();

        if (key === "r") setColor("red");
        if (key === "b") setColor("black");
        if (key === "u") setColor("blue");
        if (key === "g") setColor("green");
        if (key === "n") newPage();
        if (key === "p") downloadFullPDF();
    }

    // Mode switch (no modifier)
    if (!e.altKey && !e.metaKey && !e.ctrlKey) {
        if (key === "t") enableTyping();
        if (key === "d") enableDrawing();
    }
});

/* ===============================
   EVENTS
================================= */
typingArea.addEventListener("input", saveCurrentPage);

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", draw);

/* ===============================
   INIT
================================= */
window.addEventListener("load", () => {
    loadFromStorage();
    resizeCanvas();
    loadPage(currentPage);
    typingArea.focus();
});