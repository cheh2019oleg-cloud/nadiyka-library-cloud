let toastTimer = null;

export default {

    init() {

        this.toast =
            document.getElementById("toast");

        this.status =
            document.getElementById("status-line");

        this.loading =
            document.getElementById("loading-overlay");

    },

    showToast(text) {

        if (!this.toast)
            return;

        this.toast.textContent = text;

        this.toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {

            this.toast.classList.remove("show");

        }, 2500);

    },

    showLoading(text = "Завантаження...") {

        if (!this.loading)
            return;

        this.loading.classList.add("open");

        const label =
            this.loading.querySelector(".loading-text");

        if (label)
            label.textContent = text;

    },

    hideLoading() {

        if (!this.loading)
            return;

        this.loading.classList.remove("open");

    },

    setLoadingProgress(percent) {

        if (!this.loading)
            return;

        const progress =
            this.loading.querySelector(".loading-progress");

        if (progress)
            progress.textContent = percent + "%";

    },

    setMusicTitle(title) {

        const el =
            document.getElementById("music-title");

        if (el)
            el.textContent = title;

    },

    setStatus(text) {

        if (this.status)
            this.status.textContent = text;

    }

};