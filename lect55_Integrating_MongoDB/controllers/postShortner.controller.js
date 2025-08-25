import crypto from "crypto";
import { loadLinks,saveLinks } from "../models/shortner.model.js";




 export const getShortnerpage= async (req, res) => {
    try {
        const links = await loadLinks();
        console.log("Links:", links);

        // Render the EJS template with links data
        const shortcodesList = Object.entries(links)
            .map(([shortCode, url]) => ({ shortCode, url, host: req.get('host') }));
        
        return res.render('index', { links: shortcodesList });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error in the app.get");
    }
}

export const postShortner = async (req,res) => {
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
}

export const redirectShortCode= async (req, res) => {
    try {
        const shortCode = req.params.shortcode;
        const links = await loadLinks();
        
        if (!links[shortCode]) return res.status(404).send("404 Not Found");

        return res.redirect(links[shortCode]);
    } catch (error) {
        console.log("Error in redirecting", error);
        return res.status(500).send("Internal Server Error in the redirecting file");
    }
}