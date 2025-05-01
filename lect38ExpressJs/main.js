import express from 'express';
import { PORT } from './env.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();

app.get('/', (req, res) => {
//     Get the directory name properly
    const __filename = fileURLToPath(import.meta.url);
    const __fileName2= new URL(import.meta.url)
    const __dirname = dirname(__filename);
    
    console.log('Directory:', __dirname);
    console.log('File path:', __filename);
    console.log('File URL:', __fileName2);
    
    // console.log(import.meta.url);
    const homePagePath = join(__dirname, 'public', 'index.html');
    
    // res.send('<h1>Hello World from Main Js!</h1>');
    res.sendFile(homePagePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(err.status).end();
        } else {
            console.log('Sent:', homePagePath);
        }
    });

});

app.listen(PORT, () => {
    console.log(`Server is running at port: http://localhost:${PORT}`);
});