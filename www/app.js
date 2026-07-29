// ==========================================================
// Бібліотека Надійки — основна логіка
// ==========================================================

const VIDEO_EXT = ["mp4", "webm", "m4v", "mkv", "avi"];
const AUDIO_EXT = ["mp3", "m4a", "aac", "wav", "ogg"];
const STORAGE_DIR = "EXTERNAL"; // папка застосунку (не потребує особливих дозволів)
const MEDIA_ROOT = "НадійкинаБібліотека";

const P = () => window.Capacitor && window.Capacitor.Plugins;

let library = { categories: [], music: [] };
// library.categories: [{ title, icon, episodes: [{ title, path }] }]
// library.music: [{ title, path }]

let resumeMap = {};
let currentAudioIndex = 0;
let pendingFilesQueue = []; // черга відео-файлів, що чекають вибору категорії

const screens = ["home", "videoCategories", "episodes", "music"];
function showScreen(id) {
  screens.forEach(s => document.getElementById(s).classList.toggle("active", s === id));
}

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}
function titleFromFilename(name) {
  const i = name.lastIndexOf(".");
  const base = i === -1 ? name : name.slice(0, i);
  return base.replace(/[_]+/g, " ").trim();
}
function safeName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- Вбудований (зашитий у apk) контент ----------
async function loadBundledContent() {
  try {
    const res = await fetch("content.json");
    if (!res.ok) return { videoCategories: [], music: [] };
    return await res.json();
  } catch (e) {
    return { videoCategories: [], music: [] };
  }
}

// ---------- Збереження бібліотеки (те, що додано кнопкою "Додати файли") ----------
async function loadLibrary() {
  let added = { categories: [], music: [] };
  try {
    const { Preferences } = P();
    const lib = await Preferences.get({ key: "library" });
    const res = await Preferences.get({ key: "resumeMap" });
    added = lib.value ? JSON.parse(lib.value) : { categories: [], music: [] };
    resumeMap = res.value ? JSON.parse(res.value) : {};
  } catch (e) {
    resumeMap = {};
  }

  const bundled = await loadBundledContent();
  const bundledCategories = (bundled.videoCategories || []).map(cat => ({
    title: cat.title,
    icon: cat.icon || "🎬",
    bundled: true,
    episodes: (cat.episodes || []).map(ep => ({ title: ep.title, path: ep.file, bundled: true }))
  }));
  const bundledMusic = (bundled.music || []).map(m => ({ title: m.title, path: m.file, bundled: true }));

  // Об'єднуємо: вбудовані категорії + ті, що додані кнопкою (без дублів за назвою)
  const merged = [...bundledCategories];
  (added.categories || []).forEach(addedCat => {
    const existing = merged.find(c => c.title === addedCat.title);
    if (existing) existing.episodes.push(...addedCat.episodes);
    else merged.push(addedCat);
  });

  library = {
    categories: merged,
    music: [...bundledMusic, ...(added.music || [])]
  };
}
async function saveLibrary() {
  try {
    const { Preferences } = P();
    await Preferences.set({ key: "library", value: JSON.stringify(library) });
  } catch (e) { /* ignore */ }
}
async function saveResumeMap() {
  try {
    const { Preferences } = P();
    await Preferences.set({ key: "resumeMap", value: JSON.stringify(resumeMap) });
  } catch (e) { /* ignore */ }
}

// ---------- Рендер ----------
function renderCategories() {
  const grid = document.getElementById("categories-grid");
  const empty = document.getElementById("categories-empty");
  grid.innerHTML = "";
  empty.style.display = library.categories.length ? "none" : "block";
  library.categories.forEach(cat => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="thumb">${cat.icon || "🎬"}</div><div class="label">${cat.title}</div>`;
    card.addEventListener("click", () => openCategory(cat));
    grid.appendChild(card);
  });
}

let currentCategory = null;
function openCategory(cat) {
  currentCategory = cat;
  document.getElementById("episodes-title").textContent = cat.title;
  const grid = document.getElementById("episodes-grid");
  grid.innerHTML = "";
  cat.episodes.forEach(ep => {
    const card = document.createElement("div");
    card.className = "card";
    const hasResume = resumeMap[ep.path] && resumeMap[ep.path] > 5;
    card.innerHTML = `<div class="thumb">🎬</div><div class="label">${ep.title}</div>${hasResume ? '<div class="resume-badge">Продовжити</div>' : ''}`;
    card.addEventListener("click", () => playVideo(ep));
    grid.appendChild(card);
  });
  showScreen("episodes");
}

async function fileSrc(relativePath) {
  const { Filesystem } = P();
  const { uri } = await Filesystem.getUri({ path: relativePath, directory: STORAGE_DIR });
  return window.Capacitor.convertFileSrc(uri);
}

async function playVideo(ep) {
  const overlay = document.getElementById("video-overlay");
  const player = document.getElementById("video-player");
  document.getElementById("video-title").textContent = ep.title;
  player.src = ep.bundled ? ep.path : await fileSrc(ep.path);
  overlay.classList.add("open");
  const resumeAt = resumeMap[ep.path];
  if (resumeAt && resumeAt > 5) {
    player.addEventListener("loadedmetadata", function once() {
      player.currentTime = resumeAt;
      player.removeEventListener("loadedmetadata", once);
    });
  }
  player.play().catch(() => {});
  player._currentPath = ep.path;
}
document.getElementById("video-player").addEventListener("timeupdate", (e) => {
  const p = e.target;
  if (p._currentPath && p.currentTime > 0) resumeMap[p._currentPath] = p.currentTime;
});
document.getElementById("close-video").addEventListener("click", () => {
  const overlay = document.getElementById("video-overlay");
  const player = document.getElementById("video-player");
  player.pause();
  player.src = "";
  overlay.classList.remove("open");
  saveResumeMap();
  renderCategories();
  if (currentCategory) openCategory(currentCategory);
});

function renderMusic() {
  const grid = document.getElementById("music-grid");
  const empty = document.getElementById("music-empty");
  grid.innerHTML = "";
  empty.style.display = library.music.length ? "none" : "block";
  library.music.forEach((song, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="thumb">🎵</div><div class="label">${song.title}</div>`;
    card.addEventListener("click", () => playMusic(i));
    grid.appendChild(card);
  });
}

const audio = document.getElementById("audio-player");
const seek = document.getElementById("music-seek");
const playBtn = document.getElementById("music-play");

async function playMusic(index) {
  if (!library.music.length) return;
  currentAudioIndex = (index + library.music.length) % library.music.length;
  const song = library.music[currentAudioIndex];
  audio.src = song.bundled ? song.path : await fileSrc(song.path);
  document.getElementById("music-title").textContent = song.title;
  audio.play().catch(() => {});
  playBtn.textContent = "⏸";
}
playBtn.addEventListener("click", () => {
  if (!audio.src) return;
  if (audio.paused) { audio.play(); playBtn.textContent = "⏸"; }
  else { audio.pause(); playBtn.textContent = "▶️"; }
});
document.getElementById("music-next").addEventListener("click", () => playMusic(currentAudioIndex + 1));
document.getElementById("music-prev").addEventListener("click", () => playMusic(currentAudioIndex - 1));
audio.addEventListener("ended", () => playMusic(currentAudioIndex + 1));
audio.addEventListener("timeupdate", () => { if (audio.duration) seek.value = (audio.currentTime / audio.duration) * 100; });
seek.addEventListener("input", () => { if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration; });

// ---------- Навігація ----------
document.getElementById("go-videos").addEventListener("click", () => showScreen("videoCategories"));
document.getElementById("go-music").addEventListener("click", () => showScreen("music"));
document.querySelectorAll(".back-btn").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.back));
});

// ---------- Додавання файлів ----------
document.getElementById("go-add").addEventListener("click", pickFiles);

async function pickFiles() {
  const { FilePicker } = P();
  if (!FilePicker) {
    showToast("Плагін вибору файлів не підключено");
    return;
  }
  try {
    const result = await FilePicker.pickFiles({ multiple: true, readData: false });
    const files = result.files || [];
    if (!files.length) return;

    const videos = [];
    for (const f of files) {
      const ext = extOf(f.name);
      if (AUDIO_EXT.includes(ext)) {
        await addMusicFile(f);
      } else if (VIDEO_EXT.includes(ext)) {
        videos.push(f);
      } else {
        showToast(`Пропущено (незнайомий формат): ${f.name}`);
      }
    }
    if (videos.length) {
      pendingFilesQueue = videos;
      askCategoryForNext();
    } else {
      renderMusic();
      saveLibrary();
    }
  } catch (e) {
    console.warn("Вибір файлів скасовано або сталась помилка", e);
  }
}

async function addMusicFile(pickedFile) {
  const { Filesystem } = P();
  const destPath = `${MEDIA_ROOT}/Музика/${safeName(pickedFile.name)}`;
  try {
    await Filesystem.copy({ from: pickedFile.path, to: destPath, toDirectory: STORAGE_DIR });
  } catch (e) {
    // якщо шлях у форматі content:// copy може вимагати трохи іншого підходу — див. README
    console.warn("Не вдалося скопіювати аудіо", e);
    showToast(`Помилка копіювання: ${pickedFile.name}`);
    return;
  }
  library.music.push({ title: titleFromFilename(pickedFile.name), path: destPath });
  showToast(`Додано в Музику: ${titleFromFilename(pickedFile.name)}`);
}

function askCategoryForNext() {
  if (!pendingFilesQueue.length) {
    saveLibrary();
    renderCategories();
    renderMusic();
    return;
  }
  const nextFile = pendingFilesQueue[0];
  document.getElementById("category-modal-filename").textContent = `Куди покласти «${titleFromFilename(nextFile.name)}»?`;
  const list = document.getElementById("category-modal-list");
  list.innerHTML = "";
  library.categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = `${cat.icon || "🎬"} ${cat.title}`;
    btn.addEventListener("click", () => addVideoToCategory(nextFile, cat.title));
    list.appendChild(btn);
  });
  document.getElementById("new-category-input").value = "";
  document.getElementById("category-modal").classList.add("open");
}

document.getElementById("new-category-confirm").addEventListener("click", () => {
  const name = document.getElementById("new-category-input").value.trim();
  if (!name) { showToast("Введи назву категорії"); return; }
  const nextFile = pendingFilesQueue[0];
  addVideoToCategory(nextFile, name);
});

document.getElementById("category-modal-cancel").addEventListener("click", () => {
  pendingFilesQueue.shift();
  document.getElementById("category-modal").classList.remove("open");
  askCategoryForNext();
});

async function addVideoToCategory(pickedFile, categoryTitle) {
  const { Filesystem } = P();
  let cat = library.categories.find(c => c.title === categoryTitle);
  if (!cat) {
    cat = { title: categoryTitle, icon: "🎬", episodes: [] };
    library.categories.push(cat);
  }
  const destPath = `${MEDIA_ROOT}/Мультфільми/${safeName(categoryTitle)}/${safeName(pickedFile.name)}`;
  try {
    await Filesystem.copy({ from: pickedFile.path, to: destPath, toDirectory: STORAGE_DIR });
    cat.episodes.push({ title: titleFromFilename(pickedFile.name), path: destPath });
    showToast(`Додано в «${categoryTitle}»: ${titleFromFilename(pickedFile.name)}`);
  } catch (e) {
    console.warn("Не вдалося скопіювати відео", e);
    showToast(`Помилка копіювання: ${pickedFile.name}`);
  }
  document.getElementById("category-modal").classList.remove("open");
  pendingFilesQueue.shift();
  askCategoryForNext();
}

// ---------- Захист від виходу ----------
let exitPressTimer = null;
const exitCorner = document.getElementById("exit-corner");
const exitOverlay = document.getElementById("exit-overlay");
function startExitPress() { exitPressTimer = setTimeout(() => exitOverlay.classList.add("open"), 3000); }
function cancelExitPress() { if (exitPressTimer) clearTimeout(exitPressTimer); }
exitCorner.addEventListener("touchstart", startExitPress);
exitCorner.addEventListener("touchend", cancelExitPress);
exitCorner.addEventListener("mousedown", startExitPress);
exitCorner.addEventListener("mouseup", cancelExitPress);
document.getElementById("exit-no").addEventListener("click", () => exitOverlay.classList.remove("open"));
document.getElementById("exit-yes").addEventListener("click", () => {
  try { P().App.exitApp(); } catch (e) { /* ignore */ }
});

try {
  P().App.addListener("backButton", () => {
    const activeScreen = screens.find(s => document.getElementById(s).classList.contains("active"));
    if (activeScreen === "home") exitOverlay.classList.add("open");
    else if (activeScreen === "episodes") showScreen("videoCategories");
    else showScreen("home");
  });
} catch (e) { /* браузерний перегляд без Capacitor */ }

// ---------- Старт ----------
(async function init() {
  await loadLibrary();
  renderCategories();
  renderMusic();
  document.getElementById("status-line").textContent =
    (library.categories.length || library.music.length)
      ? `Категорій: ${library.categories.length}, пісень: ${library.music.length}`
      : "Поки що порожньо — тисни «Додати файли»";
})();
