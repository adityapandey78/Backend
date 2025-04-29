import { log } from "console";
import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const PORT = 3002;
const DATA_FILE = path.join("data", "link.json");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(url, JSON.stringify({}));
      //in case jab wo link create hi na hhui ho tb
      return {};
    }
    console.log("Error in loading links", error);
    throw error;
  }
};
const saveLinks = async (links) => {
  try {
    await writeFile(DATA_FILE, JSON.stringify(links));
  } catch (error) {
    console.log("Error in storing the links", error);
  }
};
const server = createServer(async (req, res) => {
  // Only handle GET requests
  if (req.method === "GET") {
    // Security: Prevent directory traversal
    const sanitizedPath = req.url.split("?")[0].split("#")[0];
    let filePath = path.join(__dirname, "public", sanitizedPath);

    // Default to index.html if root path
    if (sanitizedPath === "/") {
      filePath = path.join(__dirname, "public", "index.html");
    } else if (sanitizedPath === "/style.css") {
      filePath = path.join(__dirname, "public", "style.css");
    }

    try {
      const data = await readFile(filePath);

      // Set content type based on file extension
      const ext = path.extname(filePath);
      const contentType =
        {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
        }[ext] || "text/plain";

      res.writeHead(200, { "Content-Type": contentType });
      return res.end(data);
    } catch (err) {
      console.error(`Error serving ${req.url}:`, err);
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end("<h1>404 Not Found</h1>");
    }
  } else if (req.method === "POST" && req.url === "/shorten") {
    const links = await loadLinks();
    let body = "";
    req.on("data", (chunk) => 
      //jab tk request on rahe data send krterho and add kr do chunk me
      (body += chunk)
    );

    req.on("end", async () => {
      console.log(body);
      const { url, shortCode } = JSON.parse(body); //url and shortcode ko JSON me creat kr diya

      if (!url || !shortCode) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "URL and shortCode are required" })
        );
      }
      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex"); //if shortCode is not provided then create random code
      //checking for duplicates
      //if that eexits already on the fike
      if (links[finalShortCode]) {
        res.writeHead(409, { "Content-Type": "text/plain" });
        return res.end("This URL already exists. Please choose another.");
      }

      links[finalShortCode] = url; //it stores the data into the file
      await saveLinks(links);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: True, shortCode: finalShortCode }));
    });
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    return res.end("Method not allowed");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});