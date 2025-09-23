import { Router } from "express";
import { postShortner, getShortnerpage, redirectShortCode, getShortenerEditPage, updateShortLink ,deletShortCode} from "../controllers/postShortner.controller.js"; 

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
 * Redirect route - redirects short codes to their original URLs
 * This should be last to avoid conflicts with other routes
 */
router.get("/:shortcode", redirectShortCode); 

router.route("/edit/:id")
    .get(getShortenerEditPage)
    .post(updateShortLink);

    router.route("/delete/:id").post(deletShortCode);
export default router;
