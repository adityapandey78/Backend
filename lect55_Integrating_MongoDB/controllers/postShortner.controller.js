import crypto from "crypto";
import { loadLinks,saveLinks, getLinkByShortCode } from "../models/shortner.model.js";

 


 export const getShortnerpage= async (req, res) => {
    try {
        console.log("Loading homepage, fetching links...");
        const links = await loadLinks();
        console.log("Links loaded:", links);

        // Render the EJS template with links data
        const shortcodesList = Object.entries(links)
            .map(([shortCode, url]) => ({ shortCode, url, host: req.get('host') }));
        
        console.log("Rendering page with shortcodes:", shortcodesList);
        return res.render('index', { links: shortcodesList });
    } catch (error) {
        console.error("Error in getShortnerpage:", error);
        return res.status(500).send("Internal Server Error in the app.get");
    }
}

export const postShortner = async (req,res) => {
    try {
        console.log("POST request received:", req.body);
        const { url, shortCode } = req.body;
        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex"); 
        console.log(`Processing: URL=${url}, ShortCode=${finalShortCode}`);
        
        // Check for duplicates using the new MongoDB function
        console.log("Checking for existing shortcode...");
        const existingLink = await getLinkByShortCode(finalShortCode);
        if (existingLink) {
            console.log("Shortcode already exists:", existingLink);
            return res
                .status(400)
                .send("This short code already exists. Please choose another.");
        }

        // Save the new URL mapping with individual parameters
        console.log("Saving new link to MongoDB...");
        const result = await saveLinks(finalShortCode, url);
        console.log("Save result:", result);
        console.log(`Successfully saved: ${finalShortCode} -> ${url}`);
        return res.redirect("/");
    } catch (error) {
        console.error("Error creating short URL:", error);
        return res.status(500).send("Internal Server Error");
    }
}

export const redirectShortCode= async (req, res) => {
    try {
        const { shortcode } = req.params; // Note: it's 'shortcode' in the URL parameter
        const link = await getLinkByShortCode(shortcode);
        
        if(!link) {
            return res.status(404).send("404 Not Found");
        }

        return res.redirect(link.url);
    } catch (error) {
        console.log("Error in redirecting", error);
        return res.status(500).send("Internal Server Error in the redirecting file");
    }
}