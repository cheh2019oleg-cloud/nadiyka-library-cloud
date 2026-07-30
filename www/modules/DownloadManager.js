const DOWNLOAD_ROOT =
"https://raw.githubusercontent.com/cheh2019oleg-cloud/nadiyka-library-cloud/main/";

export default {

    async download(url,onProgress){

        const response=await fetch(url);

        if(!response.ok){

            throw new Error("Помилка завантаження");

        }

        const total=
            Number(
                response.headers.get("Content-Length")
            )||0;

        const reader=
            response.body.getReader();

        let received=0;

        const chunks=[];

        while(true){

            const {done,value}=

                await reader.read();

            if(done) break;

            chunks.push(value);

            received+=value.length;

            if(total && onProgress){

                onProgress(

                    Math.floor(
                        received*100/total
                    )

                );

            }

        }

        return new Blob(chunks);

    },

    async downloadManifestFile(path,onProgress){

        return await this.download(

            DOWNLOAD_ROOT+path,

            onProgress

        );

    },

    async downloadVideo(file,onProgress){

        return await this.download(

            DOWNLOAD_ROOT+
            "cartoons/"+
            file,

            onProgress

        );

    },

    async downloadMusic(file,onProgress){

        return await this.download(

            DOWNLOAD_ROOT+
            "music/"+
            file,

            onProgress

        );

    },

    async downloadCover(file,onProgress){

        return await this.download(

            DOWNLOAD_ROOT+
            "covers/"+
            file,

            onProgress

        );

    }

};