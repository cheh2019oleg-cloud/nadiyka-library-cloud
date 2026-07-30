const MANIFEST_URL =
"https://raw.githubusercontent.com/cheh2019oleg-cloud/nadiyka-library-cloud/main/manifest.json";

export default {

    manifest:null,

    async initialize(){

        try{

            await this.loadManifest();

        }

        catch(e){

            console.error(e);

        }

    },

    async loadManifest(){

        const response=await fetch(

            MANIFEST_URL,

            {

                cache:"no-cache"

            }

        );

        if(!response.ok){

            throw new Error(
                "Не вдалося завантажити manifest"
            );

        }

        this.manifest=
            await response.json();

        return this.manifest;

    },

    async sync(){

        const remote=
            await this.loadManifest();

        let localVersion=1;

        try{

            localVersion=parseInt(

                localStorage.getItem(
                    "manifestVersion"
                )||"1"

            );

        }

        catch(e){}

        if(remote.version<=localVersion){

            return{

                updated:false,

                manifest:remote

            };

        }

        localStorage.setItem(

            "manifestVersion",

            remote.version

        );

        return{

            updated:true,

            manifest:remote

        };

    },

    async getManifest(){

        if(!this.manifest){

            await this.loadManifest();

        }

        return this.manifest;

    },

    async getVersion(){

        const m=
            await this.getManifest();

        return m.version||1;

    }

};