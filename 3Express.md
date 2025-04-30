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