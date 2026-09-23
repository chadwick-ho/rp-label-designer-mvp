const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const templates = [
  { id: 'clinical', name: 'Clinical Blue', note: 'Clean research layout', accent: '#087a9c', dark: '#0d2c47', style: 'clinical' },
  { id: 'precision', name: 'Precision Black', note: 'High contrast system', accent: '#f2bd27', dark: '#121a25', style: 'precision' },
  { id: 'molecule', name: 'Molecule Teal', note: 'Technical pattern', accent: '#1aa65b', dark: '#082f36', style: 'molecule' },
  { id: 'signal', name: 'Signal Red', note: 'Fast SKU scanning', accent: '#d7463f', dark: '#29171b', style: 'signal' },
  { id: 'spectrum', name: 'Spectrum', note: 'Premium color finish', accent: '#7357c8', dark: '#19244a', style: 'spectrum' },
  { id: 'minimal', name: 'Minimal White', note: 'Brand-first label', accent: '#1176b8', dark: '#20384c', style: 'minimal' }
];

const state = {
  size: '3ml',
  productName: 'PEPTIDE 10',
  dose: '10',
  unit: 'mg',
  batch: 'BATCH RP0926',
  expiry: 'EXP 09/2028',
  qrValue: 'https://rplabels.com',
  template: 'clinical',
  material: 'white',
  qty: 100,
  logo: '',
  logoName: '',
  logoScale: 80,
  logoX: 0,
  logoY: 0
};

const materialNames = { white: 'White BOPP', silver: 'Silver Holographic', prism: 'Prism Holographic' };
const sizeNames = { '3ml': '3 mL · 44 x 19 mm', '10ml': '10 mL · 70 x 25 mm' };
let qrData = '';
let saveTimer;
let toastTimer;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function currentTemplate() {
  return templates.find(item => item.id === state.template) || templates[0];
}

function makeQrData(value) {
  const scratch = document.createElement('div');
  scratch.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(scratch);
  try {
    if (window.QRCode) {
      new QRCode(scratch, { text: value || 'https://rplabels.com', width: 128, height: 128, correctLevel: QRCode.CorrectLevel.M });
      const canvas = scratch.querySelector('canvas');
      const image = scratch.querySelector('img');
      qrData = canvas ? canvas.toDataURL('image/png') : (image?.src || '');
    }
  } catch (error) {
    qrData = '';
  }
  scratch.remove();
}

function patternMarkup(style, accent) {
  if (style === 'molecule') {
    return `<g opacity=".22" stroke="${accent}" stroke-width=".35" fill="none"><path d="M2 3L8 7l6-4 7 4 6-3 7 4 8-5M4 15l7-5 7 5 7-5 7 4 9-6"/><circle cx="8" cy="7" r="1.2"/><circle cx="21" cy="7" r="1.2"/><circle cx="34" cy="8" r="1.2"/></g>`;
  }
  if (style === 'signal') {
    return `<g opacity=".24" fill="${accent}"><path d="M0 2h13L8 7H0zM44 17H29l6-5h9z"/><circle cx="39" cy="5" r="2.2"/></g>`;
  }
  if (style === 'spectrum') {
    return `<g opacity=".22" fill="none" stroke="${accent}" stroke-width="1.2"><path d="M-3 15C8 5 12 4 23 14S39 22 48 8"/><path d="M-3 11C7 2 14 4 22 11s17 8 26-2"/></g>`;
  }
  if (style === 'precision') {
    return `<g opacity=".22" stroke="${accent}" stroke-width=".35"><path d="M2 4h8M2 6h5M35 13h7M38 15h4"/><circle cx="40" cy="5" r="3" fill="none"/><path d="M40 1v8M36 5h8"/></g>`;
  }
  if (style === 'minimal') {
    return `<path d="M0 16 C13 9 27 22 44 12 V19 H0Z" fill="${accent}" opacity=".18"/>`;
  }
  return `<g opacity=".18" fill="${accent}"><circle cx="4" cy="4" r="1"/><circle cx="40" cy="15" r="1"/><path d="M0 17h17l4-4h23v6H0z"/></g>`;
}

function fallbackQr() {
  let cells = '';
  const seed = [...state.qrValue].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
      if (finder || ((x * 7 + y * 11 + seed) % 3 === 0)) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  return `<svg viewBox="0 0 9 9"><rect width="9" height="9" fill="#fff"/><g fill="#07121d">${cells}</g></svg>`;
}

function labelSvg({ compact = false } = {}) {
  const t = currentTemplate();
  const ratio = state.size === '10ml' ? 'wide' : 'standard';
  const viewWidth = ratio === 'wide' ? 70 : 44.45;
  const viewHeight = ratio === 'wide' ? 25 : 19.05;
  const qrSize = ratio === 'wide' ? 10.2 : 7.5;
  const qrX = viewWidth - qrSize - 2;
  const qrY = (viewHeight - qrSize) / 2;
  const contentRight = qrX - 1.4;
  const titleSize = ratio === 'wide' ? 6.2 : 4.25;
  const doseSize = ratio === 'wide' ? 4.3 : 3.1;
  const metaSize = ratio === 'wide' ? 2.05 : 1.55;
  const logoWidth = (ratio === 'wide' ? 13 : 9) * (state.logoScale / 100);
  const logoX = 2 + (state.logoX / 100) * (viewWidth * .25);
  const logoY = 1.4 + (state.logoY / 100) * (viewHeight * .25);
  const qr = qrData
    ? `<image href="${qrData}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>`
    : `<g transform="translate(${qrX} ${qrY}) scale(${qrSize / 9})">${fallbackQr().replace('<svg viewBox="0 0 9 9">','').replace('</svg>','')}</g>`;
  const logo = state.logo ? `<image href="${state.logo}" x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoWidth * .42}" preserveAspectRatio="xMinYMid meet"/>` : `<g transform="translate(2 1.6)"><rect width="6.2" height="3.5" rx=".7" fill="${t.accent}"/><text x="3.1" y="2.45" text-anchor="middle" fill="#fff" font-size="1.65" font-weight="900">RP</text></g>`;
  const materialClass = `material-${state.material}`;
  const batch = esc(state.batch || 'CUSTOM LABEL');
  const expiry = esc(state.expiry || 'FREE PROOF');
  const product = esc((state.productName || 'YOUR PRODUCT').toUpperCase());
  const dose = esc(`${state.dose || '00'} ${state.unit}`.toUpperCase());

  return `<svg class="${materialClass}" viewBox="0 0 ${viewWidth} ${viewHeight}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${product} label preview">
    <defs>
      <linearGradient id="materialSilver" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef8ff"/><stop offset=".23" stop-color="#fff3c5"/><stop offset=".5" stop-color="#d8f6e5"/><stop offset=".76" stop-color="#e2dcff"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
      <linearGradient id="materialPrism" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b8e7ff"/><stop offset=".2" stop-color="#ffd2e8"/><stop offset=".4" stop-color="#fff1a8"/><stop offset=".62" stop-color="#ccf5d7"/><stop offset=".82" stop-color="#d0dcff"/><stop offset="1" stop-color="#f1caff"/></linearGradient>
      <linearGradient id="labelSheen" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="labelClip"><rect width="${viewWidth}" height="${viewHeight}" rx="2.1"/></clipPath>
    </defs>
    <g clip-path="url(#labelClip)">
      <rect class="label-base" width="${viewWidth}" height="${viewHeight}" fill="#fff"/>
      <rect width="${viewWidth}" height="${viewHeight}" fill="${t.dark}" opacity="${t.style === 'minimal' ? '.05' : '.96'}"/>
      ${patternMarkup(t.style, t.accent)}
      <rect x="0" y="${viewHeight - 3.1}" width="${viewWidth}" height="3.1" fill="${t.accent}"/>
      ${logo}
      <text x="2" y="${viewHeight * .47}" fill="${t.style === 'minimal' ? t.dark : '#fff'}" font-size="${titleSize}" font-family="Arial, sans-serif" font-weight="900" data-fit="${contentRight - 2}">${product}</text>
      <text x="2" y="${viewHeight * .67}" fill="${t.accent}" font-size="${doseSize}" font-family="Arial, sans-serif" font-weight="900">${dose}</text>
      <text x="2" y="${viewHeight - 1.05}" fill="${t.style === 'minimal' ? '#fff' : '#fff'}" font-size="${metaSize}" font-family="Arial, sans-serif" font-weight="700">${batch}</text>
      <text x="${contentRight}" y="${viewHeight - 1.05}" text-anchor="end" fill="#fff" font-size="${metaSize}" font-family="Arial, sans-serif" font-weight="700">${expiry}</text>
      <rect class="material-sheen" x="-28" y="-5" width="12" height="${viewHeight + 10}" fill="url(#labelSheen)" opacity="0"/>
      <rect x="${qrX - .45}" y="${qrY - .45}" width="${qrSize + .9}" height="${qrSize + .9}" rx=".7" fill="#fff" stroke="${t.accent}" stroke-width=".35"/>
      ${qr}
      <text x="${qrX + qrSize / 2}" y="${qrY + qrSize + 1.35}" text-anchor="middle" fill="${t.style === 'minimal' ? t.dark : '#fff'}" font-size="${ratio === 'wide' ? 1.2 : .9}" font-family="Arial, sans-serif" font-weight="700">SCAN</text>
    </g>
    <rect x=".25" y=".25" width="${viewWidth - .5}" height="${viewHeight - .5}" rx="1.9" fill="none" stroke="rgba(8,25,40,.25)" stroke-width=".5"/>
  </svg>`;
}

function renderTemplates() {
  $('#templateGrid').innerHTML = templates.map(template => {
    const snapshot = { ...state, template: template.id, logo: '' };
    const previous = { ...state };
    Object.assign(state, snapshot);
    const svg = labelSvg({ compact: true });
    Object.assign(state, previous);
    return `<button class="template ${template.id === state.template ? 'active' : ''}" type="button" data-template="${template.id}"><span class="template-preview">${svg}</span><strong>${template.name}</strong><small>${template.note}</small></button>`;
  }).join('');
}

function render() {
  const svg = labelSvg();
  $('#flatLabel').innerHTML = svg;
  $('#bottleLabel').innerHTML = svg;
  $('#summaryMini').innerHTML = svg;
  const isLargeVial = state.size === '10ml';
  $('#photoVial').classList.toggle('size-10ml', isLargeVial);
  $('#vialPhoto').src = isLargeVial ? 'assets/vial-photo-10ml.png' : 'assets/vial-photo-3ml.png';
  $('#vialPhoto').alt = isLargeVial
    ? 'Photorealistic 10 mL clear glass vial product mockup'
    : 'Photorealistic 3 mL clear glass vial product mockup';
  $('#sizeCaption').textContent = state.size === '10ml' ? '70 x 25 mm · rounded corners · 10 mL vial' : '44 x 19 mm · rounded corners · 3 mL vial';
  $('#summarySize').textContent = sizeNames[state.size];
  $('#summaryTemplate').textContent = currentTemplate().name;
  $('#summaryMaterial').textContent = materialNames[state.material];
  $('#summaryQty').textContent = `${state.qty.toLocaleString()} labels`;
  $('#summaryPrice').textContent = 'FREE';
  $('#unitPrice').textContent = 'No design fee';
  $$('#sizeOptions .segment').forEach(button => button.classList.toggle('active', button.dataset.size === state.size));
  $$('#materialOptions .material').forEach(button => button.classList.toggle('active', button.dataset.material === state.material));
  $$('#quantityOptions .quantity').forEach(button => button.classList.toggle('active', Number(button.dataset.qty) === state.qty));
  $$('#templateGrid .template').forEach(button => button.classList.toggle('active', button.dataset.template === state.template));
  queueSave();
}

function queueSave() {
  $('#saveState').textContent = 'Saving draft...';
  $('#saveState').classList.add('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem('rp-label-designer-draft', JSON.stringify(state));
      $('#saveState').textContent = 'Draft saved locally';
      $('#saveState').classList.remove('saving');
    } catch (error) {
      $('#saveState').textContent = 'Preview mode';
    }
  }, 280);
}

function readInputs() {
  state.productName = $('#productName').value.trim();
  state.dose = $('#dose').value.trim();
  state.unit = $('#unit').value;
  state.batch = $('#batch').value.trim();
  state.expiry = $('#expiry').value.trim();
  state.qrValue = $('#qrValue').value.trim();
}

function updateQrAndRender() {
  clearTimeout(updateQrAndRender.timer);
  updateQrAndRender.timer = setTimeout(() => {
    makeQrData(state.qrValue);
    render();
  }, 260);
}

function showToast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2400);
}

function openReview() {
  const designId = `RP-${new Date().toISOString().slice(2,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  $('#reviewPreview').innerHTML = labelSvg();
  $('#reviewMeta').innerHTML = `
    <div><span>Design ID</span><strong>${designId}</strong></div>
    <div><span>Label size</span><strong>${sizeNames[state.size]}</strong></div>
    <div><span>Material</span><strong>${materialNames[state.material]}</strong></div>
    <div><span>Quantity</span><strong>${state.qty.toLocaleString()} labels</strong></div>`;
  $('#reviewModal').dataset.designId = designId;
  $('#approvalCheck').checked = false;
  $('#whatsappBtn').disabled = true;
  $('#reviewModal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeReview() {
  $('#reviewModal').hidden = true;
  document.body.style.overflow = '';
}

function downloadPreview() {
  const svg = labelSvg();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const ratio = state.size === '10ml' ? 70 / 25 : 44.45 / 19.05;
    const canvas = document.createElement('canvas');
    canvas.width = state.size === '10ml' ? 2100 : 1400;
    canvas.height = Math.round(canvas.width / ratio);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const link = document.createElement('a');
    link.download = `rp-label-preview-${state.productName.toLowerCase().replace(/[^a-z0-9]+/g,'-') || 'design'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('High-resolution preview downloaded.');
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('Preview could not be downloaded.');
  };
  image.src = url;
}

function restoreDraft() {
  const freshReview = new URLSearchParams(location.search).get('fresh') === '1';
  try {
    const saved = freshReview ? null : JSON.parse(localStorage.getItem('rp-label-designer-draft') || 'null');
    if (saved && typeof saved === 'object') Object.assign(state, saved);
  } catch (error) {}
  $('#productName').value = state.productName;
  $('#dose').value = state.dose;
  $('#unit').value = state.unit;
  $('#batch').value = state.batch;
  $('#expiry').value = state.expiry;
  $('#qrValue').value = state.qrValue;
  $('#logoScale').value = state.logoScale;
  $('#logoX').value = state.logoX;
  $('#logoY').value = state.logoY;
  if (state.logo) {
    $('#logoName').textContent = state.logoName || 'Saved logo';
    $('#logoRemove').hidden = false;
    $('#logoControls').hidden = false;
    $('#logoControls').style.display = 'grid';
  }
}

function bindEvents() {
  ['productName','dose','unit','batch','expiry'].forEach(id => {
    $(`#${id}`).addEventListener(id === 'unit' ? 'change' : 'input', () => { readInputs(); render(); });
  });
  $('#qrValue').addEventListener('input', () => { readInputs(); updateQrAndRender(); });
  $('#sizeOptions').addEventListener('click', event => {
    const button = event.target.closest('[data-size]');
    if (!button) return;
    state.size = button.dataset.size;
    renderTemplates();
    render();
  });
  $('#templateGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-template]');
    if (!button) return;
    state.template = button.dataset.template;
    render();
  });
  $('#materialOptions').addEventListener('click', event => {
    const button = event.target.closest('[data-material]');
    if (!button) return;
    state.material = button.dataset.material;
    renderTemplates();
    render();
  });
  $('#quantityOptions').addEventListener('click', event => {
    const button = event.target.closest('[data-qty]');
    if (!button) return;
    state.qty = Number(button.dataset.qty);
    render();
  });
  $('#logoPick').addEventListener('click', () => $('#logoFile').click());
  $('#logoFile').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) return showToast('Please choose a PNG, JPG or WEBP image.');
    if (file.size > 2 * 1024 * 1024) return showToast('Logo must be smaller than 2 MB.');
    const reader = new FileReader();
    reader.onload = () => {
      state.logo = reader.result;
      state.logoName = file.name;
      $('#logoName').textContent = file.name;
      $('#logoRemove').hidden = false;
      $('#logoControls').hidden = false;
      $('#logoControls').style.display = 'grid';
      render();
    };
    reader.readAsDataURL(file);
  });
  $('#logoRemove').addEventListener('click', () => {
    state.logo = '';
    state.logoName = '';
    $('#logoFile').value = '';
    $('#logoName').textContent = 'No logo uploaded';
    $('#logoRemove').hidden = true;
    $('#logoControls').hidden = true;
    $('#logoControls').style.display = '';
    render();
  });
  ['logoScale','logoX','logoY'].forEach(id => {
    $(`#${id}`).addEventListener('input', event => { state[id] = Number(event.target.value); render(); });
  });
  $('#reviewBtn').addEventListener('click', openReview);
  $('#downloadBtn').addEventListener('click', downloadPreview);
  $$('[data-close-modal]').forEach(button => button.addEventListener('click', closeReview));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#reviewModal').hidden) closeReview(); });
  $('#approvalCheck').addEventListener('change', event => { $('#whatsappBtn').disabled = !event.target.checked; });
  $('#whatsappBtn').addEventListener('click', () => {
    const id = $('#reviewModal').dataset.designId;
    const message = `Hello RP Labels, I created a vial label concept.\nDesign ID: ${id}\nProduct: ${state.productName}\nStrength: ${state.dose} ${state.unit}\nSize: ${sizeNames[state.size]}\nTemplate: ${currentTemplate().name}\nMaterial: ${materialNames[state.material]}\nQuantity: ${state.qty} labels\nPlease prepare a free proof.`;
    window.open(`https://api.whatsapp.com/message/AWJL6N3AAGIZA1?autoload=1&app_absent=0&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });
  $('#resetBtn').addEventListener('click', () => {
    localStorage.removeItem('rp-label-designer-draft');
    location.reload();
  });
}

restoreDraft();
makeQrData(state.qrValue);
renderTemplates();
bindEvents();
render();
