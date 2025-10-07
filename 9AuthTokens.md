# Hybrid Authentication: JWT + Session-Based Implementation

## Why Use Hybrid Authentication (JWT + Sessions)?

### The Problem with Single Authentication Methods

**JWT Only:**
- ❌ Can't revoke tokens before expiry
- ❌ Tokens can be large (data in token)
- ❌ No server-side session control
- ❌ If stolen, valid until expiration

**Sessions Only:**
- ❌ Server must store all sessions (memory intensive)
- ❌ Scaling across multiple servers is complex
- ❌ Not ideal for mobile apps/APIs
- ❌ Requires constant database lookups

### Hybrid Solution: Best of Both Worlds

**How It Works:**
1. **Short-lived Access Token (JWT)**: 15 minutes - Contains user data
2. **Long-lived Refresh Token (JWT)**: 7 days - Contains only session ID
3. **Server-side Session Store**: Database tracks valid sessions

### Key Benefits of Hybrid Approach

✅ **Security**: Can revoke sessions immediately (logout, suspicious activity)  
✅ **Performance**: Short access tokens = less database queries  
✅ **User Experience**: Auto-refresh = stays logged in (up to 7 days)  
✅ **Control**: Track user sessions, devices, IP addresses  
✅ **Scalability**: JWT stateless + session tracking balance  
✅ **Flexibility**: Support web, mobile, APIs with same system  

---

## Complete Step-by-Step Implementation

### Step 1: Install Required Dependencies

```bash
npm install express express-session cookie-parser connect-flash
npm install jsonwebtoken argon2 request-ip
npm install drizzle-orm mysql2 zod
npm install dotenv ejs
```

**Package Purposes:**
- `jsonwebtoken`: Create and verify JWT tokens
- `argon2`: Secure password hashing
- `request-ip`: Get user's IP address for session tracking
- `express-session`: Flash message support
- `cookie-parser`: Parse and manage cookies
- `connect-flash`: Temporary error/success messages

---

### Step 2: Define Token Expiry Constants

**File: `config/constants.js`**

```javascript
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

// Access Token: 15 minutes (short-lived)
export const ACCESS_TOKEN_EXPIRY =
  15 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// Refresh Token: 7 days (long-lived)
export const REFRESH_TOKEN_EXPIRY =
  DAYS_PER_WEEK *
  HOURS_PER_DAY *
  MINUTES_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;
```

**Why These Values?**
- **15 minutes (Access)**: Short enough to limit damage if stolen, long enough to avoid constant refreshes
- **7 days (Refresh)**: Balances convenience (stay logged in) with security (forced re-login weekly)

---

### Step 3: Create Database Schema with Sessions Table

**File: `drizzle/schema.js`**

```javascript
import { relations } from 'drizzle-orm';
import { boolean, mysqlTable, serial, timestamp, varchar, int, text } from 'drizzle-orm/mysql-core';

// Users Table
export const usersTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Sessions Table - Critical for Hybrid Auth
export const sessionsTable = mysqlTable("sessions", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }), // Auto-delete sessions when user deleted
  valid: boolean().default(true).notNull(), // Can invalidate session without deleting
  userAgent: text("user_agent"), // Browser/device info
  ip: varchar({ length: 255 }), // User's IP address
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Short Links Table
export const short_links = mysqlTable('short_links', {
  id: serial('id').primaryKey(),
  shortCode: varchar('shortCode', { length: 16 }).notNull().unique(),
  url: varchar('url', { length: 2048 }).notNull(),
  userId: int("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Define Relationships
export const usersRelation = relations(usersTable, ({ many }) => ({
  shortLinks: many(short_links),
  sessions: many(sessionsTable) // One user can have multiple active sessions
}));

export const sessionRelation = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  })
}));

export const shortLinksrelations = relations(short_links, ({ one }) => ({
  user: one(usersTable, {
    fields: [short_links.userId],
    references: [usersTable.id],
  })
}));
```

**Key Points:**
- `valid` field: Allows instant session revocation
- `userAgent` & `ip`: Track where user logged in (security)
- `onDelete: 'cascade'`: Auto-cleanup when user deleted
- Multiple sessions per user: Support multiple devices

**Run Migrations:**
```bash
npm run db:generate  # Generate SQL migration files
npm run db:migrate   # Apply migrations to database
```

---

### Step 4: Create Authentication Services

**File: `services/auth.services.js`**

```javascript
import { db } from "../config/db-client.js";
import { sessionsTable, usersTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";

// ========== User Operations ==========
export const getUserByEmail = async (email) => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email));
  return user;
};

export const findUserById = async (userId) => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, userId));
  return user;
};

export const createUser = async ({ name, email, password }) => {
  return await db.insert(usersTable)
    .values({ name, email, password })
    .$returningId();
};

export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

export const comparePassword = async (hash, password) => {
  return await argon2.verify(hash, password);
};

// ========== Session Operations ==========
export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db.insert(sessionsTable)
    .values({ userId, ip, userAgent })
    .$returningId();
  return session;
};

export const findSessionById = async (sessionId) => {
  const [session] = await db.select().from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));
  return session;
};

export const clearSession = async (sessionId) => {
  return db.delete(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));
};

// ========== Token Operations ==========

// Access Token: Contains user data + session ID
export const createAccessToken = ({ id, name, email, sessionId }) => {
  return jwt.sign(
    { id, name, email, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND } // 15 minutes
  );
};

// Refresh Token: Only contains session ID (lightweight)
export const createRefreshToken = ({ sessionId }) => {
  return jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND } // 7 days
  );
};

export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ========== Token Refresh Logic ==========
export const refreshTokens = async (refreshToken) => {
  try {
    // 1. Verify refresh token and get session ID
    const decodedToken = verifyJWTToken(refreshToken);
    
    // 2. Check if session exists and is valid
    const currentSession = await findSessionById(decodedToken.sessionId);
    if (!currentSession || !currentSession.valid) {
      throw new Error("Invalid Session!");
    }

    // 3. Get user data from database
    const user = await findUserById(currentSession.userId);
    if (!user) throw new Error("Invalid User!");

    // 4. Prepare user info for new tokens
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      sessionId: currentSession.id,
    };

    // 5. Generate new tokens
    const newAccessToken = createAccessToken(userInfo);
    const newRefreshToken = createRefreshToken({ sessionId: currentSession.id });

    return {
      newAccessToken,
      newRefreshToken,
      user: userInfo,
    };
  } catch (error) {
    console.log("Error in refreshTokens:", error.message);
    throw error;
  }
};

// ========== Unified Authentication Helper ==========
export const authenticateUser = async ({ req, res, user, name, email }) => {
  // 1. Create a new session in database
  const session = await createSession(user.id, {
    ip: req.clientIp, // From request-ip middleware
    userAgent: req.headers["user-agent"],
  });

  // 2. Generate tokens
  const accessToken = createAccessToken({
    id: user.id,
    name: user.name || name,
    email: user.email || email,
    sessionId: session.id,
  });

  const refreshToken = createRefreshToken({ sessionId: session.id });

  // 3. Set cookies with proper configuration
  const baseConfig = { httpOnly: true, secure: true }; // secure: true for HTTPS

  res.cookie("access_token", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
};
```

**Service Functions Breakdown:**

| Function | Purpose |
|----------|---------|
| `createAccessToken` | Short-lived JWT with user data |
| `createRefreshToken` | Long-lived JWT with only session ID |
| `createSession` | Store session in database with device info |
| `refreshTokens` | Generate new tokens using refresh token |
| `authenticateUser` | Complete login flow: session + tokens |
| `clearSession` | Logout by invalidating session |

---

### Step 5: Create Authentication Middleware

**File: `middlewares/verify-auth.middleware.js`**

```javascript
import { refreshTokens, verifyJWTToken } from "../services/auth.services.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";

export const verifyAuthentication = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  // No tokens = Not authenticated
  if (!accessToken && !refreshToken) {
    req.user = null;
    return next();
  }

  // Try Access Token First (most common case)
  if (accessToken) {
    try {
      const decodedToken = verifyJWTToken(accessToken);
      req.user = decodedToken; // User is authenticated
      return next();
    } catch (error) {
      console.log("Access token invalid, trying refresh token");
      // Access token expired or invalid, try refresh token
    }
  }

  // Try Refresh Token if Access Token Failed
  if (refreshToken) {
    try {
      // Get new tokens using refresh token
      const { newAccessToken, newRefreshToken, user } = await refreshTokens(refreshToken);

      const baseConfig = { httpOnly: true, secure: false }; // Set secure: true in production

      // Set new tokens in cookies
      res.cookie("access_token", newAccessToken, {
        ...baseConfig,
        maxAge: ACCESS_TOKEN_EXPIRY,
      });

      res.cookie("refresh_token", newRefreshToken, {
        ...baseConfig,
        maxAge: REFRESH_TOKEN_EXPIRY,
      });

      req.user = user; // User is authenticated
      return next();

    } catch (error) {
      console.error("Refresh token failed:", error.message);
      
      // Clear invalid cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      
      req.user = null;
      return next();
    }
  }

  // If we reach here, no valid tokens exist
  req.user = null;
  return next();
};
```

**Middleware Flow:**

```
Request comes in
       ↓
Has access_token?
       ↓
    YES → Verify → Valid? → Set req.user → Continue
       ↓             ↓
       NO         Invalid
       ↓             ↓
Has refresh_token? ←─┘
       ↓
    YES → Verify → Valid? → Generate new tokens → Set cookies → Set req.user → Continue
       ↓             ↓
       NO         Invalid
       ↓             ↓
Set req.user = null → Continue
```

**Key Features:**
1. **Automatic Token Refresh**: User never sees "session expired" if refresh token valid
2. **Graceful Degradation**: Invalid tokens don't break app, just set `req.user = null`
3. **Security**: Clears invalid cookies to prevent replay attacks

---

## Special Feature: Auto-Login After Registration

### Why Auto-Login After Registration?

**Problem with Traditional Flow:**
```plaintext
User fills registration form (30 seconds)
        ↓
Success! "Please login now"
        ↓
User fills login form again (20 seconds)
        ↓
Finally logged in
```

**Better User Experience:**
```plaintext
User fills registration form (30 seconds)
        ↓
Automatically logged in & redirected to dashboard
```

### Implementation Strategy

The key is to use the same `authenticateUser()` function for both registration and login:

**File: `controllers/auth.controller.js`**

```javascript
// ========== Register with Auto-Login ==========
export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  // 1. Validate input
  const { success, data, error } = registerUserSchema.safeParse(req.body);
  if (!success) {
    const errorMessage = error.issues?.[0]?.message || "Validation error";
    req.flash("errors", errorMessage);
    return res.redirect('/register');
  }

  const { name, email, password } = data;
  
  // 2. Check if user already exists
  const userExists = await getUserByEmail(email);
  if (userExists) {
    req.flash("errors", "User Already Exists.");
    return res.redirect("/register");
  }

  // 3. Create new user
  const hashedPassword = await hashPassword(password);
  const [user] = await createUser({ name, email, password: hashedPassword });

  // 4. 🔑 KEY PART: Auto-login after registration
  await authenticateUser({ req, res, user, name, email });
  
  // 5. Redirect to homepage (user is now logged in!)
  res.redirect("/");
};
```

### What Happens Behind the Scenes?

When `authenticateUser()` is called:

```javascript
export const authenticateUser = async ({ req, res, user, name, email }) => {
  // 1. Create session in database
  const session = await createSession(user.id, {
    ip: req.clientIp,              // Track where they registered from
    userAgent: req.headers["user-agent"], // Track device used
  });

  // 2. Generate tokens
  const accessToken = createAccessToken({
    id: user.id,
    name: user.name || name,       // Use provided name if user.name not set
    email: user.email || email,
    sessionId: session.id,
  });

  const refreshToken = createRefreshToken({ sessionId: session.id });

  // 3. Set cookies (user is now authenticated)
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: ACCESS_TOKEN_EXPIRY, // 15 minutes
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: REFRESH_TOKEN_EXPIRY, // 7 days
  });
  
  // No return statement - cookies are set, user can now access protected routes
};
```

### Step-by-Step Flow

```plaintext
1. User submits registration form
        ↓
2. Validate input with Zod
        ↓
3. Check if email already exists
        ↓
4. Hash password with Argon2
        ↓
5. Insert new user into database
        ↓
6. Create session in sessions table
        ↓
7. Generate access_token (15min) + refresh_token (7days)
        ↓
8. Set both tokens as httpOnly cookies
        ↓
9. Redirect to homepage
        ↓
10. User is now logged in! (middleware reads cookies on next request)
```

### Why This Works

**On the next request (redirect to homepage):**

```javascript
// Middleware runs automatically
export const verifyAuthentication = async (req, res, next) => {
  const accessToken = req.cookies.access_token; // ✅ Cookie was just set!
  
  if (accessToken) {
    try {
      const decodedToken = verifyJWTToken(accessToken);
      req.user = decodedToken; // ✅ User is authenticated
      return next();
    } catch (error) {
      // Handle invalid token
    }
  }
  
  // ... rest of middleware
};
```

### Comparison: With vs Without Auto-Login

| Feature | Without Auto-Login | With Auto-Login |
|---------|-------------------|-----------------|
| **Steps** | Register → Login | Register only |
| **Forms to fill** | 2 forms | 1 form |
| **User friction** | High (annoying) | Low (seamless) |
| **Time taken** | ~50 seconds | ~30 seconds |
| **User experience** | Poor | Excellent |
| **Drop-off rate** | Higher | Lower |

### Benefits of Auto-Login

1. **Better UX**: User doesn't repeat email/password
2. **Fewer Drop-offs**: Less chance user abandons registration
3. **Faster Onboarding**: User immediately accesses features
4. **Modern Standard**: Most apps do this (Gmail, Facebook, Twitter)
5. **Same Code**: Reuse `authenticateUser()` for both flows

### Alternative: Manual Login After Registration

If you prefer traditional flow (register → manual login):

```javascript
export const postRegister = async (req, res) => {
  // ... validation and user creation code ...
  
  const hashedPassword = await hashPassword(password);
  const [user] = await createUser({ name, email, password: hashedPassword });

  // ❌ DON'T call authenticateUser()
  
  // Instead, show success message and redirect to login
  req.flash("success", "Registration successful! Please login.");
  res.redirect("/login");
};
```

### Security Considerations

**Is Auto-Login Safe?**

✅ **YES** - Because:

1. **User just verified email**: They provided it and have access
2. **Password was just created**: Fresh, not compromised
3. **Same security**: Uses exact same auth flow as login
4. **Session tracked**: IP and device recorded
5. **Standard practice**: Used by major platforms

**When NOT to auto-login:**

- Email verification required (send confirmation email first)
- Two-factor authentication (2FA) enabled
- Additional security checks needed
- Compliance requirements (banking, healthcare)

### Adding Email Verification (Optional)

If you want to verify email before auto-login:

```javascript
export const postRegister = async (req, res) => {
  // ... validation ...
  
  const hashedPassword = await hashPassword(password);
  const [user] = await createUser({ 
    name, 
    email, 
    password: hashedPassword,
    emailVerified: false // Add this field to schema
  });

  // Send verification email
  await sendVerificationEmail(email, user.id);
  
  // Don't auto-login
  req.flash("success", "Please check your email to verify your account.");
  res.redirect("/login");
};

// After user clicks email link:
export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  
  // Verify token and get user
  const user = await verifyEmailToken(token);
  
  // Update user
  await db.update(usersTable)
    .set({ emailVerified: true })
    .where(eq(usersTable.id, user.id));
  
  // NOW auto-login
  await authenticateUser({ req, res, user });
  
  res.redirect("/");
};
```

### Testing Auto-Login

**Test Case 1: Successful Registration**

```bash
# 1. Submit registration form
POST /register
Body: {
  name: "John Doe",
  email: "john@example.com",
  password: "password123"
}

# 2. Check response
Expected:
- Status: 302 (redirect)
- Location: /
- Set-Cookie: access_token=...
- Set-Cookie: refresh_token=...

# 3. Follow redirect
GET /
Expected:
- User sees logged-in homepage
- User's name displayed in header
- Protected content visible
```

**Test Case 2: Verify Cookies**

```javascript
// In browser console after registration
document.cookie; 
// Should show: "access_token=...; refresh_token=..."

// Check if cookies are httpOnly (should NOT see them in console)
// This is correct - they're secure and not accessible to JavaScript
```

**Test Case 3: Verify Session in Database**

```sql
-- Check sessions table
SELECT * FROM sessions WHERE user_id = 1;

-- Should show new session with:
-- - Correct user_id
-- - IP address
-- - User agent
-- - valid = 1
-- - Recent created_at timestamp
```

### Troubleshooting

**Issue: User not logged in after registration**

**Check 1: Are cookies being set?**

```javascript
// In postRegister controller, add logging
await authenticateUser({ req, res, user, name, email });
console.log("Cookies set:", res.getHeaders()['set-cookie']); // Should show 2 cookies
```

**Check 2: Is middleware reading cookies?**

```javascript
// In verifyAuthentication middleware
console.log("Cookies received:", req.cookies);
// Should show: { access_token: '...', refresh_token: '...' }
```

**Check 3: Cookie configuration**

```javascript
// If using HTTPS in development, set secure: false
res.cookie("access_token", accessToken, {
  httpOnly: true,
  secure: false, // ⚠️ Change to true in production
  sameSite: 'lax',
  maxAge: ACCESS_TOKEN_EXPIRY,
});
```

### Summary

✅ **Auto-login after registration** improves user experience significantly  
✅ **Uses same `authenticateUser()` function** as login (code reuse)  
✅ **Creates session + tokens** immediately after user creation  
✅ **Secure** - same security as manual login  
✅ **Standard practice** - used by most modern applications  

**Key Code:**

```javascript
// After creating user
await authenticateUser({ req, res, user, name, email });
res.redirect("/"); // User is now logged in!
```

That's it! Simple, effective, and great UX.

---

### Step 6: Update Controllers for Hybrid Auth

**File: `controllers/auth.controller.js`**

```javascript
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { 
  getUserByEmail,
  createUser, 
  hashPassword, 
  comparePassword,
  clearSession,
  authenticateUser // Uses hybrid auth
} from "../services/auth.services.js";
import { loginUserSchema, registerUserSchema } from "../validators/auth-validator.js";

// ========== Register with Auto-Login ==========
export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  // Zod Validation
  const { success, data, error } = registerUserSchema.safeParse(req.body);
  
  if (!success) {
    const errorMessage = error.issues?.[0]?.message || "Validation error";
    req.flash("errors", errorMessage);
    return res.redirect('/register');
  }

  const { name, email, password } = data;
  
  // Check if user exists
  const userExists = await getUserByEmail(email);
  if (userExists) {
    req.flash("errors", "User Already Exists.");
    return res.redirect("/register");
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const [user] = await createUser({ name, email, password: hashedPassword });

  // Auto-login after registration (hybrid auth)
  await authenticateUser({ req, res, user, name, email });
  
  res.redirect("/");
};

// ========== Login with Hybrid Auth ==========
export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");
  
  // Zod Validation
  const { success, data, error } = loginUserSchema.safeParse(req.body);
  
  if (!success) {
    const errorMessage = error.issues?.[0]?.message || "Validation error";
    req.flash("errors", errorMessage);
    return res.redirect('/login');
  }

  const { email, password } = data;
  
  // Verify credentials
  const user = await getUserByEmail(email);
  if (!user || !(await comparePassword(user.password, password))) {
    req.flash("errors", "Invalid User or Password");
    return res.redirect("/login");
  }

  // Create session and set tokens (hybrid auth)
  await authenticateUser({ req, res, user });
  
  res.redirect("/");
};

// ========== Logout (Clear Session + Cookies) ==========
export const logoutUser = async (req, res) => {
  // Delete session from database
  await clearSession(req.user.sessionId);
  
  // Clear both tokens
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  
  res.redirect('/login');
};

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("../views/auth/register", { errors: req.flash('errors') });
};

export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("../views/auth/login", { errors: req.flash('errors') });
};

export const getMe = (req, res) => {
  if (!req.user) return res.send("Not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};
```

**Changes from Single JWT:**

| Old (JWT Only) | New (Hybrid) |
|----------------|--------------|
| `generateToken()` | `authenticateUser()` - creates session + tokens |
| Single `access_token` cookie | Two cookies: `access_token` + `refresh_token` |
| `res.clearCookie("access_token")` | Clear both + delete session from DB |
| Token expires = logout | Token expires = auto-refresh |

---

### Step 7: Configure Application Middleware

**File: `app.js`**

```javascript
import express from "express";
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'connect-flash';
import requestIp from "request-ip"; // NEW: Track user IP
import { verifyAuthentication } from './middlewares/verify-auth.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import RouterUrl from "./routes/shortner.routes.js";

const app = express();

// Middleware Order is Critical!
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(cookieParser()); // Parse cookies BEFORE auth check

// Session for flash messages
app.use(session({
  secret: 'my-secret',
  resave: true,
  saveUninitialized: false
}));

app.use(flash()); // Flash messages for errors/success

// NEW: Track user IP for session security
app.use(requestIp.mw());

// JWT Verification Middleware (runs on EVERY request)
app.use(verifyAuthentication);

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});

// Routes
app.use(authRoutes);
app.use('/', RouterUrl);

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
```

**Middleware Order Explanation:**

```
1. express.urlencoded()  → Parse request body
2. cookieParser()        → Parse cookies (needed for tokens)
3. session()             → Enable flash messages
4. flash()               → Flash message support
5. requestIp.mw()        → Get user's IP address
6. verifyAuthentication  → Check tokens, refresh if needed
7. res.locals.user       → Make user available in templates
8. Routes                → Handle actual requests
```

---

### Step 8: Environment Variables

**File: `.env`**

```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=url_shortner_mysql

JWT_SECRET=your-super-secret-key-min-32-chars
```

**Security Notes:**

- `JWT_SECRET` should be at least 32 characters
- Never commit `.env` to version control
- Use different secrets for dev/production

---

## Authentication Flow Diagrams

### Login Flow

```plaintext
User submits credentials
        ↓
Validate with Zod
        ↓
Check user exists + password match
        ↓
Create Session in DB (store IP, userAgent)
        ↓
Generate Access Token (15min) + Refresh Token (7days)
        ↓
Set both tokens as httpOnly cookies
        ↓
Redirect to homepage
```

### Request Flow (Every Page Load)

```plaintext
Request arrives
        ↓
Middleware: verifyAuthentication runs
        ↓
Check access_token cookie
        ↓
Valid? → Set req.user → Continue to route
        ↓ (if invalid)
Check refresh_token cookie
        ↓
Valid? → Query session from DB → Generate new tokens → Set cookies → Continue
        ↓ (if invalid)
Set req.user = null → Continue (public access only)
```

### Logout Flow

```plaintext
User clicks logout
        ↓
Get sessionId from req.user
        ↓
Delete session from database
        ↓
Clear access_token cookie
        ↓
Clear refresh_token cookie
        ↓
Redirect to login
```

---

## Key Benefits Achieved

### 1. **Enhanced Security**

| Feature | Benefit |
|---------|---------|
| **Short-lived Access Token** | If stolen, only valid for 15 minutes |
| **Server-side Sessions** | Can revoke access instantly (logout all devices) |
| **Device Tracking** | Know where user logged in (IP, browser) |
| **Cascade Delete** | Delete user = auto-cleanup all sessions |
| **Valid Flag** | Disable session without deletion (suspicious activity) |

### 2. **Better User Experience**

- ✅ **No Frequent Re-login**: Refresh token keeps user logged in for 7 days
- ✅ **Seamless Refresh**: Auto-refresh happens in background (user doesn't notice)
- ✅ **Multi-device Support**: Can be logged in on phone + laptop simultaneously
- ✅ **Auto-login After Register**: No need to login after registration

### 3. **Developer Benefits**

- ✅ **Centralized Auth Logic**: `authenticateUser()` function handles everything
- ✅ **Easy Session Management**: Query database to see all active sessions
- ✅ **Flexible Security**: Can adjust token expiry without code changes
- ✅ **Audit Trail**: Track when/where users logged in

### 4. **Scalability**

- ✅ **Stateless Requests**: Most requests use access token (no DB query)
- ✅ **Reduced DB Load**: Only refresh token flow queries database
- ✅ **Session Cleanup**: Old sessions auto-expire and can be cleaned up

---

## Security Best Practices Implemented

### 1. **Token Security**

```javascript
// httpOnly: Prevents JavaScript from accessing cookies (XSS protection)
// secure: true: Only send over HTTPS (MITM protection)
res.cookie("access_token", token, {
  httpOnly: true,  // ✅ XSS Protection
  secure: true,    // ✅ HTTPS Only
  sameSite: 'lax', // ✅ CSRF Protection
  maxAge: ACCESS_TOKEN_EXPIRY
});
```

### 2. **Password Security**

```javascript
// Argon2: Modern, secure hashing (better than bcrypt)
const hashedPassword = await argon2.hash(password);
const isValid = await argon2.verify(hash, password);
```

### 3. **Session Tracking**

```javascript
// Track where user logged in
const session = await createSession(userId, {
  ip: req.clientIp,              // IP address
  userAgent: req.headers["user-agent"], // Browser/device info
});
```

### 4. **Immediate Revocation**

```javascript
// Can instantly invalidate session
await db.update(sessionsTable)
  .set({ valid: false })
  .where(eq(sessionsTable.id, sessionId));
```

---

## Comparison: JWT Only vs Hybrid Auth

| Feature | JWT Only | Hybrid Auth (JWT + Session) |
|---------|----------|----------------------------|
| **Token Expiry** | 30 days | Access: 15min, Refresh: 7 days |
| **Can Revoke?** | ❌ No | ✅ Yes (invalidate session) |
| **DB Queries per Request** | 0 | 0 (if access token valid) |
| **Auto-refresh** | ❌ No | ✅ Yes (transparent) |
| **Track Devices** | ❌ No | ✅ Yes (sessions table) |
| **User Experience** | Re-login every 30 days | Re-login every 7 days (but seamless refresh) |
| **Security** | Good | Better (instant revocation) |
| **If Token Stolen** | Valid for 30 days | Valid for 15 minutes max |

---

## Common Use Cases

### 1. **Logout All Devices**

```javascript
// Invalidate all sessions for a user
await db.update(sessionsTable)
  .set({ valid: false })
  .where(eq(sessionsTable.userId, userId));
```

### 2. **View Active Sessions**

```javascript
// Get all active sessions for current user
const sessions = await db.select()
  .from(sessionsTable)
  .where(eq(sessionsTable.userId, req.user.id))
  .where(eq(sessionsTable.valid, true));

// sessions contains: IP, userAgent, createdAt for each device
```

### 3. **Force Re-login After Password Change**

```javascript
// After password change, invalidate all sessions
await db.update(sessionsTable)
  .set({ valid: false })
  .where(eq(sessionsTable.userId, userId));

// User must login again on all devices
```

### 4. **Session Cleanup Job**

```javascript
// Delete old sessions (e.g., older than 30 days)
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

await db.delete(sessionsTable)
  .where(lt(sessionsTable.createdAt, thirtyDaysAgo));
```

---

## Troubleshooting Common Issues

### Issue 1: "Access token invalid, trying refresh token" (Normal)

**What's Happening:**

- Access token expired after 15 minutes
- Middleware automatically uses refresh token
- New tokens generated and set

**Action:** None needed - this is expected behavior

---

### Issue 2: "Refresh token failed: Invalid Session!"

**Possible Causes:**

1. Session deleted from database (manual deletion)
2. Session marked as invalid (`valid: false`)
3. User logged out

**Solution:** User needs to login again

---

### Issue 3: Tokens not being set

**Check:**

```javascript
// Ensure cookies are being parsed
app.use(cookieParser()); // Must come before verifyAuthentication

// Check cookie configuration
const baseConfig = {
  httpOnly: true,
  secure: false, // Set to true in production with HTTPS
};
```

---

### Issue 4: req.user is always null

**Debugging Steps:**

```javascript
// Add logging in middleware
export const verifyAuthentication = async (req, res, next) => {
  console.log("Cookies:", req.cookies); // Check if tokens exist
  console.log("Access Token:", req.cookies.access_token);
  console.log("Refresh Token:", req.cookies.refresh_token);
  
  // ... rest of code
};
```

---

## Testing the Implementation

### 1. **Test Registration + Auto-login**

```bash
# Register new user
POST /register
Body: { name: "Test", email: "test@test.com", password: "12345" }

# Should redirect to homepage with cookies set
# Check browser cookies: access_token, refresh_token
```

### 2. **Test Token Refresh**

```bash
# Wait 16 minutes (access token expired)
# Make any request

# Check browser network tab:
# - Initial request: Uses expired access token
# - Middleware generates new tokens
# - New cookies set in response
# - Request succeeds
```

### 3. **Test Logout**

```bash
# Login first
POST /login

# Then logout
GET /logout

# Check:
# - Cookies cleared
# - Session deleted from database
# - Redirected to login page
```

### 4. **Test Session Revocation**

```sql
-- In database, mark session as invalid
UPDATE sessions SET valid = 0 WHERE user_id = 1;

-- Try to make request
-- Should fail and clear cookies
-- User must login again
```

---

## Performance Considerations

### Database Queries per Request

| Scenario | Access Token | Refresh Token | DB Queries |
|----------|--------------|---------------|------------|
| **Valid Access Token** | ✅ Valid | N/A | 0 |
| **Expired Access Token** | ❌ Expired | ✅ Valid | 2 (check session, get user) |
| **No Tokens** | ❌ None | ❌ None | 0 |

### Optimization Tips

1. **Cache User Data**: Store frequently accessed user data in Redis
2. **Batch Session Cleanup**: Run cleanup job daily, not on every request
3. **Index Database**: Add index on `sessionsTable.userId` for faster queries
4. **Connection Pooling**: Use MySQL connection pool for better performance

```javascript
// Example: Add index in migration
await db.execute(sql`
  CREATE INDEX idx_sessions_user_id ON sessions(user_id)
`);
```

---

## Migration from Simple JWT

If you're upgrading from single JWT to hybrid auth:

### Step 1: Add Sessions Table

```bash
# Update schema.js with sessionsTable
npm run db:generate
npm run db:migrate
```

### Step 2: Update Services

```javascript
// Replace
export const generateToken = ({ id, name, email }) => {
  return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};

// With
export const authenticateUser = async ({ req, res, user }) => {
  const session = await createSession(user.id, {
    ip: req.clientIp,
    userAgent: req.headers["user-agent"],
  });
  
  const accessToken = createAccessToken({ ...user, sessionId: session.id });
  const refreshToken = createRefreshToken({ sessionId: session.id });
  
  res.cookie("access_token", accessToken, { ... });
  res.cookie("refresh_token", refreshToken, { ... });
};
```

### Step 3: Update Middleware

Replace simple JWT verification with the hybrid middleware from Step 5.

### Step 4: Update Logout

```javascript
// Old
export const logoutUser = (req, res) => {
  res.clearCookie("access_token");
  res.redirect('/login');
};

// New
export const logoutUser = async (req, res) => {
  await clearSession(req.user.sessionId); // Delete session from DB
  res.clearCookie("access_token");
  res.clearCookie("refresh_token"); // Clear both tokens
  res.redirect('/login');
};
```

---

## Summary

### What We Built

✅ **Hybrid Authentication System**: JWT + Session-based  
✅ **Auto-refresh Tokens**: Seamless user experience  
✅ **Session Management**: Track devices, IPs, browsers  
✅ **Instant Revocation**: Logout all devices immediately  
✅ **Security**: Short-lived tokens, httpOnly cookies, password hashing  
✅ **Scalability**: Most requests don't hit database  
✅ **Flexibility**: Easy to extend with features like "remember me"  

### Key Files Created

1. `config/constants.js` - Token expiry times
2. `drizzle/schema.js` - Database schema with sessions
3. `services/auth.services.js` - All auth logic
4. `middlewares/verify-auth.middleware.js` - Token verification & refresh
5. `controllers/auth.controller.js` - Register, login, logout handlers
6. `app.js` - Middleware setup

### Why This Approach?

- **JWT Benefits**: Fast, stateless, contains user data
- **Session Benefits**: Revocable, trackable, secure
- **Hybrid**: Get advantages of both, minimize disadvantages

### Production Checklist

Before deploying:

- [ ] Set `secure: true` in cookie config (requires HTTPS)
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Set up session cleanup job (delete old sessions)
- [ ] Add rate limiting on login endpoint
- [ ] Enable CORS if API used by frontend
- [ ] Set up monitoring for failed auth attempts
- [ ] Configure session timeout based on your requirements
- [ ] Test logout flow thoroughly
- [ ] Test token refresh flow
- [ ] Add logging for security events

---

**Project: lect90_HybridAuth-SessionJWT**  
**Implementation Date: 2025**  
**Dependencies: Express, Drizzle ORM, JWT, Argon2, Request-IP**

---
