# JWT Cookie Authentication Setup Guide

## Prerequisites
```bash
npm install jsonwebtoken cookie-parser bcryptjs
```

## Step 1: Setup Cookie Parser Middleware
```js
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Basic cookie parser setup
app.use(cookieParser());

// Or with secret for signed cookies
app.use(cookieParser('your_cookie_secret'));
```

## Step 2: JWT Helper Functions (utils/jwt.js)
```js
const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: '7d' 
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };
```

## Step 3: Auth Controller - Login with JWT Cookie
```js
const { generateToken } = require('../utils/jwt');

const login = async (req, res) => {
    try {
        // Validate user credentials
        const user = await User.findOne({ email: req.body.email });
        
        if (!user || !await bcrypt.compare(req.body.password, user.password)) {
            req.flash('errors', 'Invalid credentials');
            return res.redirect('/login');
        }

        // Generate JWT token
        const token = generateToken({ 
            userId: user._id, 
            email: user.email 
        });

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'strict'
        });

        res.redirect('/dashboard');
    } catch (error) {
        req.flash('errors', 'Login failed');
        res.redirect('/login');
    }
};
```

## Step 4: Authentication Middleware
```js
const { verifyToken } = require('../utils/jwt');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        req.flash('errors', 'Please login to access this page');
        return res.redirect('/login');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        res.clearCookie('token');
        req.flash('errors', 'Invalid or expired token');
        return res.redirect('/login');
    }

    req.user = decoded;
    next();
};

// Optional: Check if user is already logged in
const redirectIfAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (token && verifyToken(token)) {
        return res.redirect('/dashboard');
    }
    next();
};

module.exports = { authenticateToken, redirectIfAuthenticated };
```

## Step 5: Apply Middleware to Routes
```js
const { authenticateToken, redirectIfAuthenticated } = require('../middleware/auth');

// Protected routes
router.get('/dashboard', authenticateToken, (req, res) => {
    res.render('dashboard', { user: req.user });
});

router.get('/profile', authenticateToken, (req, res) => {
    res.render('profile', { user: req.user });
});

// Public routes (redirect if already logged in)
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('auth/login');
});

router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('auth/register');
});
```

## Step 6: Logout Controller
```js
const logout = (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Logged out successfully');
    res.redirect('/login');
};
```

## Step 7: User Service for Database Operations
```js
// services/userService.js
const User = require('../models/User');

const getUserById = async (userId) => {
    try {
        return await User.findById(userId).select('-password');
    } catch (error) {
        throw new Error('User not found');
    }
};

const updateUserProfile = async (userId, updateData) => {
    try {
        return await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');
    } catch (error) {
        throw new Error('Profile update failed');
    }
};

module.exports = { getUserById, updateUserProfile };
```

## Step 8: Using Services in Controllers
```js
const { getUserById, updateUserProfile } = require('../services/userService');

const getProfile = async (req, res) => {
    try {
        const user = await getUserById(req.user.userId);
        res.render('profile', { user });
    } catch (error) {
        req.flash('errors', error.message);
        res.redirect('/dashboard');
    }
};

const updateProfile = async (req, res) => {
    try {
        const updatedUser = await updateUserProfile(req.user.userId, req.body);
        req.flash('success', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (error) {
        req.flash('errors', error.message);
        res.redirect('/profile');
    }
};
```

## Security Best Practices

### Cookie Security Options
```js
res.cookie('token', token, {
    httpOnly: true,          // Prevents XSS attacks
    secure: true,            // HTTPS only in production
    sameSite: 'strict',      // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000  // Expiration time
});
```

### Environment Variables (.env)
```
JWT_SECRET=your_very_long_random_secret_key_here
NODE_ENV=production
```

### Token Validation in Services
```js
const requireAuth = async (req, res, next) => {
    try {
        const user = await getUserById(req.user.userId);
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        req.currentUser = user;
        next();
    } catch (error) {
        res.clearCookie('token');
        res.redirect('/login');
    }
};
```
# How to Store and Display Express-Flash Messages on the Register Page

## Step 1: Install Required Packages
```bash
npm install express-flash express-session cookie-parser
```

## Step 2: Initialize Middleware (Order is Important)
```js
const session = require('express-session');
const flash = require('express-flash');
const cookieParser = require('cookie-parser');

// Middleware initialization order:
app.use(cookieParser('your_secret'));
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
```

## Step 3: Set Flash Message in Auth Controller
```js
if (userExists) {
    req.flash('errors', 'User Already Exists.');
    return res.redirect('/register');
}
```

## Step 4: Pass Flash Messages to Register Page
```js
router.get('/register', (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('../views/auth/register', { 
        errors: req.flash('errors') 
    });
});
```

## Step 5: Display Messages in EJS Template
```ejs
<% if (typeof errors !== 'undefined' && errors && errors.length > 0) { %>
    <% errors.forEach((error) => { %>
        <p class="flash-error"><%= error %></p>
    <% }); %>
<% } %>
```

## Important Configuration Options Explained

### Session Configuration
- **`secret`**: Used to sign the session ID cookie. Should be a random string kept secure.
- **`resave`**: If `false`, session won't be saved back to store if unmodified during request.
- **`saveUninitialized`**: If `false`, new but unmodified sessions won't be saved to store.

### Why This Order Matters
1. **Cookie Parser** - Parses cookies from requests
2. **Session** - Manages user sessions (depends on cookies)
3. **Flash** - Stores temporary messages in session (depends on session)
4. **Auth Middleware** - Uses session data (comes after session setup)

### Flash Message Types
- `req.flash('errors', 'message')` - Set error messages
- `req.flash('success', 'message')` - Set success messages  
- `req.flash('info', 'message')` - Set info messages

### Best Practices
- Always check if flash messages exist before rendering
- Use different message types for better UX
- Clear messages are automatically removed after being displayed once