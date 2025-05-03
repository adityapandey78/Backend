import express from "express";
import path from 'path';
import RouterUrl from "./routes/shortner.routes.js";
// Create Express application
const app = express();

const PORT = process.env.PORT || 3002;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Middleware setup
app.use(express.static("public")); // Serve static files from 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse form submissions

// app.set("view engine","ejs");

// express router
// app.use(RouterUrl); // Use the router for handling requests

//use the router
app.use('/',RouterUrl)

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
