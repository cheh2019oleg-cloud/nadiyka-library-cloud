const KEY_PREFIX = "nadiyka_";

export default class Storage {

    static async init() {

        return true;

    }

    static async get(key) {

        try {

            const value = localStorage.getItem(KEY_PREFIX + key);

            return value ? JSON.parse(value) : null;

        }

        catch {

            return null;

        }

    }

    static async set(key, value) {

        localStorage.setItem(

            KEY_PREFIX + key,

            JSON.stringify(value)

        );

    }

    static async loadResume() {

        return await this.get("resume") || {};

    }

    static async saveResume(data) {

        await this.set("resume", data);

    }

}