import express from 'express'
import {PORT} from './env.js'

const app= express();

app.get('/',(req, res)=>res.send('<h1>Hello World!</h1>' ));
app.get('/about',(req, res)=>res.send('<h1>Hello About Page!</h1>' ));
// const PORT =process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Server is running at port : http://localhost:${PORT}`);
    
})