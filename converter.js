const files = "abcdefgh";
let array_images = [];

function p2c(x, y) { return files[x] + (8 - y); }

function generateMove(move) {
  switch(move % 4) {
    case 0: return `${Math.floor(move/2)+1}. Kb1`;
    case 1: return "Kb8";
    case 2: return `${Math.floor(move/2)+1}. Ka1`;
    case 3: return "Ka8";
  }
}

function hex(img, x, y) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(x, y, 1, 1).data;
  return `#${data[0].toString(16).padStart(2,'0').toUpperCase()}${data[1].toString(16).padStart(2,'0').toUpperCase()}${data[2].toString(16).padStart(2,'0').toUpperCase()}`;
}

async function gifToArray(file) {
  const buffer = await file.arrayBuffer();
  const gifReader = new window.GifReader(new Uint8Array(buffer));
  const w = gifReader.width;
  const h = gifReader.height;
  const numFrames = gifReader.numFrames();
  array_images = [];

  const progressBar = document.getElementById("progressBar");

  for (let f = 0; f < numFrames; f++) {
    const pixels = new Uint8ClampedArray(w * h * 4);
    gifReader.decodeAndBlitFrameRGBA(f, pixels);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);

    array_images.push(canvas); // сохраняем Canvas вместо Image

    progressBar.style.width = Math.round((f + 1) / numFrames * 100) + '%';
  }
}

document.getElementById("convertBtn").onclick = async function() {
  const file = document.getElementById("gifInput").files[0];
  if (!file) { alert("Выберите GIF!"); return; }

  const output = document.getElementById("output");
  output.textContent = "";
  output.classList.remove('show');

  const downloadBtn = document.getElementById("download");
  downloadBtn.classList.remove('show');

  document.getElementById("progressBar").style.width = '0%';

  await gifToArray(file);

  if (array_images[0].width !== 8 || array_images[0].height !== 8) {
    alert(`GIF имеет размер ${array_images[0].width}x${array_images[0].height}, нужен 8x8`);
    return;
  }

  let highlights = [];
  for (let f = 0; f < array_images.length; f++) {
    let frame_highlights = "{[%c_highlight ";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const color = hex(array_images[f], x, y); // Canvas напрямую
        const square = p2c(x, y);
        frame_highlights += `${square};color;${color};opacity;1;square;${square};persistent;true,`;
      }
    }
    frame_highlights += "]}";
    highlights.push(frame_highlights);
  }

  let pgn = '[SetUp "1"]\n[FEN "k7/8/8/8/8/8/8/K7 w - - 0 1"]\n';
  for (let m = 0; m < highlights.length; m++) {
    pgn += `${generateMove(m)} ${highlights[m]} `;
  }

  document.getElementById("output").textContent = pgn;

  const blob = new Blob([pgn], {type: "text/plain"});
  downloadBtn.href = URL.createObjectURL(blob);
  downloadBtn.download = file.name.replace(/\.gif$/i, ".pgn");
  downloadBtn.textContent = "Скачать PGN";
  downloadBtn.classList.add('show');
};
