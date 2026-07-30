

import Storage from "./modules/Storage.js";
import Manifest from "./modules/Manifest.js";
import CloudSync from "./modules/CloudSync.js";
import DownloadManager from "./modules/DownloadManager.js";
import LibraryManager from "./modules/LibraryManager.js";
import Player from "./modules/Player.js";
import UI from "./modules/UI.js";

const VIDEO_EXT = ["mp4","webm","mkv","avi","m4v"];
const AUDIO_EXT = ["mp3","wav","aac","ogg","m4a"];

let library = {
    categories: [],
    music: []
};

let manifest = null;
let currentCategory = null;
let currentAudioIndex = 0;
let resumeMap = {};
let pendingFilesQueue = [];

const screens = [
    "home",
    "videoCategories",
    "episodes",
    "music"
];

function P(){
    return window.Capacitor?.Plugins;
}

function extOf(name){
    const i=name.lastIndexOf(".");
    if(i===-1) return "";
    return name.substring(i+1).toLowerCase();
}

function titleFromFilename(name){
    const i=name.lastIndexOf(".");
    return (i==-1?name:name.substring(0,i))
        .replace(/_/g," ")
        .trim();
}

function safeName(name){
    return name.replace(/[\\/:*?"<>|]/g,"_");
}

async function initialize(){

    UI.init();

    await Storage.init();

    resumeMap = await Storage.loadResume();

    library = await LibraryManager.loadLibrary();

    manifest = await Manifest.load();

    await CloudSync.initialize();

    renderCategories();

    renderMusic();

    updateStatus();

}

function updateStatus(){

    document.getElementById("status-line").textContent=
        `Категорій: ${library.categories.length} | Музика: ${library.music.length}`;

}

function showScreen(id){

    screens.forEach(screen=>{

        document
            .getElementById(screen)
            .classList
            .toggle("active",screen===id);

    });

}

function renderCategories(){

    const grid=document.getElementById("categories-grid");

    grid.innerHTML="";

    if(!library.categories.length){

        document.getElementById("categories-empty").style.display="block";
        return;

    }

    document.getElementById("categories-empty").style.display="none";

    library.categories.forEach(category=>{

        const card=document.createElement("div");

        card.className="card";

        card.innerHTML=`
            <div class="thumb">${category.icon||"🎬"}</div>
            <div class="label">${category.title}</div>
        `;

        card.onclick=()=>openCategory(category);

        grid.appendChild(card);

    });

}

function openCategory(category){

    currentCategory=category;

    document.getElementById("episodes-title").textContent=category.title;

    const grid=document.getElementById("episodes-grid");

    grid.innerHTML="";

    category.episodes.forEach(episode=>{

        const resume=resumeMap[episode.path]||0;

        const card=document.createElement("div");

        card.className="card";

        card.innerHTML=`
            <div class="thumb">🎬</div>
            <div class="label">${episode.title}</div>
            ${
                resume>5
                ?'<div class="resume-badge">▶ Продовжити</div>'
                :""
            }
        `;

        card.onclick=()=>playVideo(episode);

        grid.appendChild(card);

    });

    showScreen("episodes");

}

async function playVideo(video){

    await Player.playVideo(video,resumeMap);

}

async function renderMusic(){

    const grid=document.getElementById("music-grid");

    grid.innerHTML="";

    if(!library.music.length){

        document.getElementById("music-empty").style.display="block";
        return;

    }

    document.getElementById("music-empty").style.display="none";

    library.music.forEach((song,index)=>{

        const card=document.createElement("div");

        card.className="card";

        card.innerHTML=`
            <div class="thumb">🎵</div>
            <div class="label">${song.title}</div>
        `;

        card.onclick=()=>playMusic(index);

        grid.appendChild(card);

    });

}
async function playMusic(index){

    if(!library.music.length) return;

    currentAudioIndex=index;

    const song=library.music[index];

    await Player.playMusic(song);

    UI.setMusicTitle(song.title);

}

document
.getElementById("music-play")
.onclick=()=>Player.toggleMusic();

document
.getElementById("music-next")
.onclick=()=>{

    currentAudioIndex++;

    if(currentAudioIndex>=library.music.length)
        currentAudioIndex=0;

    playMusic(currentAudioIndex);

};

document
.getElementById("music-prev")
.onclick=()=>{

    currentAudioIndex--;

    if(currentAudioIndex<0)
        currentAudioIndex=library.music.length-1;

    playMusic(currentAudioIndex);

};

document
.getElementById("go-videos")
.onclick=()=>showScreen("videoCategories");

document
.getElementById("go-music")
.onclick=()=>showScreen("music");

document
.querySelectorAll(".back-btn")
.forEach(button=>{

    button.onclick=()=>{

        showScreen(button.dataset.back);

    };

});

document
.getElementById("close-video")
.onclick=async()=>{

    await Player.stopVideo();

    resumeMap=Player.getResume();

    await Storage.saveResume(resumeMap);

    if(currentCategory)
        openCategory(currentCategory);

};

document
.getElementById("go-add")
.onclick=pickFiles;

async function pickFiles(){

    const picker=P().FilePicker;

    if(!picker){

        UI.showToast("FilePicker не встановлено");

        return;

    }

    try{

        const result=await picker.pickFiles({

            multiple:true,
            readData:false

        });

        if(!result.files.length)
            return;

        const videos=[];

        for(const file of result.files){

            const ext=extOf(file.name);

            if(AUDIO_EXT.includes(ext)){

                await addMusic(file);

            }

            else if(VIDEO_EXT.includes(ext)){

                videos.push(file);

            }

        }

        pendingFilesQueue=videos;

        askCategory();

        renderMusic();

        renderCategories();

    }

    catch(e){

        console.error(e);

    }

}

async function addMusic(file){

    await LibraryManager.addMusic(file);

    library=await LibraryManager.loadLibrary();

    UI.showToast("Додано: "+titleFromFilename(file.name));

}

function askCategory(){

    if(!pendingFilesQueue.length){

        LibraryManager.save();

        renderCategories();

        return;

    }

    const file=pendingFilesQueue[0];

    const modal=document.getElementById("category-modal");

    document
        .getElementById("category-modal-filename")
        .textContent=file.name;

    const list=document.getElementById("category-modal-list");

    list.innerHTML="";

    library.categories.forEach(category=>{

        const btn=document.createElement("button");

        btn.textContent=category.title;

        btn.onclick=()=>{

            addVideo(file,category.title);

        };

        list.appendChild(btn);

    });

    modal.classList.add("open");

}
async function addVideo(file, categoryTitle){

    const modal=document.getElementById("category-modal");

    modal.classList.remove("open");

    await LibraryManager.addVideo(
        file,
        categoryTitle
    );

    library=await LibraryManager.loadLibrary();

    pendingFilesQueue.shift();

    renderCategories();

    if(pendingFilesQueue.length){

        askCategory();

    }

    else{

        UI.showToast("Всі файли додано");

    }

}

document
.getElementById("new-category-confirm")
.onclick=()=>{

    const input=document
        .getElementById("new-category-input");

    const name=input.value.trim();

    if(!name){

        UI.showToast("Введіть назву");

        return;

    }

    addVideo(
        pendingFilesQueue[0],
        name
    );

};

document
.getElementById("category-modal-cancel")
.onclick=()=>{

    pendingFilesQueue.shift();

    document
        .getElementById("category-modal")
        .classList
        .remove("open");

    if(pendingFilesQueue.length){

        askCategory();

    }

};

async function syncCloud(){

    UI.showLoading("Перевірка оновлень...");

    try{

        const result=await CloudSync.sync();

        if(result.updated){

            library=await LibraryManager.loadLibrary();

            renderCategories();

            renderMusic();

            UI.showToast(
                "Бібліотеку оновлено"
            );

        }

        else{

            UI.showToast(
                "Оновлень немає"
            );

        }

    }

    catch(e){

        console.error(e);

        UI.showToast(
            "Помилка синхронізації"
        );

    }

    UI.hideLoading();

}

window.addEventListener(

    "online",

    ()=>{

        syncCloud();

    }

);

document
.getElementById("music-seek")
.addEventListener(

    "input",

    e=>{

        Player.seek(

            e.target.value

        );

    }

);

window.addEventListener(

    "beforeunload",

    async()=>{

        await Storage.saveResume(

            Player.getResume()

        );

    }

);

try{

    P().App.addListener(

        "backButton",

        ()=>{

            const active=document.querySelector(
                ".tab-panel.active"
            );

            if(active.id==="episodes"){

                showScreen(
                    "videoCategories"
                );

                return;

            }

            if(active.id==="videoCategories"){

                showScreen("home");

                return;

            }

            document
            .getElementById("exit-overlay")
            .classList
            .add("open");

        }

    );

}
catch(e){}

document
.getElementById("exit-no")
.onclick=()=>{

    document
        .getElementById("exit-overlay")
        .classList
        .remove("open");

};

document
.getElementById("exit-yes")
.onclick=()=>{

    try{

        P().App.exitApp();

    }
    catch(e){}

};

initialize();

console.log(
    "Надійчина бібліотека V2 запущена"
);