import { readFile, writeFile } from "fs/promises";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import express from "express";

// Create Express application
const app = express();

const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join("data", "links.json");

// Middleware setup
app.use(express.static("public")); // Serve static files from 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse form submissions

/**
 * Load URL mappings from JSON file
 * Creates empty file if it doesn't exist
 */
const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        console.log("Error in loading links", error);
        throw error;
    }
};

/**
 * Save URL mappings to JSON file
 */
const saveLinks = async (links) => {
    try {
        await writeFile(DATA_FILE, JSON.stringify(links));
    } catch (error) {
        console.log("Error in storing the links", error);
    }
};

// Route handlers
// Home page: Displays the form and list of shortened URLs
app.get("/", async (req, res) => {
    try {
        const file = await fs.readFile(path.join("views", "index.html"));
        const links = await loadLinks();
        console.log("Links:", links);

        // Replace placeholder with the list of shortened URLs
        const content = file.toString().replaceAll(
            "{{shortened_urls}}",
            Object.entries(links)
                .map(
                    ([shortCode, url]) =>
                        `<li> <a href="/${shortCode}" target ="_blank">${req.host}/${shortCode} </a>-> ${url}</li>`
                )
                .join("")
        );
        return res.send(content);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error in the app.get");
    }
});

// Create new shortened URL
app.post("/", async (req, res) => {
    try {
        const { url, shortCode } = req.body;
        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex"); // Generate random code if not provided
        const links = await loadLinks();
        
        // Check for duplicates
        if (links[finalShortCode]) {
            return res
                .status(400)
                .send("This URL already exists. Please choose another.");
        }

        // Save the new URL mapping
        links[finalShortCode] = url;
        await saveLinks(links);
        return res.redirect("/");
    } catch (error) {
        console.error("Error creating short URL", error);
        return res.status(500).send("Internal Server Error");
    }
});

// Redirect shortened URLs to their original destinations
app.get("/:shortcode", async (req, res) => {
    try {
        const shortCode = req.params.shortcode;
        const links = await loadLinks();
        
        if (!links[shortCode]) return res.status(404).send("404 Not Found");

        return res.redirect(links[shortCode]);
    } catch (error) {
        console.log("Error in redirecting", error);
        return res.status(500).send("Internal Server Error in the redirecting file");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
