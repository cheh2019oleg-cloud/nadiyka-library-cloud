let videoPlayer = null;
let audioPlayer = null;

let resumeMap = {};

export default {

    async playVideo(video, resume) {

        resumeMap = resume || {};

        videoPlayer = document.getElementById("video-player");

        document.getElementById("video-title").textContent =
            video.title;

        videoPlayer.src = video.path;

        videoPlayer.load();

        videoPlayer.onloadedmetadata = () => {

            if (resumeMap[video.path]) {

                videoPlayer.currentTime =
                    resumeMap[video.path];

            }

            videoPlayer.play();

        };

        videoPlayer.ontimeupdate = () => {

            resumeMap[video.path] =
                videoPlayer.currentTime;

        };

        document
            .getElementById("video-overlay")
            .classList
            .add("open");

    },

    async stopVideo() {

        if (!videoPlayer)
            return;

        videoPlayer.pause();

        videoPlayer.removeAttribute("src");

        videoPlayer.load();

        document
            .getElementById("video-overlay")
            .classList
            .remove("open");

    },

    async playMusic(song) {

        if (!audioPlayer)
            audioPlayer =
                document.getElementById("audio-player");

        audioPlayer.src = song.path;

        await audioPlayer.play();

        document
            .getElementById("music-play")
            .textContent = "⏸";

    },

    toggleMusic() {

        if (!audioPlayer)
            return;

        if (audioPlayer.paused) {

            audioPlayer.play();

            document
                .getElementById("music-play")
                .textContent = "⏸";

        } else {

            audioPlayer.pause();

            document
                .getElementById("music-play")
                .textContent = "▶";

        }

    },

    seek(percent) {

        if (!audioPlayer)
            return;

        if (!audioPlayer.duration)
            return;

        audioPlayer.currentTime =
            audioPlayer.duration *
            (percent / 100);

    },

    getResume() {

        return resumeMap;

    }

};