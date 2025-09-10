import crypto from "crypto";
import { loadLinks, saveLinks, getLinkByShortCode } from "../services/shortner.services.js";

/**
 * Render the homepage with all shortened links
 */
export const getShortnerpage = async (req, res) => {
    try {
        console.log("🏠 Loading homepage, fetching links...");
        
        // Load all links from MySQL database
        const links = await loadLinks();
        console.log("Fetched all the link data successfully...");
        
        // console.log(`📊 Loaded ${links.length} links from database`);
        // console.log("Raw links data:", JSON.stringify(links, null, 2));

        /*let isLoggedIn=req.headers.cookie;
        isLoggedIn= Boolean(isLoggedIn
                           ?.split(";")
                            ?.find((cookie)=>cookie.trim().startsWith("isLoggedIn")) // isse bs useful data hi console hoga
                            ?.split("=")[1]);//isse bs true console hoga
                            
                            */
        // Check if user is logged in via JWT token
        let isLoggedIn = false;
        if (req.cookies && req.cookies.access_token) {
            // If access_token exists, user is logged in
            isLoggedIn = true;
        }
        // Alternative: Use req.user if you have the middleware applied
        // let isLoggedIn = req.user ? true : false;
        
        console.log("getShortnerPage::::: IsLoggedIn::::",isLoggedIn);
        console.log("Available cookies:", req.cookies);
        /**
         * <%# 
        <% if(isLoggedIn){ %>
        <h2>You are logged in</h2>
        <%} else{ %>
        <p>You are not logged in</p>
        <%}%>
        %> // I have used this in index.ejs to check with cookies if the user is logged in or not
         */

        // Convert Drizzle result format to template-friendly format
        const shortcodesList = links.map(link => ({
            shortCode: link.shortCode,  // Drizzle field name
            url: link.url,
            host: req.get('host'),
            id: link.id
        }));
        
        // console.log("🎨 Processed shortcodes list:", JSON.stringify(shortcodesList, null, 2));
        console.log("🎨 Rendering homepage with shortcodes");
        const result = res.render('index', { 
            links: shortcodesList,
            isLoggedIn: isLoggedIn //passing the isLoggedin 
        });
        
        console.log("📊 Rendered data:", {
            //links: shortcodesList,
            isLoggedIn: isLoggedIn
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
        
        // Validate URL
        if (!url || !url.trim()) {
            console.log("❌ URL is required");
            return res.status(400).send("URL is required");
        }

        // Generate random short code if not provided
        const finalShortCode = shortCode && shortCode.trim() 
            ? shortCode.trim() 
            : crypto.randomBytes(4).toString("hex");
        
        console.log(`🔄 Processing: URL=${url}, ShortCode=${finalShortCode}`);
        
        // Check if short code already exists
        console.log("🔍 Checking for existing shortcode...");
        const existingLink = await getLinkByShortCode(finalShortCode);
        
        if (existingLink) {
            console.log("⚠️ Shortcode already exists:", existingLink);
            return res.status(400).send(`
                <div style="text-align: center; margin-top: 50px;">
                    <h2>❌ Short code already exists!</h2>
                    <p>The short code "${finalShortCode}" is already in use.</p>
                    <a href="/" style="color: #007bff;">← Go Back</a>
                </div>
            `);
        }

        // Save the new URL mapping
        console.log("💾 Saving new link to MySQL database with Prisma...");
        const result = await saveLinks(finalShortCode, url);
        
        console.log("✅ Save successful! New link:", result);
        console.log(`🎉 Successfully created: ${finalShortCode} -> ${url}`);
        
        return res.redirect("/");
    } catch (error) {
        console.error("❌ Error creating short URL:", error);
        
        if (error.message === 'Short code already exists') {
            return res.status(400).send(`
                <div style="text-align: center; margin-top: 50px;">
                    <h2>❌ Duplicate short code!</h2>
                    <p>This short code is already taken. Please choose another.</p>
                    <a href="/" style="color: #007bff;">← Go Back</a>
                </div>
            `);
        }
        
        return res.status(500).send("Internal Server Error while creating short URL");
    }
};

/**
 * Handle redirection from short code to original URL
 */
export const redirectShortCode = async (req, res) => {
    try {
        const { shortcode } = req.params;
        console.log(`🔗 Redirect request for short code: ${shortcode}`);
        
        // Find the link by short code
        const link = await getLinkByShortCode(shortcode);
        
        if (!link) {
            console.log("❌ Short code not found:", shortcode);
            return res.status(404).send(`
                <div style="text-align: center; margin-top: 50px;">
                    <h2>404 - Not Found</h2>
                    <p>The short code "${shortcode}" does not exist.</p>
                    <a href="/" style="color: #007bff;">← Go to Homepage</a>
                </div>
            `);
        }

        console.log(`✅ Redirecting ${shortcode} -> ${link.url}`);
        return res.redirect(link.url);
    } catch (error) {
        console.error("❌ Error in redirectShortCode:", error);
        return res.status(500).send("Internal Server Error while redirecting");
    }
};