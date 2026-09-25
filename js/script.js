// ===== Иконки =====
const ICONS = {
  play: '<svg class="icon icon--fill" viewBox="0 0 24 24"><path d="M7 4.8v14.4a1 1 0 0 0 1.52.85l11.5-7.2a1 1 0 0 0 0-1.7L8.52 3.95A1 1 0 0 0 7 4.8Z"/></svg>',
  pause: '<svg class="icon icon--fill" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  music: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  volume: '<svg class="icon" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  volumeLow: '<svg class="icon" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  volumeMuted: '<svg class="icon" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>',
  speaker: '<svg class="icon icon--fill" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  sun: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
};

const CATEGORIES = [{
    id: 'jazz',
    name: 'Jazz'
  },
  {
    id: 'classic',
    name: 'Classic'
  },
  {
    id: 'blues',
    name: 'Blues'
  }
];

// ===== Состояние =====
let tracks = [];

let state = {
  category: 'jazz', // активная категория
  trackId: null, // какой трек выбран
  isPlaying: false, // играет или на паузе
  volume: 0.7, // текущая громкость
  isMuted: false,
  shuffle: false,
  repeat: false,
  liked: loadLiked()
};

// Один Audio на весь плеер — меняем только src
const audio = new Audio();
audio.preload = 'metadata';
audio.volume = state.volume;

// ===== Элементы =====
const $ = (id) => document.getElementById(id);
const els = {
  app: document.querySelector('.app'),
  categories: $('categories'),
  playlist: $('playlist'),
  playlistName: $('playlistName'),
  playlistPlayBtn: $('playlistPlayBtn'),
  playlistShuffleBtn: $('playlistShuffleBtn'),
  tracks: $('tracks'),
  themeBtn: $('themeBtn'),
  player: $('player'),
  playerTitle: $('playerTitle'),
  playerArtist: $('playerArtist'),
  likeBtn: $('likeBtn'),
  shuffleBtn: $('shuffleBtn'),
  prevBtn: $('prevBtn'),
  playBtn: $('playBtn'),
  nextBtn: $('nextBtn'),
  repeatBtn: $('repeatBtn'),
  currentTime: $('currentTime'),
  duration: $('duration'),
  progress: $('progress'),
  progressFill: $('progressFill'),
  muteBtn: $('muteBtn'),
  volume: $('volume')
};

// ===== Утилиты =====
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return min + ':' + String(sec).padStart(2, '0');
}

function pluralTracks(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return n + ' трек';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + ' трека';
  return n + ' треков';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [ch]));
}

function getTracksByCategory(category) {
  return tracks.filter((track) => track.category === category);
}

function getCurrentTrack() {
  return tracks.find((track) => track.id === state.trackId) || null;
}

function loadLiked() {
  try {
    return JSON.parse(localStorage.getItem('liked')) || [];
  } catch (e) {
    return [];
  }
}

function saveLiked() {
  try {
    localStorage.setItem('liked', JSON.stringify(state.liked));
  } catch (e) {}
}

// ===== Отрисовка =====
function renderCategories() {
  const current = getCurrentTrack();

  els.categories.innerHTML = CATEGORIES.map((cat) => {
    const isActive = cat.id === state.category;
    const isPlaying = state.isPlaying && current && current.category === cat.id;
    return `
      <li>
        <button class="category ${isActive ? 'is-active' : ''} ${isPlaying ? 'is-playing' : ''}"
                data-category="${cat.id}" type="button" aria-pressed="${isActive}">
          <span class="category__cover">${ICONS.music}</span>
          <span class="category__info">
            <span class="category__name">${cat.name}</span>
            <span class="category__count">Плейлист · ${pluralTracks(getTracksByCategory(cat.id).length)}</span>
          </span>
          <span class="category__playing">${ICONS.speaker}</span>
        </button>
      </li>`;
  }).join('');
}

function renderHeader() {
  const cat = CATEGORIES.find((c) => c.id === state.category);
  els.playlist.dataset.category = state.category;
  els.playlistName.textContent = cat.name;

  // Большая кнопка показывает паузу, только если играет трек ЭТОЙ категории
  const current = getCurrentTrack();
  const playingHere = state.isPlaying && current && current.category === state.category;
  els.playlistPlayBtn.innerHTML = playingHere ? ICONS.pause : ICONS.play;
  els.playlistPlayBtn.setAttribute('aria-label', playingHere ? 'Пауза' : 'Играть плейлист');
}

function renderTracks() {
  const list = getTracksByCategory(state.category);

  if (!list.length) {
    els.tracks.innerHTML = '<li class="tracks__empty">В этой категории пока нет треков</li>';
    return;
  }

  els.tracks.innerHTML = list.map((track, index) => {
    const isActive = track.id === state.trackId;
    const isPlaying = isActive && state.isPlaying;
    return `
      <li class="track ${isActive ? 'is-active' : ''} ${isPlaying ? 'is-playing' : ''}"
          data-id="${track.id}" tabindex="0">
        <span class="track__num">
          <span class="track__index">${index + 1}</span>
          <span class="track__play">${ICONS.play}</span>
          <span class="track__pause">${ICONS.pause}</span>
          <span class="track__eq"><i></i><i></i><i></i><i></i></span>
        </span>
        <span class="track__cover"></span>
        <div class="track__info">
          <div class="track__title">${escapeHtml(track.title)}</div>
          <div class="track__artist">${escapeHtml(track.artist)}</div>
        </div>
        <span class="track__dur">${formatTime(track.duration)}</span>
      </li>`;
  }).join('');
}

function renderPlayer() {
  const track = getCurrentTrack();

  els.player.classList.toggle('has-track', Boolean(track));
  els.player.dataset.playerCategory = track ? track.category : state.category;
  els.playerTitle.textContent = track ? track.title : 'Выберите трек';
  els.playerArtist.textContent = track ? track.artist : '—';

  // Play/Pause — одна кнопка, иконка зависит от state.isPlaying
  els.playBtn.innerHTML = state.isPlaying ? ICONS.pause : ICONS.play;
  els.playBtn.setAttribute('aria-label', state.isPlaying ? 'Пауза' : 'Играть');

  const liked = track && state.liked.includes(track.id);
  els.likeBtn.disabled = !track;
  els.likeBtn.classList.toggle('is-liked', Boolean(liked));
  els.likeBtn.setAttribute('aria-pressed', Boolean(liked));

  els.shuffleBtn.classList.toggle('is-on', state.shuffle);
  els.playlistShuffleBtn.classList.toggle('is-on', state.shuffle);
  els.repeatBtn.classList.toggle('is-on', state.repeat);

  document.title = track && state.isPlaying ? `${track.title} · ${track.artist}` : 'Плеер';
}

function renderVolume() {
  const value = state.isMuted ? 0 : Math.round(state.volume * 100);
  els.volume.value = value;
  els.volume.style.setProperty('--val', value + '%');

  let icon = ICONS.volume;
  if (state.isMuted || state.volume === 0) icon = ICONS.volumeMuted;
  else if (state.volume < 0.5) icon = ICONS.volumeLow;
  els.muteBtn.innerHTML = icon;
  els.muteBtn.setAttribute('aria-label', state.isMuted ? 'Включить звук' : 'Выключить звук');
}

function renderProgress() {
  const duration = audio.duration || (getCurrentTrack() || {}).duration || 0;
  const current = audio.currentTime || 0;
  const percent = duration ? (current / duration) * 100 : 0;

  els.progressFill.style.width = Math.min(percent, 100) + '%';
  els.currentTime.textContent = formatTime(current);
  els.duration.textContent = formatTime(duration);
}

// Обновляет подсветку без перестройки списков (не сбивает фокус и hover)
function updateHighlights() {
  const current = getCurrentTrack();

  els.categories.querySelectorAll('.category').forEach((btn) => {
    const isActive = btn.dataset.category === state.category;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', isActive);
    btn.classList.toggle('is-playing', Boolean(state.isPlaying && current && current.category === btn.dataset.category));
  });

  els.tracks.querySelectorAll('.track').forEach((row) => {
    const isActive = Number(row.dataset.id) === state.trackId;
    row.classList.toggle('is-active', isActive);
    row.classList.toggle('is-playing', isActive && state.isPlaying);
  });
}

function render() {
  updateHighlights();
  renderHeader();
  renderPlayer();
}

// ===== Воспроизведение =====
function playTrack(id) {
  const track = tracks.find((t) => t.id === id);
  if (!track) return;

  // Клик по уже выбранному треку — пауза / продолжение
  if (id === state.trackId) {
    togglePlay();
    return;
  }

  state.trackId = id;
  audio.src = track.file;
  renderProgress();
  play();
}

function play() {
  if (!getCurrentTrack()) return;
  audio.play().catch((err) => {
    // AbortError — нормальная ситуация при быстром переключении треков
    if (err.name !== 'AbortError') console.warn('Не удалось воспроизвести:', err.message);
  });
}

function togglePlay() {
  if (!getCurrentTrack()) {
    const first = getTracksByCategory(state.category)[0];
    if (first) playTrack(first.id);
    return;
  }
  if (audio.paused) play();
  else audio.pause();
}

// Prev / Next — внутри категории ИГРАЮЩЕГО трека, по кругу
function getNeighbour(step) {
  const current = getCurrentTrack();
  if (!current) return null;

  const list = getTracksByCategory(current.category);
  if (list.length < 2) return current;

  if (state.shuffle) {
    const others = list.filter((t) => t.id !== current.id);
    return others[Math.floor(Math.random() * others.length)];
  }

  const index = list.findIndex((t) => t.id === current.id);
  return list[(index + step + list.length) % list.length];
}

function playNextTrack() {
  const next = getNeighbour(1);
  if (!next) return togglePlay();
  if (next.id === state.trackId) {
    audio.currentTime = 0;
    play();
  } else {
    playTrack(next.id);
  }
}

function playPrevTrack() {
  // Если трек уже играет дольше 3 секунд — сначала возвращаемся в его начало
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const prev = getNeighbour(-1);
  if (!prev) return togglePlay();
  if (prev.id === state.trackId) {
    audio.currentTime = 0;
    play();
  } else {
    playTrack(prev.id);
  }
}

function playCategory() {
  const current = getCurrentTrack();
  if (current && current.category === state.category) {
    togglePlay();
    return;
  }
  const list = getTracksByCategory(state.category);
  if (!list.length) return;
  const first = state.shuffle ? list[Math.floor(Math.random() * list.length)] : list[0];
  playTrack(first.id);
}

// ===== Категории =====
function setCategory(category) {
  if (category === state.category) return;
  state.category = category;
  // Играющий трек не трогаем — он продолжает звучать
  renderTracks();
  render();
  els.playlist.querySelector('.playlist__body').scrollTop = 0;
}

// ===== Прогресс =====
function seekFromEvent(event) {
  const duration = audio.duration;
  if (!getCurrentTrack() || !isFinite(duration)) return;
  const rect = els.progress.getBoundingClientRect();
  const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
  audio.currentTime = ratio * duration;
  renderProgress();
}

// ===== Громкость =====
function setVolume(value) {
  state.volume = value;
  state.isMuted = value === 0;
  audio.volume = value;
  audio.muted = false;
  renderVolume();
}

function toggleMute() {
  if (state.isMuted) {
    // Возвращаем прежнюю громкость (если была 0 — ставим разумную)
    if (state.volume === 0) state.volume = 0.5;
    state.isMuted = false;
    audio.volume = state.volume;
  } else {
    state.isMuted = true;
  }
  audio.muted = state.isMuted;
  renderVolume();
}

// ===== Тема =====
function renderTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  els.themeBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
  els.themeBtn.setAttribute('aria-label', isDark ? 'Светлая тема' : 'Тёмная тема');
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch (e) {}
  renderTheme();
}

// ===== События audio =====
audio.addEventListener('play', () => {
  state.isPlaying = true;
  render();
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  render();
});

audio.addEventListener('timeupdate', renderProgress);
audio.addEventListener('loadedmetadata', renderProgress);

audio.addEventListener('ended', () => {
  if (state.repeat) {
    audio.currentTime = 0;
    play();
  } else {
    playNextTrack(); // трек закончился — включаем следующий
  }
});

audio.addEventListener('error', () => {
  const track = getCurrentTrack();
  if (track) console.warn('Не удалось загрузить файл:', track.file);
});

// ===== События интерфейса =====
els.categories.addEventListener('click', (event) => {
  const btn = event.target.closest('.category');
  if (btn) setCategory(btn.dataset.category);
});

els.tracks.addEventListener('click', (event) => {
  const row = event.target.closest('.track');
  if (row) playTrack(Number(row.dataset.id));
});

els.tracks.addEventListener('keydown', (event) => {
  const row = event.target.closest('.track');
  if (row && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    playTrack(Number(row.dataset.id));
  }
});

els.playBtn.addEventListener('click', togglePlay);
els.nextBtn.addEventListener('click', playNextTrack);
els.prevBtn.addEventListener('click', playPrevTrack);
els.playlistPlayBtn.addEventListener('click', playCategory);

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  renderPlayer();
}
els.shuffleBtn.addEventListener('click', toggleShuffle);
els.playlistShuffleBtn.addEventListener('click', toggleShuffle);

els.repeatBtn.addEventListener('click', () => {
  state.repeat = !state.repeat;
  renderPlayer();
});

els.likeBtn.addEventListener('click', () => {
  const id = state.trackId;
  if (id === null) return;
  state.liked = state.liked.includes(id) ?
    state.liked.filter((x) => x !== id) :
    [...state.liked, id];
  saveLiked();
  renderPlayer();
});

// Перемотка: клик и перетаскивание по полосе
els.progress.addEventListener('pointerdown', (event) => {
  seekFromEvent(event);
  els.progress.setPointerCapture(event.pointerId);
});
els.progress.addEventListener('pointermove', (event) => {
  if (els.progress.hasPointerCapture(event.pointerId)) seekFromEvent(event);
});

els.volume.addEventListener('input', () => setVolume(els.volume.value / 100));
els.muteBtn.addEventListener('click', toggleMute);
els.themeBtn.addEventListener('click', toggleTheme);

// Пробел — play/pause (если фокус не в поле ввода)
document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;
  const tag = event.target.tagName;
  if (tag === 'INPUT' || tag === 'BUTTON' || event.target.closest('.track')) return;
  event.preventDefault();
  togglePlay();
});

// ===== Старт =====
async function init() {
  renderTheme();
  renderVolume();
  renderHeader();
  renderPlayer();
  renderProgress();

  try {
    const response = await fetch('tracks.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    tracks = await response.json();
  } catch (err) {
    console.error('Не удалось загрузить tracks.json:', err);
    els.tracks.innerHTML = '<li class="tracks__empty">Не удалось загрузить список треков. Запустите проект через локальный сервер (например, Live Server).</li>';
    return;
  }

  renderCategories();
  renderTracks();
  render();
}

init();