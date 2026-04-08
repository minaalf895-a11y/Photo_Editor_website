const startBtn = document.getElementById('startBtn');
const editorSection = document.getElementById('editor');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');

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

const state = {
  img: null,
  mode: 'free',
  theme: 'dark'
};

const modeFilters = {
  free: { brightness: 100, saturation: 100, grayscale: 0 },
  fashion: { brightness: 115, saturation: 125, grayscale: 0 },
  products: { brightness: 130, saturation: 110, grayscale: 0 },
  models: { brightness: 105, saturation: 90, grayscale: 0 },
  enhancer: { brightness: 108, saturation: 112, grayscale: 0 }
};

function updateSliderLabels() {
  brightnessValue.textContent = `${brightness.value}%`;
  saturationValue.textContent = `${saturation.value}%`;
  grayscaleValue.textContent = `${grayscale.value}%`;
}

function applyFiltersAndRender() {
  if (!state.img) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = `brightness(${brightness.value}%) saturate(${saturation.value}%) grayscale(${grayscale.value}%)`;
  ctx.drawImage(state.img, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';
}

function setMode(mode) {
  state.mode = mode;
  const filters = modeFilters[mode] || modeFilters.free;

  brightness.value = filters.brightness;
  saturation.value = filters.saturation;
  grayscale.value = filters.grayscale;

  updateSliderLabels();
  applyFiltersAndRender();

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
}

function initTheme() {
  const savedTheme = localStorage.getItem('photoEditorTheme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    setTheme(savedTheme);
  } else {
    setTheme('dark');
  }
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
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    state.img = img;
    emptyState.classList.add('hidden');
    applyFiltersAndRender();
    status.textContent = 'Image loaded.';
  };
  img.src = URL.createObjectURL(file);
});

[brightness, saturation, grayscale].forEach(slider => {
  slider.addEventListener('input', () => {
    updateSliderLabels();
    applyFiltersAndRender();
  });
});

aiEnhance.addEventListener('click', () => {
  if (!state.img) return;
  brightness.value = 120;
  saturation.value = 120;
  grayscale.value = 0;
  updateSliderLabels();
  applyFiltersAndRender();
  status.textContent = 'AI Enhanced!';
});

resetBtn.addEventListener('click', () => {
  if (!state.img) return;
  setMode(state.mode);
  status.textContent = 'Reset done!';
});

downloadBtn.addEventListener('click', () => {
  if (!state.img) return;
  const link = document.createElement('a');
  link.download = 'edited-photo.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

themeToggle.addEventListener('click', () => {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
});

updateSliderLabels();
initTheme();