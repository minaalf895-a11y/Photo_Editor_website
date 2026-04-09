const startBtn = document.getElementById('startBtn');
const editorSection = document.getElementById('editor');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');

const canvasFrame = document.querySelector('.canvas-frame');
const exportCanvas = document.createElement('canvas');
const exportCtx = exportCanvas.getContext('2d');

const emptyState = document.getElementById('emptyState');
const brightness = document.getElementById('brightness');
const saturation = document.getElementById('saturation');
const grayscale = document.getElementById('grayscale');
const brightnessValue = document.getElementById('brightnessValue');
const saturationValue = document.getElementById('saturationValue');
const grayscaleValue = document.getElementById('grayscaleValue');

const aiEnhance = document.getElementById('aiEnhance');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const featureCards = document.querySelectorAll('.feature-card');
const editorTitle = document.getElementById('editorTitle');
const editorSubtitle = document.getElementById('editorSubtitle');
const modeChip = document.getElementById('modeChip');
const themeToggle = document.getElementById('themeToggle');

const negativeBtn = document.getElementById('negativeBtn');
const sobelBtn = document.getElementById('sobelBtn');
const histBtn = document.getElementById('histBtn');
const compareBtn = document.getElementById('compareBtn');
const compareControl = document.getElementById('compareControl');
const compareSlider = document.getElementById('compareSlider');
const compareValue = document.getElementById('compareValue');

const state = {
  img: null,
  mode: 'free',
  theme: 'dark',
  effect: 'none',
  compare: false,
  comparePosition: 50
};

const modeFilters = {
  free: { brightness: 100, saturation: 100, grayscale: 0 },
  fashion: { brightness: 115, saturation: 125, grayscale: 0 },
  products: { brightness: 130, saturation: 110, grayscale: 0 },
  models: { brightness: 105, saturation: 90, grayscale: 0 },
  enhancer: { brightness: 108, saturation: 112, grayscale: 0 }
};

const effectLabels = {
  none: 'None',
  negative: 'Negative',
  sobel: 'Sobel',
  hist: 'Histogram EQ'
};

const workCanvas = document.createElement('canvas');
const workCtx = workCanvas.getContext('2d');

function updateSliderLabels() {
  brightnessValue.textContent = `${brightness.value}%`;
  saturationValue.textContent = `${saturation.value}%`;
  grayscaleValue.textContent = `${grayscale.value}%`;
}

function updateCompareLabel() {
  compareValue.textContent = `${compareSlider.value}%`;
  state.comparePosition = Number(compareSlider.value);
}

function updateEffectButtons() {
  const activeMap = {
    negative: negativeBtn,
    sobel: sobelBtn,
    hist: histBtn
  };

  [negativeBtn, sobelBtn, histBtn].forEach(btn => btn.classList.remove('active'));

  if (state.effect !== 'none' && activeMap[state.effect]) {
    activeMap[state.effect].classList.add('active');
  }
}

function updateCompareUI() {
  compareBtn.classList.toggle('active', state.compare);
  compareControl.classList.toggle('hidden', !state.compare);
  updateCompareLabel();
}

function getImageSize(source) {
  return {
    width: source.naturalWidth || source.width,
    height: source.naturalHeight || source.height
  };
}

function getContainRect(srcW, srcH, targetW, targetH) {
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const dw = Math.max(1, Math.round(srcW * scale));
  const dh = Math.max(1, Math.round(srcH * scale));
  const dx = Math.round((targetW - dw) / 2);
  const dy = Math.round((targetH - dh) / 2);
  return { dx, dy, dw, dh };
}

function getBgFill() {
  const computed = getComputedStyle(document.body).getPropertyValue('--canvas-bg').trim();
  return computed || (state.theme === 'dark' ? '#050505' : '#ffffff');
}

function clearWithBg(targetCtx, w, h) {
  targetCtx.save();
  targetCtx.fillStyle = getBgFill();
  targetCtx.fillRect(0, 0, w, h);
  targetCtx.restore();
}

function resizePreviewCanvas() {
  const rect = canvasFrame.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const nextW = Math.max(1, Math.round(rect.width * dpr));
  const nextH = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== nextW) canvas.width = nextW;
  if (canvas.height !== nextH) canvas.height = nextH;
}

function toLuminance(r, g, b) {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

function applyNegative(imageData) {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  return imageData;
}

function applySobel(imageData) {
  const { width, height, data } = imageData;
  const gray = new Uint8ClampedArray(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = toLuminance(data[i], data[i + 1], data[i + 2]);
  }

  const out = new Uint8ClampedArray(data.length);
  const get = (x, y) => gray[y * width + x];

  let maxMag = 1;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx =
        -1 * get(x - 1, y - 1) + 1 * get(x + 1, y - 1) +
        -2 * get(x - 1, y) + 2 * get(x + 1, y) +
        -1 * get(x - 1, y + 1) + 1 * get(x + 1, y + 1);

      const gy =
         1 * get(x - 1, y - 1) + 2 * get(x, y - 1) + 1 * get(x + 1, y - 1) +
        -1 * get(x - 1, y + 1) - 2 * get(x, y + 1) - 1 * get(x + 1, y + 1);

      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag > maxMag) maxMag = mag;
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx =
        -1 * get(x - 1, y - 1) + 1 * get(x + 1, y - 1) +
        -2 * get(x - 1, y) + 2 * get(x + 1, y) +
        -1 * get(x - 1, y + 1) + 1 * get(x + 1, y + 1);

      const gy =
         1 * get(x - 1, y - 1) + 2 * get(x, y - 1) + 1 * get(x + 1, y - 1) +
        -1 * get(x - 1, y + 1) - 2 * get(x, y + 1) - 1 * get(x + 1, y + 1);

      const mag = Math.min(255, Math.round((Math.sqrt(gx * gx + gy * gy) / maxMag) * 255));
      const idx = (y * width + x) * 4;

      out[idx] = mag;
      out[idx + 1] = mag;
      out[idx + 2] = mag;
      out[idx + 3] = 255;
    }
  }

  return new ImageData(out, width, height);
}

function applyHistogramEqualization(imageData) {
  const { width, height, data } = imageData;
  const size = width * height;
  const luminance = new Uint8ClampedArray(size);
  const hist = new Array(256).fill(0);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const y = toLuminance(data[i], data[i + 1], data[i + 2]);
    luminance[p] = y;
    hist[y]++;
  }

  const cdf = new Array(256).fill(0);
  cdf[0] = hist[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + hist[i];
  }

  let cdfMin = 0;
  for (let i = 0; i < 256; i++) {
    if (cdf[i] !== 0) {
      cdfMin = cdf[i];
      break;
    }
  }

  const denom = Math.max(1, size - cdfMin);
  const out = new Uint8ClampedArray(data.length);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const oldY = luminance[p];
    const newY = Math.round(((cdf[oldY] - cdfMin) / denom) * 255);
    const scale = oldY > 0 ? newY / oldY : 0;

    out[i] = Math.max(0, Math.min(255, Math.round(data[i] * scale)));
    out[i + 1] = Math.max(0, Math.min(255, Math.round(data[i + 1] * scale)));
    out[i + 2] = Math.max(0, Math.min(255, Math.round(data[i + 2] * scale)));
    out[i + 3] = 255;
  }

  return new ImageData(out, width, height);
}

function buildEditedCanvas(targetW, targetH) {
  if (!state.img) return null;

  const { width: srcW, height: srcH } = getImageSize(state.img);
  const fit = getContainRect(srcW, srcH, targetW, targetH);

  workCanvas.width = fit.dw;
  workCanvas.height = fit.dh;

  clearWithBg(workCtx, fit.dw, fit.dh);

  workCtx.save();
  workCtx.filter = `brightness(${brightness.value}%) saturate(${saturation.value}%) grayscale(${grayscale.value}%)`;
  workCtx.drawImage(state.img, 0, 0, srcW, srcH, 0, 0, fit.dw, fit.dh);
  workCtx.filter = 'none';
  workCtx.restore();

  let imageData = workCtx.getImageData(0, 0, fit.dw, fit.dh);

  if (state.effect === 'negative') {
    imageData = applyNegative(imageData);
    workCtx.putImageData(imageData, 0, 0);
  } else if (state.effect === 'sobel') {
    imageData = applySobel(imageData);
    workCtx.putImageData(imageData, 0, 0);
  } else if (state.effect === 'hist') {
    imageData = applyHistogramEqualization(imageData);
    workCtx.putImageData(imageData, 0, 0);
  }

  return { canvas: workCanvas, fit };
}

function drawOriginalToTarget(targetCtx, targetW, targetH, source) {
  const { width: srcW, height: srcH } = getImageSize(source);
  const fit = getContainRect(srcW, srcH, targetW, targetH);

  targetCtx.save();
  targetCtx.drawImage(source, 0, 0, srcW, srcH, fit.dx, fit.dy, fit.dw, fit.dh);
  targetCtx.restore();

  return fit;
}

function renderPreview() {
  if (!state.img) return;

  resizePreviewCanvas();
  const w = canvas.width;
  const h = canvas.height;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  clearWithBg(ctx, w, h);

  const edited = buildEditedCanvas(w, h);
  if (!edited) return;

  if (!state.compare) {
    ctx.drawImage(edited.canvas, edited.fit.dx, edited.fit.dy);
    return;
  }

  drawOriginalToTarget(ctx, w, h, state.img);

  const splitX = Math.round((state.comparePosition / 100) * w);

  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, 0, w - splitX, h);
  ctx.clip();
  ctx.drawImage(edited.canvas, edited.fit.dx, edited.fit.dy);
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, h);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(splitX, h / 2, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.stroke();
}

function setMode(mode) {
  state.mode = mode;
  const filters = modeFilters[mode] || modeFilters.free;

  brightness.value = filters.brightness;
  saturation.value = filters.saturation;
  grayscale.value = filters.grayscale;

  updateSliderLabels();
  renderPreview();

  const title = mode.charAt(0).toUpperCase() + mode.slice(1);
  modeChip.textContent = `${title} Mode`;
  editorTitle.textContent = `Editing in ${title}`;
  editorSubtitle.textContent = `Adjust sliders or apply AI enhance for ${mode} photos.`;
}

function updateThemeButton() {
  themeToggle.textContent = state.theme === 'dark' ? '☀️ Light' : '🌙 Dark';
}

function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle('dark', theme === 'dark');
  document.body.classList.toggle('light', theme === 'light');
  localStorage.setItem('photoEditorTheme', theme);
  updateThemeButton();
  renderPreview();
}

function initTheme() {
  const savedTheme = localStorage.getItem('photoEditorTheme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    setTheme(savedTheme);
  } else {
    setTheme('dark');
  }
}

function setEffect(effect) {
  state.effect = effect;
  updateEffectButtons();
  renderPreview();
  status.textContent = effect === 'none' ? 'Effect cleared.' : `${effectLabels[effect]} applied.`;
}

startBtn.addEventListener('click', () => {
  editorSection.scrollIntoView({ behavior: 'smooth' });
});

featureCards.forEach(card => {
  card.addEventListener('click', () => {
    setMode(card.dataset.mode);
    editorSection.scrollIntoView({ behavior: 'smooth' });
  });
});

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    state.img = img;
    emptyState.classList.add('hidden');
    status.textContent = 'Image loaded.';
    renderPreview();
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
});

[brightness, saturation, grayscale].forEach(slider => {
  slider.addEventListener('input', () => {
    updateSliderLabels();
    renderPreview();
  });
});

aiEnhance.addEventListener('click', () => {
  if (!state.img) return;
  brightness.value = 120;
  saturation.value = 120;
  grayscale.value = 0;
  updateSliderLabels();
  renderPreview();
  status.textContent = 'AI Enhanced!';
});

resetBtn.addEventListener('click', () => {
  if (!state.img) return;
  setMode(state.mode);
  state.effect = 'none';
  state.compare = false;
  compareSlider.value = 50;
  updateEffectButtons();
  updateCompareUI();
  renderPreview();
  status.textContent = 'Reset done!';
});

downloadBtn.addEventListener('click', () => {
  if (!state.img) return;

  const { width: srcW, height: srcH } = getImageSize(state.img);
  exportCanvas.width = srcW;
  exportCanvas.height = srcH;

  clearWithBg(exportCtx, srcW, srcH);

  const edited = buildEditedCanvas(srcW, srcH);
  if (!edited) return;

  exportCtx.drawImage(edited.canvas, edited.fit.dx, edited.fit.dy);

  const link = document.createElement('a');
  link.download = 'edited-photo.png';
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
});

negativeBtn.addEventListener('click', () => {
  if (!state.img) return;
  state.effect = state.effect === 'negative' ? 'none' : 'negative';
  updateEffectButtons();
  renderPreview();
  status.textContent = state.effect === 'none' ? 'Effect cleared.' : 'Negative applied.';
});

sobelBtn.addEventListener('click', () => {
  if (!state.img) return;
  state.effect = state.effect === 'sobel' ? 'none' : 'sobel';
  updateEffectButtons();
  renderPreview();
  status.textContent = state.effect === 'none' ? 'Effect cleared.' : 'Sobel applied.';
});

histBtn.addEventListener('click', () => {
  if (!state.img) return;
  state.effect = state.effect === 'hist' ? 'none' : 'hist';
  updateEffectButtons();
  renderPreview();
  status.textContent = state.effect === 'none' ? 'Effect cleared.' : 'Histogram equalization applied.';
});

compareBtn.addEventListener('click', () => {
  if (!state.img) return;
  state.compare = !state.compare;
  updateCompareUI();
  renderPreview();
  status.textContent = state.compare ? 'Compare mode on.' : 'Compare mode off.';
});

compareSlider.addEventListener('input', () => {
  updateCompareLabel();
  if (state.compare) {
    renderPreview();
  }
});

themeToggle.addEventListener('click', () => {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
});

window.addEventListener('resize', () => {
  if (state.img) {
    renderPreview();
  }
});

updateSliderLabels();
updateEffectButtons();
updateCompareUI();
initTheme();
