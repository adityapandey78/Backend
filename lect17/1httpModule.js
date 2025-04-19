const http = require('http');

// const server = http.createServer();
//http server is a built-in module in node.js which is used to create a server, it is also an event emitter


//web server
const server= http.createServer((req,res)=>{
    if(req.url==='/'){
        res.write("I am aditya Pandey");
        res.end();
    }

    if(req.url==='/hello'){
        res.setHeader('Content-Type','text/plain');
        res.write("lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatibus.");

        res.end();
    }
    if(req.url==='/hii'){
        res.write("Jai Hanuman gyan gyan gun sagar, Jai Kapis Tihun lok ujagar.");
        res.end();
    }
})
const PORT =3000;

server.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})