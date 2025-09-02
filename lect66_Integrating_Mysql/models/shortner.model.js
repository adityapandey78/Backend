import { db } from '../config/db-client.js';

/**
 * Load all shortened links from MySQL database
 * @returns {Array} Array of link objects
 */
export const loadLinks = async () => {
    try {
        console.log("📡 Loading links from MySQL database...");
        
        // Execute SELECT query to get all links - order by ID since created_at doesn't exist
        const [rows] = await db.execute("SELECT * FROM short_links ORDER BY id DESC");
        
        console.log(`✅ Found ${rows.length} links in database`);
        
        return rows;
    } catch (error) {
        console.error("❌ Error loading links from database:", error);
        return [];
    }
};

/**
 * Save a new short link to MySQL database
 * @param {string} shortCode - The short code for the URL
 * @param {string} url - The original URL to be shortened
 * @returns {Object} Insert result from database
 */
export const saveLinks = async (shortCode, url) => {
    try {
        console.log(`💾 Attempting to save: ${shortCode} -> ${url}`);
        
        // Execute INSERT query with prepared statement to prevent SQL injection
        const [result] = await db.execute(
            "INSERT INTO short_links (short_code, url) VALUES (?, ?)",
            [shortCode, url]
        );
        
        console.log("✅ Successfully saved to MySQL database");
        console.log(`📊 Insert ID: ${result.insertId}, Affected Rows: ${result.affectedRows}`);
        
        return result;
    } catch (error) {
        console.error("❌ Error saving link to database:", error);
        
        // Check if it's a duplicate entry error
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Short code already exists');
        }
        
        throw error;
    }
};

/**
 * Find a link by its short code
 * @param {string} shortCode - The short code to search for
 * @returns {Object|null} Link object if found, null otherwise
 */
export const getLinkByShortCode = async (shortCode) => {
    try {
        console.log(`🔍 Searching for short code: ${shortCode}`);
        
        // Execute SELECT query with prepared statement
        const [rows] = await db.execute(
            "SELECT * FROM short_links WHERE short_code = ?", 
            [shortCode]
        );
        
        if (rows.length > 0) {
            console.log("✅ Link found:", rows[0]);
            return rows[0];
        } else {
            console.log("❌ No link found for short code:", shortCode);
            return null;
        }
    } catch (error) {
        console.error("❌ Error finding link by short code:", error);
        return null;
    }
};

/**
 * Delete a link by its short code
 * @param {string} shortCode - The short code to delete
 * @returns {boolean} True if deleted, false otherwise
 */
export const deleteLinkByShortCode = async (shortCode) => {
    try {
        console.log(`🗑️ Attempting to delete short code: ${shortCode}`);
        
        const [result] = await db.execute(
            "DELETE FROM short_links WHERE short_code = ?",
            [shortCode]
        );
        
        if (result.affectedRows > 0) {
            console.log("✅ Link deleted successfully");
            return true;
        } else {
            console.log("❌ No link found to delete");
            return false;
        }
    } catch (error) {
        console.error("❌ Error deleting link:", error);
        return false;
    }
};

/**
 * Update a link's URL by its short code
 * @param {string} shortCode - The short code to update
 * @param {string} newUrl - The new URL
 * @returns {boolean} True if updated, false otherwise
 */
export const updateLinkByShortCode = async (shortCode, newUrl) => {
    try {
        console.log(`📝 Updating short code ${shortCode} with new URL: ${newUrl}`);
        
        const [result] = await db.execute(
            "UPDATE short_links SET url = ?, updated_at = CURRENT_TIMESTAMP WHERE short_code = ?",
            [newUrl, shortCode]
        );
        
        if (result.affectedRows > 0) {
            console.log("✅ Link updated successfully");
            return true;
        } else {
            console.log("❌ No link found to update");
            return false;
        }
    } catch (error) {
        console.error("❌ Error updating link:", error);
        return false;
    }
};