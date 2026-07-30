export default {

    manifest: null,

    async load() {

        if (this.manifest) {
            return this.manifest;
        }

        try {

            const response = await fetch("manifest.json");

            if (!response.ok) {
                throw new Error("manifest.json не знайдено");
            }

            this.manifest = await response.json();

            return this.manifest;

        }
        catch (e) {

            console.warn("Manifest:", e);

            this.manifest = {
                version: 1,
                videos: [],
                music: [],
                covers: []
            };

            return this.manifest;

        }

    },

    async getVersion() {

        const m = await this.load();

        return m.version || 1;

    },

    async getVideos() {

        const m = await this.load();

        return m.videos || [];

    },

    async getMusic() {

        const m = await this.load();

        return m.music || [];

    },

    async getCovers() {

        const m = await this.load();

        return m.covers || [];

    }

};