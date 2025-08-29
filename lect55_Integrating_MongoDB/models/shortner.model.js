// import { readFile, writeFile } from "fs/promises";
// import path from "path";

// const DATA_FILE = path.join("data", "links.json");
// /**
//  * Load URL mappings from JSON file
//  * Creates empty file if it doesn't exist
//  */
// export const loadLinks = async () => {
//     try {
//         const data = await readFile(DATA_FILE, "utf-8");
//         return JSON.parse(data);
//     } catch (error) {
//         if (error.code === "ENOENT") {
//             await writeFile(DATA_FILE, JSON.stringify({}));
//             return {};
//         }
//         console.log("Error in loading links", error);
//         throw error;
//     }
// };

// /**
//  * Save URL mappings to JSON file
//  */
// export const saveLinks = async (links) => {
//     try {
//         await writeFile(DATA_FILE, JSON.stringify(links));
//     } catch (error) {
//         console.log("Error in storing the links", error);
//     }
// };

import dbClient from '../config/db-client.js'
import {env} from '../config/env.js'


const db = dbClient.db(env.MONGODB_DATABASE_NAME);
console.log(`Connected to database: ${env.MONGODB_DATABASE_NAME}`);

const shortnerCollection = db.collection("shortners");
console.log("Collection 'shortners' initialized");


export const loadLinks= async()=>{
    try {
        console.log("Loading links from MongoDB...");
        const links = await shortnerCollection.find().toArray();
        console.log(`Found ${links.length} links in database:`, links);
        // Convert array to object format for compatibility with existing controller logic
        const linksObject = {};
        links.forEach(link => {
            linksObject[link.shortCode] = link.url;
        });
        return linksObject;
    } catch (error) {
        console.log("Error loading links:", error);
        return {};
    }
}

export const saveLinks = async (shortCode, url) => {
    try {
        console.log(`Attempting to save: ${shortCode} -> ${url}`);
        const linkDoc = {
            shortCode: shortCode,
            url: url,
            createdAt: new Date()
        };
        const savedLink = await shortnerCollection.insertOne(linkDoc);
        console.log("Successfully saved to MongoDB:", savedLink);
        return savedLink;
    } catch (error) {
        console.log("Error in storing the link:", error);
        throw error;
    }
};

export const getLinkByShortCode= async (shortCode)=>{
    try {
        return await shortnerCollection.findOne({shortCode: shortCode});
    } catch (error) {
        console.log("Error finding link by shortcode:", error);
        return null;
    }
}