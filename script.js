const canvas = document.getElementById("writingCanvas");
const ctx = canvas.getContext("2d");
const typingArea = document.getElementById("typingArea");
const pageCounter = document.getElementById("pageCounter");

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let drawing = false;
let currentColor = "black";

/* Load from LocalStorage */
let pages = JSON.parse(localStorage.getItem("notebookPages")) || [{ text:"", drawing:null }];
let currentPage = 0;

/* Page System */
function updateCounter(){
    pageCounter.innerText = "Page " + (currentPage+1) + " of " + pages.length;
}

function saveCurrentPage(){
    pages[currentPage] = {
        text: typingArea.innerHTML,
        drawing: canvas.toDataURL()
    };
    localStorage.setItem("notebookPages", JSON.stringify(pages));
}

function loadPage(index){
    const page = pages[index];
    typingArea.innerHTML = page.text;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(page.drawing){
        let img = new Image();
        img.onload = () => ctx.drawImage(img,0,0);
        img.src = page.drawing;
    }

    updateCounter();
}

function newPage(){
    saveCurrentPage();
    pages.push({ text:"", drawing:null });
    currentPage = pages.length-1;
    typingArea.innerHTML = "";
    ctx.clearRect(0,0,canvas.width,canvas.height);
    updateCounter();
}

function nextPage(){
    if(currentPage < pages.length-1){
        saveCurrentPage();
        currentPage++;
        loadPage(currentPage);
    }
}

function prevPage(){
    if(currentPage > 0){
        saveCurrentPage();
        currentPage--;
        loadPage(currentPage);
    }
}

/* Mode */
function enableTyping(){
    canvas.style.display="none";
    typingArea.focus();
}

function enableDrawing(){
    canvas.style.display="block";
}

/* Color */
function setColor(color){
    currentColor = color;
    typingArea.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("foreColor", false, color);
}

/* Drawing */
function startDraw(e){
    drawing = true;
    draw(e);
}

function endDraw(){
    drawing = false;
    ctx.beginPath();
}

function draw(e){
    if(!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = currentColor;

    ctx.lineTo(x,y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x,y);
}

function clearBoard(){
    typingArea.innerHTML="";
    ctx.clearRect(0,0,canvas.width,canvas.height);
    saveCurrentPage();
}

/* Download Full Page Screenshot */
function downloadPage(){
    saveCurrentPage();

    const pageElement = document.querySelector(".page");

    html2canvas(pageElement).then(canvasImage => {
        const link = document.createElement("a");
        link.download = "Notebook_Page_" + (currentPage+1) + ".png";
        link.href = canvasImage.toDataURL("image/png");
        link.click();
    });
}

/* Events */
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchmove", draw);

/* Init */
loadPage(0);
updateCounter();