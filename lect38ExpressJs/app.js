import express from 'express'
import {PORT} from './env.js'
import path from 'path'
import { log } from 'console';

const app= express();

// app.get('/',(req, res)=>res.send('<h1>Hello World!</h1>' ));
// app.get('/about',(req, res)=>res.send('<h1>Hello About Page!</h1>' ));
// const PORT =process.env.PORT || 3000;
// app.listen(PORT,()=>{
//     console.log(`Server is running at port : http://localhost:${PORT}`);
    
// })

/**
 * this is the code for the form submission
 */

 const staticPath = path.join(import.meta.dirname, 'public');
 app.use(express.static(staticPath));// taking the sttaic data 
 app.use(express.urlencoded({extended:true})); //using the meothod of post 
 //:url encoder is a middleware that parses incoming requests with urlencoded payloads and is based on body-parser.
 //? it is used to parse the data from the form submission and make it available in req.body
 //* extended:true is a good way to parse the input into an object

//  app.get('/contact', (req,res)=>{
//     console.log('This is the form submission page');
//     res.redirect('/');
//  })
// this was using the get method
app.post('/contact',(req,res)=>{
    console.log('This is the form submission page');
    console.log(req.body);
    res.redirect('/');
})

 app.listen(PORT,()=>{
    log(`Server is running at port : http://localhost:${PORT}`);
 })

//  app.use(( req, res)=>{
    // return res.status(404).send('<h1>404 Page Not Found</h1>'); //used for senfing only text]
    //let's send teh file
// })
app.use((req,res)=>{
    return res.status(404).sendFile(path.join(import.meta.dirname, 'views', '404.html'));
    //return the file
})
// return res.status(404).sendFile