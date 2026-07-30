import Storage from "./Storage.js";

export default class LibraryManager {

    static async loadLibrary() {

        let lib = await Storage.get("library");

        if (!lib) {

            lib = {
                categories: [],
                music: []
            };

            await Storage.set("library", lib);

        }

        return lib;

    }

    static async saveLibrary(library) {

        await Storage.set("library", library);

    }

    static async addVideo(file, categoryTitle) {

        const library = await this.loadLibrary();

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

            title: file.title || file.name,

            path: file.path || file.file || ""

        });

        await this.saveLibrary(library);

    }

    static async addMusic(file) {

        const library = await this.loadLibrary();

        library.music.push({

            title: file.title || file.name,

            path: file.path || file.file || ""

        });

        await this.saveLibrary(library);

    }

}