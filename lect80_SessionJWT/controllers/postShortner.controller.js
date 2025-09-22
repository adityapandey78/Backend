import crypto from "crypto";
import { loadLinks, saveLinks, getLinkByShortCode } from "../services/shortner.services.js";
import { shortnerSchema } from "../validators/shortner-validator.js";

/**
 * Render the homepage with all shortened links
 */
export const getShortnerpage = async (req, res) => {
    try {
        // Load links for the current user if logged in, otherwise show all links
        const userId = req.user ? req.user.id : null;
        const links = await loadLinks(userId);
        
        // Check if user is logged in via JWT token
        let isLoggedIn = false;
        if (req.cookies && req.cookies.access_token) {
            isLoggedIn = true;
        }

        // Convert Drizzle result format to template-friendly format
        const shortcodesList = links.map(link => ({
            shortCode: link.shortCode,  // Drizzle field name
            url: link.url,
            host: req.get('host'),
            id: link.id
        }));
        
        const result = res.render('index', { 
            links: shortcodesList,
            isLoggedIn: isLoggedIn,
            errors: req.flash("errors")
        });
        
        return result;
    } catch (error) {
        console.error("❌ Error in getShortnerpage:", error);
        return res.status(500).send("Internal Server Error while loading homepage");
    }
};

/**
 * Handle form submission to create new short URL
 */
export const postShortner = async (req, res) => {
    try {
        console.log("📝 POST request received:", req.body);
        const { url, shortCode } = req.body;
        
        // Check if user is authenticated
        if (!req.user) {
            req.flash("errors", "You must be logged in to create short links");
            return res.redirect("/login");
        }
        
        console.log("🔍 Validating with Zod:", { url, shortcode: shortCode });
        // Zod validation - map shortCode to shortcode for schema
        const validation = shortnerSchema.safeParse({ url, shortcode: shortCode });
        if (!validation.success) {
            console.log("❌ Validation failed:", validation.error.issues);
            
            // Simple error extraction - just get the messages
            const errorMessages = validation.error.issues.map(issue => issue.message);
            console.log("📋 Error messages:", errorMessages);
            
            // Flash each error message
            errorMessages.forEach(message => req.flash("errors", message));
            return res.redirect("/");
        }

        console.log("✅ Validation passed");
        // Generate random short code if not provided
        const finalShortCode = shortCode && shortCode.trim() 
            ? shortCode.trim() 
            : crypto.randomBytes(4).toString("hex");
        
        console.log("🔗 Final shortcode:", finalShortCode);
        
        // Check if short code already exists
        const existingLink = await getLinkByShortCode(finalShortCode);
        
        if (existingLink) {
            console.log("⚠️ Shortcode already exists");
            req.flash("errors", "URL with that shortcode already exists, Please choose another");
            return res.redirect("/");
        }

        console.log("💾 Saving to database...");
        // Save the new URL mapping
        await saveLinks(finalShortCode, url, req.user.id);
        
        console.log("✅ Successfully saved");
        return res.redirect("/");
    } catch (error) {
        console.error("❌ Error creating short URL:", error);
        console.error("❌ Error stack:", error.stack);
        
        if (error.message === 'Short code already exists') {
            req.flash("errors", "This short code is already taken. Please choose another.");
            return res.redirect("/");
        }
        
        req.flash("errors", `Internal Server Error: ${error.message}`);
        return res.redirect("/");
    }
};

/**
 * Handle redirection from short code to original URL
 */
export const redirectShortCode = async (req, res) => {
    try {
        const { shortcode } = req.params;
        
        // Find the link by short code
        const link = await getLinkByShortCode(shortcode);
        
        if (!link) {
            return res.status(404).send(`
                <div style="text-align: center; margin-top: 50px;">
                    <h2>404 - Not Found</h2>
                    <p>The short code "${shortcode}" does not exist.</p>
                    <a href="/" style="color: #007bff;">← Go to Homepage</a>
                </div>
            `);
        }

        return res.redirect(link.url);
    } catch (error) {
        console.error("❌ Error in redirectShortCode:", error);
        return res.status(500).send("Internal Server Error while redirecting");
    }
};