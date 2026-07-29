// ==========================================================
// Імпорт готового контенту в проєкт (запускати на своєму ПК)
//
// Використання:
//   1. Постав правильні шляхи нижче (CONFIG)
//   2. В терміналі, у папці проєкту: node tools/import-content.js
//   3. Файли скопіюються в www/media/..., і згенерується www/content.json
//   4. Далі npx cap sync android -> збірка apk в Android Studio
// ==========================================================

const fs = require("fs");
const path = require("path");

const CONFIG = {
  videoCategories: [
    {
      title: "Маша та Ведмідь",
      icon: "🐻",
      sourceDir: "C:\\Users\\getma\\OneDrive\\Desktop\\Маша та Ведмідь"
    }
    // Можна додати ще категорії за таким же зразком:
    // { title: "Радянські мультики", icon: "⭐", sourceDir: "C:\\шлях\\до\\папки" }
  ],
  musicSourceDir: "C:\\Users\\getma\\OneDrive\\Desktop\\Моя музика"
};

const VIDEO_EXT = [".mp4", ".webm", ".m4v", ".mkv", ".avi"];
const AUDIO_EXT = [".mp3", ".m4a", ".aac", ".wav", ".ogg"];

const ROOT = path.join(__dirname, "..");
const MEDIA_VIDEOS = path.join(ROOT, "www", "media", "videos");
const MEDIA_MUSIC = path.join(ROOT, "www", "media", "music");
const CONTENT_JSON = path.join(ROOT, "www", "content.json");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}
function safeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function importVideos() {
  const categories = [];
  for (const cat of CONFIG.videoCategories) {
    if (!fs.existsSync(cat.sourceDir)) {
      console.warn(`⚠ Папку не знайдено, пропускаю: ${cat.sourceDir}`);
      continue;
    }
    const slug = slugify(cat.title);
    const destDir = path.join(MEDIA_VIDEOS, slug);
    ensureDir(destDir);

    const files = fs.readdirSync(cat.sourceDir)
      .filter(f => VIDEO_EXT.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "uk", { numeric: true }));

    const episodes = [];
    files.forEach(f => {
      const clean = safeFileName(f);
      const src = path.join(cat.sourceDir, f);
      const dest = path.join(destDir, clean);
      fs.copyFileSync(src, dest);
      const title = clean.replace(/\.[^.]+$/, "").replace(/_+/g, " ").trim();
      episodes.push({ title, file: `media/videos/${slug}/${clean}` });
      console.log(`  ✓ ${f}`);
    });

    if (episodes.length) {
      categories.push({ id: slug, title: cat.title, icon: cat.icon || "🎬", episodes });
      console.log(`✔ Категорія "${cat.title}": ${episodes.length} файл(ів)`);
    } else {
      console.warn(`⚠ У папці "${cat.sourceDir}" не знайдено відеофайлів`);
    }
  }
  return categories;
}

function importMusic() {
  if (!fs.existsSync(CONFIG.musicSourceDir)) {
    console.warn(`⚠ Папку з музикою не знайдено: ${CONFIG.musicSourceDir}`);
    return [];
  }
  ensureDir(MEDIA_MUSIC);
  const files = fs.readdirSync(CONFIG.musicSourceDir)
    .filter(f => AUDIO_EXT.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "uk", { numeric: true }));

  const music = [];
  files.forEach(f => {
    const clean = safeFileName(f);
    const src = path.join(CONFIG.musicSourceDir, f);
    const dest = path.join(MEDIA_MUSIC, clean);
    fs.copyFileSync(src, dest);
    const title = clean.replace(/\.[^.]+$/, "").replace(/_+/g, " ").trim();
    music.push({ title, file: `media/music/${clean}` });
    console.log(`  ✓ ${f}`);
  });
  console.log(`✔ Музика: ${music.length} файл(ів)`);
  return music;
}

console.log("Копіюю мультики...");
const videoCategories = importVideos();
console.log("\nКопіюю музику...");
const music = importMusic();

const content = { videoCategories, music };
fs.writeFileSync(CONTENT_JSON, JSON.stringify(content, null, 2), "utf-8");
console.log(`\nГотово! Записано ${CONTENT_JSON}`);
console.log("Далі: npx cap sync android -> відкрити в Android Studio -> Build APK");
