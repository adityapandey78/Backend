import { db } from '../config/db-client.js';
import { eq, desc } from 'drizzle-orm';
import { short_links } from '../drizzle/schema.js';

// Get all links, newest first
export const loadLinks = async () => {
    try {
        const rows = await db.select().from(short_links).orderBy(desc(short_links.id));
        return rows;
    } catch (error) {
        console.error("Error loading links from database:", error);
        return [];
    }
};

// Save a new short link
export const saveLinks = async (shortCode, url) => {
    try {
        const result = await db.insert(short_links).values({ shortCode, url });
        return result;
    } catch (error) {
        console.error("Error saving link to database:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Short code already exists');
        }
        throw error;
    }
};

// Find a link by its short code
export const getLinkByShortCode = async (shortCode) => {
    try {
        const rows = await db.select().from(short_links).where(eq(short_links.shortCode, shortCode));
        return rows[0] || null;
    } catch (error) {
        console.error("Error finding link by short code:", error);
        return null;
    }
};

// Delete a link by its short code
export const deleteLinkByShortCode = async (shortCode) => {
    try {
        const result = await db.delete(short_links).where(eq(short_links.shortCode, shortCode));
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error deleting link:", error);
        return false;
    }
};

// Update a link's URL by its short code
export const updateLinkByShortCode = async (shortCode, newUrl) => {
    try {
        const result = await db.update(short_links).set({ url: newUrl }).where(eq(short_links.shortCode, shortCode));
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error updating link:", error);
        return false;
    }
};