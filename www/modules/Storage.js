export default {

    async init() {

        this.preferences =
            window.Capacitor?.Plugins?.Preferences;

    },

    async loadResume() {

        try {

            const r = await this.preferences.get({
                key: "resumeMap"
            });

            return r.value
                ? JSON.parse(r.value)
                : {};

        }

        catch {

            return {};

        }

    },

    async saveResume(map) {

        try {

            await this.preferences.set({

                key: "resumeMap",

                value: JSON.stringify(map)

            });

        }

        catch(e){

            console.error(e);

        }

    },

    async saveLibrary(library){

        try{

            await this.preferences.set({

                key:"library",

                value:JSON.stringify(library)

            });

        }

        catch(e){

            console.error(e);

        }

    },

    async loadLibrary(){

        try{

            const r=await this.preferences.get({

                key:"library"

            });

            return r.value
                ? JSON.parse(r.value)
                : {

                    categories:[],

                    music:[]

                };

        }

        catch{

            return{

                categories:[],

                music:[]

            };

        }

    }

}