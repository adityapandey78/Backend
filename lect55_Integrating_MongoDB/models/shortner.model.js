import { readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_FILE = path.join("data", "links.json");
/**
 * Load URL mappings from JSON file
 * Creates empty file if it doesn't exist
 */
export const loadLinks = async () => {
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
export const saveLinks = async (links) => {
    try {
        await writeFile(DATA_FILE, JSON.stringify(links));
    } catch (error) {
        console.log("Error in storing the links", error);
    }
};
