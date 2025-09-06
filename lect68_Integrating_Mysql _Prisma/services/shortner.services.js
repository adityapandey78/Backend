import { prisma } from "../config/db-client.js";

export const loadLinks=async ()=>{
    // Previous MySQL code (commented out)
    // const [rows] = await db.execute("SELECT * FROM short_links ORDER BY id DESC");
    // return rows;
    
    const allShortLinks = await prisma.shortlink.findMany({
        orderBy: { id: 'desc' }
    });
    return allShortLinks;
}

export const getLinkByShortCode = async(shortcode)=>{
    // Previous MySQL code (commented out)
    // const [rows] = await db.execute(
    //     "SELECT * FROM short_links WHERE short_code = ?", 
    //     [shortCode]
    // );
    
    const shortLink = await prisma.shortlink.findUnique({
        where: { shortCode: shortcode }
    });
    return shortLink; 
}

export const saveLinks = async (shortCode, url) => {
    try {
        console.log(`💾 Attempting to save: ${shortCode} -> ${url}`);
        
        const newShortLink = await prisma.shortlink.create({
            data: { shortCode, url }
        });
        
        console.log("✅ Successfully saved to MySQL database with Prisma");
        return newShortLink;
        
    } catch (error) {
        console.error("❌ Error saving link to database:", error);
        
        // Check if it's a Prisma unique constraint error
        if (error.code === 'P2002') {
            throw new Error('Short code already exists');
        }
        
        throw error;
    }
};