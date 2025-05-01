### Process:  
The `process` object is a global variable in Node.js that provides information about, and control over, the current Node.js process. It allows access to environment variables, command-line arguments, and provides methods to interact with the process itself. In Express applications, it's commonly used to access environment variables like `process.env.PORT`.

### Environment Variables
Environment variables are key-value pairs that can configure application behavior outside your code.

**In Windows:**
1. Set variables temporarily in Command Prompt:
    ```
    set NODE_ENV=development
    ```

2. Set variables permanently:
    - Right-click Computer > Properties > Advanced system settings > Environment Variables
    - Or use PowerShell: `[Environment]::SetEnvironmentVariable("NODE_ENV", "development", "User")`

3. Access in Express(OLD VERSIONS):
    ```javascript
    // Use dotenv to load .env file variables
    require('dotenv').config();
    
    // Access variables
    const port = process.env.PORT || 3000;
    ```

Using `.env` files with the `dotenv` package is recommended for managing environment variables across platforms.  

## Methods to serve the static files in Express:
 
1. **Using `express.static` middleware**: This is the most common way to serve static files in Express. It allows you to specify a directory from which to serve static files like images, CSS, and JavaScript.

   ```javascript
   const express = require('express');
   const app = express();
   const path = require('path');

   // Serve static files from the 'public' directory
   app.use(express.static(path.join(__dirname, 'public')));

   app.listen(3000, () => {
       console.log('Server is running on port 3000');
   });
   ```
   In this example, any files in the `public` directory will be served at the root URL. For example, if you have a file `public/image.png`, it can be accessed at `http://localhost:3000/image.png`.
   > Make sure you always pass the absolute path and the public  folder should be in the same directory as the server file.
   > The `path.join(__dirname, 'public')` ensures that the path is constructed correctly regardless of the operating system.

   ## ES Module Caveat:
   1.)  Use `import` instead of `require`  

   2.) In newer version you can use the top level without wrapping it in a async function.  

**ES Module Version with Top-Level Await:**


```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Using top-level await (available in ECMAScript modules)
const server = await app.listen(3000);
console.log('Server is running on port 3000');

```

### Top-Level Await in JavaScript

Top-level await enables developers to use the `await` keyword outside of async functions in ECMAScript modules.

**Key features:**
- Available only in ES modules (files with `.mjs` extension or with `"type": "module"` in package.json)
- Allows asynchronous operations at the module level without wrapping in async functions
- Module execution is paused until the awaited promises resolve
- Modules that import a module using top-level await will wait for it to complete

**Example:**
```javascript
// Data fetching at module level
const response = await fetch('https://api.example.com/data');
const data = await response.json();
export { data };
```

ECMAScript handles top-level await by treating modules with top-level await as asynchronous modules in the dependency graph, ensuring proper execution order and dependency resolution.
   
3.)  We have `import.meta.` moethods to get the current directory and file name.
---
## Route Parameters in Express  
Route parameters are named URL segments that act as placeholders for values in the URL. They are defined in the route path using a colon (`:`) followed by the parameter name. When a request matches a route with parameters, the values are extracted and made available in the `req.params` object.
Route parameters are useful for creating dynamic routes that can handle different values in the URL.
## Query Parameters in Express
Query parameters are key-value pairs appended to the URL after a question mark (`?`). They are used to pass additional information to the server. In Express, query parameters can be accessed using `req.query`, which returns an object containing the parsed query string parameters. 

> for multiple query parameters, use `&` to separate them. For example: `http://localhost:3000/search?query=express&sort=asc`

## Form Submission in Express  
- You can use the `<form>` tag with the action attribute to specify the URL  
- By deffault, a ffform will use the `GET` method to submit data, you can handle it with `app.get` to access the form data via `req.query`, as the data is sent through the URL as `query strings`.  
- Since URLs have length limitations, it's better to use the `POST` method for larger data submissions.  
- To handle form submissions with the `POST` method, you need to set up a route using `app.post` and use middleware like `body-parser` or Express's built-in `express.urlencoded()` to parse the form data.
- The form data will be available in `req.body` after parsing.

### Form Submission Example in Express

Here's a complete example of handling form submission in Express:

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the HTML form
app.get('/form', (req, res) => {
    res.send(`
        <h1>User Registration</h1>
        <form action="/submit" method="POST">
            <div>
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>
            <button type="submit">Submit</button>
        </form>
    `);
});

// Route to handle form submission
app.post('/submit', (req, res) => {
    const { name, email } = req.body;
    
    // In a real app, you'd validate and save the data
    console.log('Form data received:', req.body);
    
    res.send(`
        <h1>Registration Successful!</h1>
        <p>Name: ${name}</p>
        <p>Email: ${email}</p>
        <a href="/form">Back to form</a>
    `);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

This example demonstrates:
1. Setting up middleware to parse form data
2. Creating a route to serve an HTML form
3. Handling the POST request when the form is submitted
4. Accessing form data through `req.body`
5. Sending a response back to the user

