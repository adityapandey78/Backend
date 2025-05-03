import { readFile, writeFile } from "fs/promises";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
import { Router } from "express";

const router = Router(); // Create a router instance

const DATA_FILE = path.join("data", "links.json");
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
router.get("/", async (req, res) => {
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
router.post("/", async (req, res) => {
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

// Report route
router.get("/report", async (req, res) => {
    try {
        res.render('report', { message: "hii from the result" });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: "Internal Server Error" });
    }
});

// Redirect shortened URLs to their original destinations
router.get("/:shortcode", async (req, res) => {
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

const RouterUrl = router;
export default RouterUrl;