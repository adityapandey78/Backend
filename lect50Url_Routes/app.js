import express from "express";
import router from "./routes/shortner.routes.js";
// Create Express application
const app = express();

const PORT = process.env.PORT || 3002;


// Middleware setup
app.use(express.static("public")); // Serve static files from 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse form submissions

//express router
app.use(router); // Use the router for handling requests

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
