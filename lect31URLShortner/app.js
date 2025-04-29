import { readFile } from 'fs/promises';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = 3002;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer(async (req, res) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        return res.end('Method not allowed');
    }

    // Security: Prevent directory traversal
    const sanitizedPath = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(__dirname, 'public', sanitizedPath);

    // Default to index.html if root path
    if (sanitizedPath === '/') {
        filePath = path.join(__dirname, 'public', 'index.html');
    } else if(sanitizedPath === '/style.css') {
        filePath = path.join(__dirname, 'public', 'style.css');
    }

    try {
        const data = await readFile(filePath);
        
        // Set content type based on file extension
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
        }[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        return res.end(data);
    } catch (err) {
        console.error(`Error serving ${req.url}:`, err);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return res.end('<h1>404 Not Found</h1>');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});



// import { readFile } from 'fs/promises';
// import { createServer } from 'http';
// import path from 'path';

// const PORT = 3002;

// const serverFile = async (req, res, filePath, contentType) => {
//     try {
//         const data = await readFile(filePath);
//         res.writeHead(200, { 'Content-Type': contentType });
//         res.end(data);
//     } catch (error) {
//         console.error(`Error serving ${req.url}:`, error); // Fixed: Use req.url
//         res.writeHead(404, { 'Content-Type': 'text/html' });
//         res.end('<h1>404 Not Found</h1>');
//     }
// };

// const server = createServer(async (req, res) => {
//     console.log(`Request URL: ${req.url}`);

//     if (req.method === 'GET') {
//         if (req.url === '/') {
//             return serverFile(
//                 req,
//                 res,
//                 path.join(__dirname, 'public', 'index.html'), // Fixed: Use __dirname
//                 'text/html'
//             );
//         } else if (req.url === '/style.css') {
//             return serverFile(
//                 req,
//                 res,
//                 path.join(__dirname, 'public', 'style.css'), // Fixed: Use __dirname
//                 'text/css'
//             );
//         } else {
//             // Fixed: Handle unhandled routes
//             res.writeHead(404, { 'Content-Type': 'text/html' });
//             res.end('<h1>404 Not Found</h1>');
//         }
//     } else {
//         // Fixed: Handle unsupported methods
//         res.writeHead(405, { 'Content-Type': 'text/html' });
//         res.end('<h1>405 Method Not Allowed</h1>');
//     }
// });

// server.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });