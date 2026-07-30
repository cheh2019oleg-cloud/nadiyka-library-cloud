const MANIFEST_URL =
"https://raw.githubusercontent.com/cheh2019oleg-cloud/nadiyka-library-cloud/v2-cloud/cloud/manifest.json";

export default class Manifest{

    static async load(){

        try{

            const r=await fetch(MANIFEST_URL,{
                cache:"no-cache"
            });

            if(!r.ok)
                throw new Error("manifest");

            return await r.json();

        }

        catch(e){

            console.error(e);

            return{
                version:1,
                categories:[],
                music:[]
            };

        }

    }

}