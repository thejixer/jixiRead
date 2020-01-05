import { createWriteStream, unlink } from 'fs'

export const storeUpload = ({ stream, filename, myFileName}) => 
new Promise((resolve,reject) => 
stream
    .pipe(createWriteStream(`./src/public/UserAvatars/${myFileName}.jpg`))
    .on('finish', () => resolve())
    .on('error', reject)
);


export const ArticlePictureUpload = ({ stream, filename, myFileName}) => 
new Promise((resolve,reject) => 
stream
    .pipe(createWriteStream(`./src/public/ArticleRelated/${myFileName}.jpg`))
    .on('finish', () => resolve())
    .on('error', reject)
);


export const deleteFile = path => {
    unlink(path, err => {
        if (err) {
          console.error(err)
          return
        }
      
        //file removed
      })
}


