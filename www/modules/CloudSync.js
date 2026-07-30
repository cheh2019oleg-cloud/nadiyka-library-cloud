import Manifest from "./Manifest.js";
import LibraryManager from "./LibraryManager.js";

export default class CloudSync {

    static async initialize() {

        return await this.sync(false);

    }

    static async sync(showLog = true) {

        const cloud = await Manifest.load();

        const local = await LibraryManager.loadLibrary();

        let updated = false;

        if (cloud.categories) {

            cloud.categories.forEach(category => {

                const exists = local.categories.find(c => c.title === category.title);

                if (!exists) {

                    local.categories.push(category);

                    updated = true;

                }

            });

        }

        if (cloud.music) {

            cloud.music.forEach(song => {

                const exists = local.music.find(m => m.title === song.title);

                if (!exists) {

                    local.music.push(song);

                    updated = true;

                }

            });

        }

        if (updated) {

            await LibraryManager.saveLibrary(local);

        }

        if (showLog) {

            console.log("Cloud Sync:", updated ? "UPDATED" : "NO UPDATES");

        }

        return {

            updated,

            manifest: cloud

        };

    }

}