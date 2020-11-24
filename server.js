const express =require('express')
const bodyparser =require('body-parser')
const app =express()
const mongoose = require('mongoose')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const gridFs = require('gridfs-stream')
const crypto = require('crypto')
const path =require('path')
const methodOverid = require('method-override')

const  mongourl =process.env.MONGO_URL
const dbconnection = mongoose.createConnection(mongourl ,{ useNewUrlParser: true, useUnifiedTopology: true})


let gfs;
dbconnection.once('open' ,()=>{
    gfs=gridFs(dbconnection.db ,mongoose.mongo);
    gfs.collection('uploads');
})

app.use(bodyparser.json())
app.use(methodOverid('_method'))
app.set('view engine','ejs')
app.use(express.static('public'))
var storage = new GridFsStorage({
    url:mongourl,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });





app.get('/', async(req, res) => {
   await gfs.files.find()
   .toArray((err,result)=>{
       result.reverse()
       if(err || !result ||  result.length === 0){
        return res.render('feed/index',{title:'File Upload APP' ,result:false })
        }else{



                result.map(file=>{
                    if(file.contentType === 'image/jpeg' ||
                     file.contentType === 'image/jpg' || 
                     file.contentType === 'image/png' ||
                     file.contentType === 'image/gif' 
                   
                      ){
                        file.isImage =true
                    }else{
                        file.isImage =false
                    }
                })
                return res.render('feed/index',{title:'files upload' , result:result})
        }
   })
});

app.post('/post', upload.single('myFile'), (req,res)=>{
    return res.redirect('/')
    
})

app.delete('/post/delete/:id', (req, res) => {
    const id =req.params.id
    gfs.remove({_id:id, root:'uploads'},(err,result)=>{
        if(err || !result){
           return  res.redirect('/')
        }
        return res.redirect('/')
    })
});


app.get('/image/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,result)=>{
        if(!result || result.length === 0){
            return res.status(404).json({
                message:'No File Exists , Try agin'
            })
        }

        if(result.contentType === 'image/jpeg' || result.contentType === 'image/jpg' || result.contentType === 'image/png' || result.contentType === 'image/gif'){
            const readStrem =gfs.createReadStream(result.filename)
            readStrem.pipe(res)
        }else{
            return res.status(404).json({
                message:'No an Image'
            })
        }
    })
})

const port =process.env.PORT || 3000
app.listen(port, () => {
    console.log('App listening on port 3000!');
});