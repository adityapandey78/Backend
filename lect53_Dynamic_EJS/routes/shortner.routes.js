import { Router } from "express";
import { postShortner, getShortnerpage, redirectShortCode } from "../controllers/postShortner.controller.js"; 

const router = Router(); // Create a router instance

// Main page route - displays form and shortened URLs
router.get("/", getShortnerpage);

// Create new shortened URL
router.post('/', postShortner);

// Report route - displays student data
router.get("/report", async (req, res) => {
    const student = [
        {
            name: "John Doe",
            rollNo: "12345",
            branch: "Computer Science",
            year: "2023",
            email: "john.doe@gmail.com"
        },
        {
            name: "Emma Wilson",
            rollNo: "67890",
            branch: "Information Technology",
            year: "2022",
            email: "emma.wilson@gmail.com"
        },
        {
            name: "Michael Chen",
            rollNo: "24680",
            branch: "Electrical Engineering",
            year: "2023",
            email: "michael.chen@gmail.com"
        },
        {
            name: "Sarah Johnson",
            rollNo: "13579",
            branch: "Computer Science",
            year: "2021",
            email: "sarah.johnson@gmail.com"
        },
        {
            name: "Alex Rodriguez",
            rollNo: "98765",
            branch: "Mechanical Engineering",
            year: "2022",
            email: "alex.rodriguez@gmail.com"
        }
    ]
    try {
        res.render('report', { student });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: "Internal Server Error" });
    }
});

// Redirect shortened URLs to their original destinations
router.get("/:shortcode", redirectShortCode); 

const RouterUrl = router;
export default RouterUrl;
