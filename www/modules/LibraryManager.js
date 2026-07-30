import Storage from "./Storage.js";

let library = {
    categories: [],
    music: []
};

export default {

    async loadLibrary() {

        library = await Storage.loadLibrary();

        if (!library.categories)
            library.categories = [];

        if (!library.music)
            library.music = [];

        return library;

    },

    async save() {

        await Storage.saveLibrary(library);

    },

    async addMusic(file) {

        const item = {

            title: this.fileTitle(file.name),

            path: file.path,

            type: "music"

        };

        library.music.push(item);

        await this.save();

    },

    async addVideo(file, categoryTitle) {

        let category = library.categories.find(
            c => c.title === categoryTitle
        );

        if (!category) {

            category = {

                title: categoryTitle,

                icon: "🎬",

                episodes: []

            };

            library.categories.push(category);

        }

        category.episodes.push({

            title: this.fileTitle(file.name),

            path: file.path

        });

        await this.save();

    },

    async removeMusic(index) {

        library.music.splice(index, 1);

        await this.save();

    },

    async removeVideo(categoryTitle, episodeIndex) {

        const category = library.categories.find(
            c => c.title === categoryTitle
        );

        if (!category)
            return;

        category.episodes.splice(
            episodeIndex,
            1
        );

        if (category.episodes.length === 0) {

            library.categories =
                library.categories.filter(
                    c => c.title !== categoryTitle
                );

        }

        await this.save();

    },

    async renameCategory(oldName, newName) {

        const category = library.categories.find(
            c => c.title === oldName
        );

        if (!category)
            return;

        category.title = newName;

        await this.save();

    },

    async setCategoryIcon(title, icon) {

        const category = library.categories.find(
            c => c.title === title
        );

        if (!category)
            return;

        category.icon = icon;

        await this.save();

    },

    getLibrary() {

        return library;

    },

    fileTitle(name) {

        const i = name.lastIndexOf(".");

        if (i === -1)
            return name;

        return name.substring(0, i)
            .replace(/_/g, " ")
            .trim();

    }

};