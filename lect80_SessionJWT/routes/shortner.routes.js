import { Router } from "express";
import { postShortner, getShortnerpage, redirectShortCode } from "../controllers/postShortner.controller.js"; 

// Create router instance
const router = Router();

/**
 * Homepage route - displays the URL shortener form and list of shortened URLs
 */
router.get("/", getShortnerpage);

/**
 * Create new shortened URL - handles form submission
 */
router.post('/', postShortner);

/**
 * Demo report route - displays sample student data (for demonstration purposes)
 */
// router.get("/report", async (req, res) => {
//     console.log("📊 Accessing report page");
    
//     const students = [
//         {
//             name: "John Doe",
//             rollNo: "12345",
//             branch: "Computer Science",
//             year: "2023",
//             email: "john.doe@gmail.com"
//         },
//         {
//             name: "Emma Wilson",
//             rollNo: "67890",
//             branch: "Information Technology",
//             year: "2022",
//             email: "emma.wilson@gmail.com"
//         },
//         {
//             name: "Michael Chen",
//             rollNo: "24680",
//             branch: "Electrical Engineering",
//             year: "2023",
//             email: "michael.chen@gmail.com"
//         },
//         {
//             name: "Sarah Johnson",
//             rollNo: "13579",
//             branch: "Computer Science",
//             year: "2021",
//             email: "sarah.johnson@gmail.com"
//         },
//         {
//             name: "Alex Rodriguez",
//             rollNo: "98765",
//             branch: "Mechanical Engineering",
//             year: "2022",
//             email: "alex.rodriguez@gmail.com"
//         }
//     ];
    
//     try {
//         console.log("✅ Rendering report page with student data");
//         res.render('report', { student: students });
//     } catch (error) {
//         console.error("❌ Error rendering report page:", error);
//         res.status(500).send("Internal Server Error while loading report page");
//     }
// });

/**
 * Redirect route - redirects short codes to their original URLs
 * This should be last to avoid conflicts with other routes
 */
router.get("/:shortcode", redirectShortCode); 

export default router;
