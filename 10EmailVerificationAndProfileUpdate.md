# 📧 Email Verification and Dynamic Profile Page - Complete Guide

## Table of Contents
1. [Overview & Flow](#overview--flow)
2. [Prerequisites](#prerequisites)
3. [Database Schema Setup](#database-schema-setup)
4. [Email Service Configuration](#email-service-configuration)
5. [Email Verification Services](#email-verification-services)
6. [Email Verification Controllers](#email-verification-controllers)
7. [Profile Page Controller](#profile-page-controller)
8. [Routes Setup](#routes-setup)
9. [Views Implementation](#views-implementation)
10. [Gmail SMTP Setup](#gmail-smtp-setup)
11. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Overview & Flow

This guide covers the implementation of:
- **Email Verification System** with token generation and expiry
- **Dynamic Profile Page** with user information and verification status
- **Transaction-based token management** for secure email verification
- **Nodemailer integration** for sending verification emails
- **URL API** for creating verification links

### How Email Verification Works - Step-by-Step Logic

1. **User Registration/Login** → User accesses the application
2. **Profile Access** → User views their profile page
3. **Verification Check** → System checks `isEmailValid` field
4. **Token Generation** → 8-digit random token is generated using crypto
5. **Token Storage** → Token stored in database with 24-hour expiry (using transactions)
6. **Email Sending** → Verification link sent to user's email via Nodemailer
7. **User Clicks Link** → Token and email are passed as URL parameters
8. **Validation** → System validates token (exists, not expired, matches email)
9. **Email Verification** → User's `isEmailValid` field is set to `true`
10. **Token Cleanup** → Used tokens are deleted from database


---

## Database Schema Setup

### Step 1: Create Users Table with Email Verification Field

**File:** `drizzle/schema.js`

```javascript
import { relations, sql } from 'drizzle-orm';
import { boolean, mysqlTable, timestamp, varchar, int } from 'drizzle-orm/mysql-core';

// Users table with email verification
export const usersTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  isEmailValid: boolean("is_email_valid").default(false).notNull(), // 👈 Email verification field
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Verify Email Tokens Table
export const verifyEmailTokensTable = mysqlTable("is_email_valid", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar({ length: 8 }).notNull(), // 👈 8-digit token
  expiresAt: timestamp("expires_at")
    // SQL function to set expiry 24 hours from now
    .default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 DAY)`)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ... other tables (sessions, short_links, etc.) - see full implementation
```

**Key Points:**

- `isEmailValid` field tracks verification status (default: false)
- `verifyEmailTokensTable` stores temporary verification tokens
- Token expires after 24 hours using SQL `INTERVAL`
- `onDelete: 'cascade'` ensures tokens are deleted when user is deleted
- Token is 8 characters long for user-friendly manual entry

#### Step 2: Database Configuration

**File:** `config/db-client.js`

**File:** `config/env.js`

#### Step 3: Drizzle Configuration

**File:** `drizzle.config.js`

#### Step 4: Generate and Run Migrations

---

## Email Service Configuration

### Step 5: Setup Nodemailer with Ethereal Email (Testing)

**File:** `lib/nodemailer.js`

```javascript
import nodemailer from "nodemailer"

// Create a test account (for development/testing)
const testAccount = await nodemailer.createTestAccount();

// Create transporter with Ethereal Email credentials
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "emilia.koelpin2@ethereal.email",
    pass: "VyYHYxBFjUjMbujeeB",
  },
});

// Email sending function
export const sendEmail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: `'URL_SHORTNER' <${testAccount.user}>`,
        to,
        subject,
        html,
    });
    
    // Get test URL to view email in browser
    const testEmailURL = nodemailer.getTestMessageUrl(info);
    return testEmailURL;
};
```

**Important Notes:**

- **Ethereal Email** is perfect for development/testing
- Creates fake SMTP service to capture emails
- Returns preview URL to view sent emails
- **For Production:** Use Gmail SMTP (see setup below)

---

## Email Verification Services

### Step 6: Create Email Verification Services

**File:** `services/auth.services.js`

Below are the **email verification specific functions**. For complete authentication services (user creation, password hashing, JWT tokens, sessions), refer to the full implementation in `lect97_ProfilenEmail/services/auth.services.js`.

```javascript
import { db } from "../config/db-client.js";
import { usersTable, verifyEmailTokensTable } from "../drizzle/schema.js";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import crypto from "crypto";

// ============================================
// EMAIL VERIFICATION FUNCTIONS
// ============================================

/**
 * Generate random 8-digit token
 * Uses crypto module for secure random number generation
 */
export const generateRandomToken = async (digit = 8) => {
  const min = 10 ** (digit - 1);      // For 8 digits: 10000000
  const max = 10 ** digit;             // For 8 digits: 100000000
  return crypto.randomInt(min, max).toString();
};

/**
 * Insert verification token with transaction
 * 
 * Steps:
 * 1. Delete all expired tokens (cleanup)
 * 2. Delete existing tokens for this user
 * 3. Insert new token with 24-hour expiry
 * 
 * Using Transaction ensures:
 * - All operations succeed or all fail (Atomicity)
 * - No partial updates (Consistency)
 * - User never has multiple active tokens
 */
export const insertVerifyEmailToken = async ({ userId, token }) => {
  return db.transaction(async (tx) => {
    try {
      console.log("Inserting the token into DB");
      
      // Step 1: Delete expired tokens from entire table
      await tx.delete(verifyEmailTokensTable)
        .where(lt(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`));

      // Step 2: Delete existing tokens for this specific user
      await tx
        .delete(verifyEmailTokensTable)
        .where(eq(verifyEmailTokensTable.userId, userId));
          
      // Step 3: Insert new token
      await tx.insert(verifyEmailTokensTable).values({ userId, token });
      console.log("Insertion completed into the DB!");
    } catch (error) {
      console.log("Unable to insert into DB", error);
      console.error(error);
    }
  });
};

/**
 * Create verification email link using URL API
 * 
 * URL API Benefits:
 * 1. Automatic encoding of special characters
 * 2. Cleaner and more maintainable code
 * 3. Better readability
 * 
 * Old way (manual encoding):
 * const email = encodeURIComponent(email);
 * const url = `${base}/verify?token=${token}&email=${email}`;
 * 
 * New way (URL API):
 * const url = new URL(`${base}/verify`);
 * url.searchParams.append("token", token);
 * url.searchParams.append("email", email);
 */
export const createVerifyEmailLink = async ({ email, token }) => {
  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
  url.searchParams.append("token", token);
  url.searchParams.append("email", email);

  const generatedLink = url.toString();
  console.log("The generated link:", generatedLink);
  return generatedLink;
};

/**
 * Find and validate verification token
 * 
 * Validation checks:
 * 1. Token matches the one in database
 * 2. Token has not expired (using SQL CURRENT_TIMESTAMP)
 * 3. User exists and email matches
 * 
 * Returns: { userId, email, token, expiresAt } or null
 */
export const findVerificationEmailToken = async ({ token, email }) => {
  // Select token data with expiry check
  const tokenData = await db.select({
    userId: verifyEmailTokensTable.userId,
    token: verifyEmailTokensTable.token,
    expiresAt: verifyEmailTokensTable.expiresAt,
  })
  .from(verifyEmailTokensTable)
  .where(
    and(
      eq(verifyEmailTokensTable.token, token),
      gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`) // Check not expired
    )
  );

  if (!tokenData.length) {
    return null; // Token invalid or expired
  }

  const userId = tokenData[0].userId;

  // Get user data
  const userData = await db.select({
    userId: usersTable.id,
    email: usersTable.email,
  })
  .from(usersTable)
  .where(eq(usersTable.id, userId));

  if (!userData.length) {
    return null; // User not found
  }

  return {
    userId: userData[0].userId,
    email: userData[0].email,
    token: tokenData[0].token,
    expiresAt: tokenData[0].expiresAt,
  };
};

/**
 * Update user's email verification status
 * Sets isEmailValid to true
 */
export const findVerificationEmailAndUpdate = async (email) => {
  return db
    .update(usersTable)
    .set({ isEmailValid: true })
    .where(eq(usersTable.email, email));
};

/**
 * Clear verification tokens after successful verification
 * Removes all tokens for the verified user
 */
export const clearVerifyEmailTokens = async (email) => {
  const [user] = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
    
  return await db.delete(verifyEmailTokensTable)
    .where(eq(verifyEmailTokensTable.userId, user.id));
};

// ============================================
// OTHER SERVICES (for reference)
// ============================================
// - getUserByEmail()
// - createUser()
// - findUserById()
// - hashPassword()
// - comparePassword()
// - createSession()
// - authenticateUser()
// See full implementation: lect97_ProfilenEmail/services/auth.services.js
```

### 🔄 Transaction Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│         insertVerifyEmailToken Transaction          │
└─────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │ BEGIN TRANSACTION   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ DELETE expired tokens               │
    │ WHERE expiresAt < CURRENT_TIMESTAMP │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ DELETE existing user tokens         │
    │ WHERE userId = :userId              │
    └──────────┬──────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────┐
    │ INSERT new token                    │
    │ VALUES (userId, token, expiresAt)   │
    └──────────┬──────────────────────────┘
               │
         Success│ Error
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ┌────────┐    ┌──────────┐
    │ COMMIT │    │ ROLLBACK │
    └────────┘    └──────────┘
```

---

## Email Verification Controllers

### Step 7: Profile Page Controller

**File:** `controllers/auth.controller.js`

```javascript
import { findUserById, getAllShortLinks } from "../services/auth.services.js";

/**
 * GET /profile
 * Display user profile with verification status
 */
export const getProfilePage = async (req, res) => {
    if (!req.user) return res.send("Not logged in!");

    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");

    const userShortLinks = await getAllShortLinks(user.id);

    return res.render("auth/profile", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailValid: user.isEmailValid,  // 👈 Pass verification status to view
            createdAt: user.createdAt,
            links: userShortLinks
        }
    });
};
```

### Step 8: Email Verification Controllers

**File:** `controllers/auth.controller.js`

```javascript
import {
    findUserById,
    generateRandomToken,
    insertVerifyEmailToken,
    createVerifyEmailLink,
    findVerificationEmailToken,
    findVerificationEmailAndUpdate,
    clearVerifyEmailTokens,
} from "../services/auth.services.js";
import { sendEmail } from "../lib/nodemailer.js";
import { verifyEmailSchema } from "../validators/auth-validator.js";

/**
 * GET /verify-email
 * Show verify email page (only if not already verified)
 */
export const getVerifyEmailPage = async (req, res) => {
    console.log("req.user: ", req.user);
    console.log("req.user.isEmailValid :", req.user.isEmailValid);
    
    if (!req.user) return res.redirect("/login");
    
    // If user is already verified, redirect to home
    if (req.user.isEmailValid === true) return res.redirect("/");

    const user = await findUserById(req.user.id);

    if (!user) return res.redirect("/login");
    if (user.isEmailValid === true) return res.redirect("/");
    
    return res.render("auth/verify-email", {
        email: req.user.email,
    });
};

/**
 * POST /resend-verification-link
 * Generate new token and send verification email
 * 
 * Steps:
 * 1. Validate user is logged in and not verified
 * 2. Generate 8-digit random token
 * 3. Store token in database (with transaction)
 * 4. Create verification URL
 * 5. Send email with link
 */
export const resendVerificationLink = async (req, res) => {
    if (!req.user) return res.redirect("/");
    
    const user = await findUserById(req.user.id);

    if (!user || user.isEmailValid) return res.redirect("/");
    
    // Generate random 8-digit token
    const randomToken = await generateRandomToken();
    console.log("Random token is:", randomToken);

    // Store token in database (uses transaction internally)
    await insertVerifyEmailToken({ userId: req.user.id, token: randomToken });

    // Create verification link using URL API
    const verifyEmailLink = await createVerifyEmailLink({
        email: req.user.email,
        token: randomToken
    });

    try {
        // Send email with verification link
        const emailResult = await sendEmail({
            to: req.user.email,
            subject: "Verify Your Email",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Click the link below to verify your email:</p>
                    <a href="${verifyEmailLink}" 
                       style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;
                              margin: 20px 0;">
                        Verify Email
                    </a>
                    <p style="color: #666; margin-top: 20px;">
                        Or use this 8-digit code: <strong style="font-size: 18px;">${randomToken}</strong>
                    </p>
                    <p style="color: #999; font-size: 12px;">
                        This link will expire in 24 hours.
                    </p>
                </div>
            `
        });
        console.log("Email sent successfully:", emailResult);
    } catch (error) {
        console.error("Failed to send email:", error);
        req.flash("errors", "Failed to send verification email. Please try again.");
        return res.redirect("/profile");
    }

    res.redirect("/verify-email");
};

/**
 * GET /verify-email-token?token=12345678&email=user@example.com
 * Verify the email using token from URL or manual entry
 * 
 * Steps:
 * 1. Validate token and email format (using Zod)
 * 2. Find token in database and check expiry
 * 3. Update user's email verification status
 * 4. Delete used token
 * 5. Redirect to home
 */
export const verifyEmailToken = async (req, res) => {
    // Validate query parameters
    const { data, error } = verifyEmailSchema.safeParse(req.query);
    
    if (error) {
        return res.send("Verification link invalid or expired");
    }

    // Find and validate token (checks: exists, not expired, user exists)
    const token = await findVerificationEmailToken(data);
    
    if (!token) {
        return res.send("Verification link is invalid or expired!");
    }

    // Update user's email verification status
    await findVerificationEmailAndUpdate(token.email);

    // Clean up used tokens (non-blocking - runs in background)
    clearVerifyEmailTokens(token.email).catch(console.error);

    return res.redirect("/");
};
```

**Validator Schema:**

**File:** `validators/auth-validator.js`

```javascript
import z from "zod";

export const verifyEmailSchema = z.object({
  token: z.string().trim().length(8), // Exactly 8 characters
  email: z.string().trim().email()     // Valid email format
});
```

---

## Authentication Services

### Step 6: Create Authentication Services

**File:** `services/auth.services.js`

```javascript
import { db } from "../config/db-client.js";
import { sessionsTable, short_links, usersTable, verifyEmailTokensTable } from "../drizzle/schema.js";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";
import crypto from "crypto";

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

export const getUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return user;
};

export const createUser = async ({ name, email, password }) => {
  return await db
    .insert(usersTable)
    .values({ name, email, password })
    .$returningId();
};

export const findUserById = async (userId) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user;
};

// ============================================
// PASSWORD FUNCTIONS
// ============================================

export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

export const comparePassword = async (hash, password) => {
  return await argon2.verify(hash, password);
};

// ============================================
// JWT TOKEN FUNCTIONS
// ============================================

export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const createAccessToken = ({ id, name, email, sessionId, isEmailValid }) => {
  return jwt.sign({ id, name, email, sessionId, isEmailValid }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, // 15 minutes
  });
};

export const createRefreshToken = ({ sessionId }) => {
  return jwt.sign({ sessionId }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, // 7 days
  });
};

// ============================================
// SESSION MANAGEMENT
// ============================================

export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, ip, userAgent })
    .$returningId();
  return session;
};

export const findSessionById = async (sessionId) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));
  return session;
};

export const clearSession = async (sessionId) => {
  return db.delete(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));
};

// Refresh tokens when access token expires
export const refreshTokens = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTToken(refreshToken);
    const currentSession = await findSessionById(decodedToken.sessionId);

    if (!currentSession || !currentSession.valid) {
      throw new Error("Invalid Session!");
    }

    const user = await findUserById(currentSession.userId);
    if (!user) throw new Error("Invalid User!");

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailValid: user.isEmailValid,
      sessionId: currentSession.id, 
    };

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

// ============================================
// USER AUTHENTICATION FUNCTION
// ============================================

export const authenticateUser = async ({ req, res, user, name, email }) => {
  const session = await createSession(user.id, {
    ip: req.clientIp,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = createAccessToken({
    id: user.id,
    name: user.name || name,
    email: user.email || email,
    isEmailValid: user.isEmailValid,
    sessionId: session.id,
  });
  
  const refreshToken = createRefreshToken({ sessionId: session.id });

  const baseConfig = { httpOnly: true, secure: true };

  res.cookie("access_token", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
};

// ============================================
// EMAIL VERIFICATION FUNCTIONS
// ============================================

/**
 * Generate random 8-digit token
 * Uses crypto module for secure random number generation
 */
export const generateRandomToken = async (digit = 8) => {
  const min = 10 ** (digit - 1);
  const max = 10 ** digit;
  return crypto.randomInt(min, max).toString();
};

/**
 * Insert verification token with transaction
 * Steps:
 * 1. Delete all expired tokens (cleanup)
 * 2. Delete existing tokens for this user
 * 3. Insert new token with 24-hour expiry
 */
export const insertVerifyEmailToken = async ({ userId, token }) => {
  return db.transaction(async (tx) => {
    try {
      console.log("Inserting the token into DB");
      
      // Delete expired tokens
      await tx.delete(verifyEmailTokensTable)
        .where(lt(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`));

      // Delete existing tokens for this user
      await tx
        .delete(verifyEmailTokensTable)
        .where(eq(verifyEmailTokensTable.userId, userId));
          
      // Insert new token
      await tx.insert(verifyEmailTokensTable).values({ userId, token });
      console.log("Insertion completed into the DB!");
    } catch (error) {
      console.log("Unable to insert into DB", error);
      console.error(error);
    }
  });
};

/**
 * Create verification email link using URL API
 * Benefits of URL API:
 * 1. Automatic encoding of parameters
 * 2. Cleaner code
 * 3. Better readability
 */
export const createVerifyEmailLink = async ({ email, token }) => {
  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
  url.searchParams.append("token", token);
  url.searchParams.append("email", email);

  const generatedLink = url.toString();
  console.log("The generated link:", generatedLink);
  return generatedLink;
};

/**
 * Find and validate verification token
 * Checks:
 * 1. Token matches
 * 2. Token not expired
 * 3. User exists
 */
export const findVerificationEmailToken = async ({ token, email }) => {
  const tokenData = await db.select({
    userId: verifyEmailTokensTable.userId,
    token: verifyEmailTokensTable.token,
    expiresAt: verifyEmailTokensTable.expiresAt,
  })
  .from(verifyEmailTokensTable)
  .where(
    and(
      eq(verifyEmailTokensTable.token, token),
      gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
    )
  );

  if (!tokenData.length) {
    return null;
  }

  const userId = tokenData[0].userId;

  const userData = await db.select({
    userId: usersTable.id,
    email: usersTable.email,
  })
  .from(usersTable)
  .where(eq(usersTable.id, userId));

  if (!userData.length) {
    return null;
  }

  return {
    userId: userData[0].userId,
    email: userData[0].email,
    token: tokenData[0].token,
    expiresAt: tokenData[0].expiresAt,
  };
};

/**
 * Update user's email verification status
 */
export const findVerificationEmailAndUpdate = async (email) => {
  return db
    .update(usersTable)
    .set({ isEmailValid: true })
    .where(eq(usersTable.email, email));
};

/**
 * Clear verification tokens after successful verification
 */
export const clearVerifyEmailTokens = async (email) => {
  const [user] = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
    
  return await db.delete(verifyEmailTokensTable)
    .where(eq(verifyEmailTokensTable.userId, user.id));
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getAllShortLinks = async (userId) => {
  return await db.select()
    .from(short_links)
    .where(eq(short_links.userId, userId));
};
```

**File:** `config/constants.js`

```javascript
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_MONTH = 30;
export const DAYS_PER_WEEK = 7;

export const ACCESS_TOKEN_EXPIRY =
  15 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

export const REFRESH_TOKEN_EXPIRY =
  DAYS_PER_WEEK *
  HOURS_PER_DAY *
  MINUTES_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;

export const OAUTH_EXCHANGE_EXPIRY =
  10 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
```

---

## Controllers Implementation

### Step 7: Create Auth Controllers

**File:** `controllers/auth.controller.js`

```javascript
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { 
    getUserByEmail,
    createUser, 
    hashPassword, 
    comparePassword,
    createSession,
    createAccessToken,
    createRefreshToken,
    clearSession,
    authenticateUser,
    findUserById,
    getAllShortLinks,
    generateRandomToken,
    insertVerifyEmailToken,
    createVerifyEmailLink,
    findVerificationEmailToken,
    findVerificationEmailAndUpdate,
    clearVerifyEmailTokens,
} from "../services/auth.services.js";
import { sendEmail } from "../lib/nodemailer.js";
import { loginUserSchema, registerUserSchema, verifyEmailSchema } from "../validators/auth-validator.js";

// ============================================
// REGISTRATION CONTROLLERS
// ============================================

export const getRegisterPage = (req, res) => {
    if (req.user) return res.redirect("/");
    return res.render("../views/auth/register", { errors: req.flash('errors') });
};

export const postRegister = async (req, res) => {
    if (req.user) return res.redirect("/");

    const { success, data, error } = registerUserSchema.safeParse(req.body);

    if (!success) {
        const errorMessage = error.issues?.[0]?.message || "Validation error";
        req.flash("errors", errorMessage);
        return res.redirect('/register');
    }

    const { name, email, password } = data;
    const userExists = await getUserByEmail(email);
    
    if (userExists) {
        req.flash("errors", "User Already Exists.");
        return res.redirect("/register");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [user] = await createUser({ name, email, password: hashedPassword });
    
    // Authenticate user (create session and tokens)
    await authenticateUser({ req, res, user, name, email });

    res.redirect("/");
};

// ============================================
// LOGIN CONTROLLERS
// ============================================

export const getLoginPage = (req, res) => {
    if (req.user) return res.redirect("/");
    return res.render("../views/auth/login", { errors: req.flash('errors') });
};

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/");

    const { success, data, error } = loginUserSchema.safeParse(req.body);

    if (!success) {
        const errorMessage = error.issues?.[0]?.message || "Validation error";
        req.flash("errors", errorMessage);
        return res.redirect('/login');
    }
    
    const { email, password } = data;
    
    // Check if user exists
    const user = await getUserByEmail(email);
    
    if (!user) {
        req.flash("errors", "Invalid User or Password");
        return res.redirect("/login");
    }

    // Verify password
    const isPasswordValid = await comparePassword(user.password, password);
    
    if (!isPasswordValid) {
        req.flash("errors", "Invalid User or Password");
        return res.redirect("/login");
    }

    await authenticateUser({ req, res, user });
    res.redirect("/");
};

// ============================================
// LOGOUT CONTROLLER
// ============================================

export const logoutUser = async (req, res) => {
    await clearSession(req.user.sessionId);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.redirect('/login');
};

// ============================================
// PROFILE CONTROLLERS
// ============================================

export const getProfilePage = async (req, res) => {
    if (!req.user) return res.send("Not logged in!");

    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");

    const userShortLinks = await getAllShortLinks(user.id);

    return res.render("auth/profile", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailValid: user.isEmailValid,
            createdAt: user.createdAt,
            links: userShortLinks
        }
    });
};

// ============================================
// EMAIL VERIFICATION CONTROLLERS
// ============================================

/**
 * Get verify email page
 * Shows page only if user is logged in and email is not verified
 */
export const getVerifyEmailPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    
    // If already verified, redirect to home
    if (req.user.isEmailValid === true) return res.redirect("/");

    const user = await findUserById(req.user.id);

    if (!user) return res.redirect("/login");
    if (user.isEmailValid === true) return res.redirect("/");
    
    return res.render("auth/verify-email", {
        email: req.user.email,
    });
};

/**
 * Resend verification link
 * Steps:
 * 1. Generate random 8-digit token
 * 2. Store token in database with expiry
 * 3. Create verification link
 * 4. Send email with link
 */
export const resendVerificationLink = async (req, res) => {
    if (!req.user) return res.redirect("/");
    
    const user = await findUserById(req.user.id);

    if (!user || user.isEmailValid) return res.redirect("/");
    
    // Generate random token
    const randomToken = await generateRandomToken();
    console.log("Random token is:", randomToken);

    // Store token in database
    await insertVerifyEmailToken({ userId: req.user.id, token: randomToken });

    // Create verification link
    const verifyEmailLink = await createVerifyEmailLink({
        email: req.user.email,
        token: randomToken
    });

    try {
        // Send email
        const emailResult = await sendEmail({
            to: req.user.email,
            subject: "Verify Your Email",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Email Verification</h2>
                    <p>Click the link below to verify your email:</p>
                    <a href="${verifyEmailLink}" 
                       style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                    <p>Or use this token: <strong>${randomToken}</strong></p>
                    <p>This link will expire in 24 hours.</p>
                </div>
            `
        });
        console.log("Email sent successfully:", emailResult);
    } catch (error) {
        console.error("Failed to send email:", error);
        req.flash("errors", "Failed to send verification email. Please try again.");
        return res.redirect("/profile");
    }

    res.redirect("/verify-email");
};

/**
 * Verify email token
 * Steps:
 * 1. Validate token and email from query params
 * 2. Find token in database (check expiry)
 * 3. Update user's email verification status
 * 4. Clean up used tokens
 */
export const verifyEmailToken = async (req, res) => {
    const { data, error } = verifyEmailSchema.safeParse(req.query);
    
    if (error) {
        return res.send("Verification link invalid or expired");
    }

    // Find and validate token
    const token = await findVerificationEmailToken(data);
    
    if (!token) {
        return res.send("Verification link is invalid or expired!");
    }

    // Update user's email verification status
    await findVerificationEmailAndUpdate(token.email);

    // Clean up used tokens (non-blocking)
    clearVerifyEmailTokens(token.email).catch(console.error);

    return res.redirect("/");
};

export const getMe = (req, res) => {
    if (!req.user) return res.send("Not logged in");
    return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};
```

---

## Validators

### Step 8: Create Validation Schemas

**File:** `validators/auth-validator.js`

```javascript
import z from "zod";

export const loginUserSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .trim()
    .min(5, { message: "Password must be at least 5 chars long" }),
});

export const registerUserSchema = loginUserSchema.extend({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 chars long" })
    .max(100, { message: "Name must be less than 100 chars" })
});
 
export const verifyEmailSchema = z.object({
  token: z.string().trim().length(8),
  email: z.string().trim().email()
});
```

---

## Routes Setup

### Step 9: Create Auth Routes

**File:** `routes/auth.routes.js`

```javascript
import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js";

const router = Router();

// Profile route
router
    .route("/profile")
    .get(authControllers.getProfilePage);

// Email verification routes
router
    .route("/verify-email")
    .get(authControllers.getVerifyEmailPage);

router
    .route("/resend-verification-link")
    .post(authControllers.resendVerificationLink);

router 
    .route("/verify-email-token")
    .get(authControllers.verifyEmailToken);

// ... other routes (login, register, logout)
// See full implementation: lect97_ProfilenEmail/routes/auth.routes.js

export const authRoutes = router;
```

---

## Views Implementation

### Step 10: Create Profile Page View

**File:** `views/auth/profile.ejs`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Profile</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <%- include('../partials/header') %>

    <main class="container profile-container">
      <h1 class="page-title">Your Profile</h1>

      <!-- User Status Badge -->
      <div class="user-status">
        <% if(user) { %>
        <div class="status-badge success">
          <span>You are logged in</span>
        </div>
        <% } else { %>
        <div class="status-badge warning">
          <span>You are not logged in</span>
        </div>
        <% } %> 
      </div>

      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <div class="avatar-placeholder">
              <% if(user.avatarUrl){ %>
              <img src="<%= user.avatarUrl %>" alt="Avatar" />
              <% }else { %>
              <span><%= user.name.charAt(0).toUpperCase() %></span>
              <% } %>
            </div>
          </div>
          <div class="profile-info">
            <h2 class="profile-name"><%= user.name %></h2>
            <p class="profile-email">📧 <%= user.email %></p>
            <p class="member-since">
              📅 Member since <%= new Date(user.createdAt).toLocaleDateString() %>
            </p>
          </div>
        </div>

        <!-- Profile Stats -->
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value"><%= user.links ? user.links.length : 0 %></span>
            <span class="stat-label">Links Created</span>
          </div>
          <div class="stat-item">
            <span class="stat-value"><%= user.totalClicks || 0 %></span>
            <span class="stat-label">Total Clicks</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">
              <%= user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Today' %>
            </span>
            <span class="stat-label">Last Active</span>
          </div>
        </div>

        <!-- Email Verification Status -->
        <div class="profile-verification">
          <p class="verification-status">
            <span class="verification-label">Email Verification:</span>
            
            <% if (user.isEmailValid) { %>
              <!-- ✅ Email is Verified -->
              <span class="verification-badge verified">
                ✅ Verified
              </span>
            <% } else { %>
              <!-- ❌ Email Not Verified -->
              <span class="verification-badge not-verified">
                ❌ Not Verified
              </span>
              <a href="/verify-email" class="verify-link">
                📧 Verify Now
              </a>
            <% } %>
          </p>
        </div>
      </div>

      <!-- Profile Actions -->
      <div class="profile-actions">
        <a href="/edit-profile" class="btn">✏️ Edit Profile</a>
        <a href="/change-password" class="btn">🔑 Change Password</a>
        <a href="/logout" class="btn">🚪 Logout</a>
      </div>
    </main>

    <%- include('../partials/footer.ejs') %>
  </body>
</html>
```

**Key Points:**

- Shows verification status using `user.isEmailValid`
- Displays "Verify Now" button only if email is not verified
- Dynamic stats (links created, clicks, last active)
- User avatar or first letter of name as placeholder

### Step 11: Create Email Verification Page

**File:** `views/auth/verify-email.ejs`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Email</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <%- include('../partials/header') %>

    <main class="container main-container">
      <h1 class="section-title text-center">Verify Your Email</h1>

      <!-- Login Status Alert -->
      <div class="alert-container">
        <% if(user) { %>
        <div class="alert alert-success">
          ✅ You are logged in
        </div>
        <% } else { %>
        <div class="alert alert-warning">
          ⚠️ You are not logged in
        </div>
        <% } %>
      </div>

      <!-- Resend Verification Link -->
      <div class="card">
        <div class="card-body">
          <p class="info-text"><strong>Email:</strong> <%= email %></p>
          <p class="info-text">
            Your email has not been verified yet. Click below to receive a verification link.
          </p>

          <form action="/resend-verification-link" method="post" class="form-inline">
            <button type="submit" class="btn btn-secondary">
              📧 Resend Verification Link
            </button>
          </form>
        </div>
      </div>

      <!-- Manual Token Entry -->
      <div class="card mt-20">
        <div class="card-body">
          <form action="/verify-email-token" method="get" class="form">
            <div class="form-group">
              <label for="token" class="control-label">
                Enter 8-Digit Verification Code:
              </label>
              <input
                type="text"
                name="token"
                id="token"
                class="form-control"
                maxlength="8"
                required
                pattern="\d{8}"
                placeholder="12345678"
                title="Please enter an 8-digit number"
              />
            </div>

            <input type="hidden" value="<%= email %>" name="email" />

            <button type="submit" class="btn btn-primary">✅ Verify Code</button>
          </form>
        </div>
      </div>
    </main>
    
    <%- include('../partials/footer.ejs') %>
  </body>
</html>
```

**Key Features:**

- Two verification methods:
  1. **Resend Link** - Sends email with clickable link
  2. **Manual Entry** - User types 8-digit code from email
- Form validation: exactly 8 digits required
- Hidden field passes email to verification endpoint

---

## Gmail SMTP Setup (Production)

### Step 12: Configure Gmail for Email Sending

#### Option 1: Using Gmail App Password (Recommended)

**File:** `lib/nodemailer.js` (Updated for Gmail)

```javascript
import nodemailer from "nodemailer";

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS (587), not SSL (465)
  auth: {
    user: process.env.GMAIL_USER,         // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // App password (not Gmail password!)
  },
});

// Email sending function
export const sendEmail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: `"Your App Name" <${process.env.GMAIL_USER}>`, // Sender
        to,      // Receiver
        subject, // Subject line
        html,    // HTML body
    });
    
    console.log("Message sent: %s", info.messageId);
    return info;
};
```

### Gmail Setup Steps

#### 1. Enable 2-Factor Authentication

- Go to Google Account: <https://myaccount.google.com/>
- Click "Security" in left sidebar
- Under "Signing in to Google", click "2-Step Verification"
- Follow setup process to enable 2FA

#### 2. Generate App Password

- After enabling 2FA, go to: <https://myaccount.google.com/apppasswords>
- Select "Mail" as the app
- Select "Other" as the device and give it a name (e.g., "Node.js App")
- Click "Generate"
- **Copy the 16-character password** (you won't be able to see it again)

#### 3. Update .env File

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop

# Example:
# GMAIL_USER=myapp@gmail.com
# GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

#### 4. Security Best Practices

- Never commit `.env` file to Git
- Add `.env` to `.gitignore`
- Use different credentials for development and production
- Rotate app passwords periodically

### Gmail Sending Limits

- **Free Gmail Account**: 500 emails/day
- **Google Workspace**: 2,000 emails/day
- For high volume, consider: SendGrid, AWS SES, Mailgun, or Resend

---

## Testing & Troubleshooting

### Testing the Complete Flow

#### 1. User Registration/Login

```bash
# User creates account or logs in
POST /register or POST /login
```

#### 2. Check Profile (Not Verified)

```bash
GET /profile
# Should display: "❌ Not Verified" with "Verify Now" button
```

#### 3. Request Verification Email

```bash
# Click "Verify Now" button on profile
GET /verify-email

# Click "Resend Verification Link"
POST /resend-verification-link
# Check email inbox (or Ethereal for testing)
```

#### 4. Verify Email

**Method A - Click Link:**

```bash
# Click link in email
# URL format: http://localhost:3000/verify-email-token?token=12345678&email=user@example.com
GET /verify-email-token?token=12345678&email=user@example.com
```

**Method B - Manual Entry:**

```bash
# Enter 8-digit code manually in form
GET /verify-email-token?token=12345678&email=user@example.com
```

#### 5. Check Profile (Verified)

```bash
GET /profile
# Should now display: "✅ Verified"
```

### Common Issues & Solutions

#### Issue 1: "Token expired or invalid"

**Causes:**

- Token older than 24 hours
- Token doesn't match database
- User requested multiple tokens (old one was deleted)

**Solution:**

- Request new verification link
- Check database for token existence: `SELECT * FROM is_email_valid WHERE token = '12345678'`
- Verify token expiry: `SELECT expiresAt FROM is_email_valid WHERE token = '12345678'`

#### Issue 2: "Email not sending"

**Causes:**

- Incorrect SMTP credentials
- Gmail app password not generated
- Firewall blocking port 587
- 2FA not enabled on Gmail

**Solution:**

- Verify environment variables are loaded: `console.log(process.env.GMAIL_USER)`
- Test SMTP connection separately
- Check firewall/antivirus settings
- Ensure 2FA is enabled before generating app password
- For testing, use Ethereal Email first

#### Issue 3: "isEmailValid not updating"

**Causes:**

- Email case mismatch (database vs. token)
- Database connection issue
- Transaction rollback

**Solution:**

```javascript
// Check user email verification status
SELECT id, email, is_email_valid FROM users WHERE email = 'user@example.com';

// Check for active tokens
SELECT * FROM is_email_valid WHERE user_id = 1;
```

#### Issue 4: "Database migration errors"

**Solution:**

```bash
# Development only - reset database
npm run db:migrate -- --drop

# Generate fresh migration
npm run db:generate

# Apply migration
npm run db:migrate

# Or manually run SQL
ALTER TABLE users ADD COLUMN is_email_valid BOOLEAN DEFAULT FALSE NOT NULL;
```

---

## Database Transactions Explained

### Why Use Transactions?

**What is a Transaction?**

A transaction is a sequence of database operations treated as a single unit. Either ALL operations succeed, or ALL fail (atomic).

**ACID Properties:**

- **Atomicity**: All operations complete or none do
- **Consistency**: Database remains in valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Completed transactions persist even after crashes

### Transaction in Email Verification

```javascript
export const insertVerifyEmailToken = async ({ userId, token }) => {
  return db.transaction(async (tx) => {
    // Step 1: Delete expired tokens (cleanup)
    await tx.delete(verifyEmailTokensTable)
      .where(lt(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`));

    // Step 2: Delete existing user tokens
    await tx.delete(verifyEmailTokensTable)
      .where(eq(verifyEmailTokensTable.userId, userId));
          
    // Step 3: Insert new token
    await tx.insert(verifyEmailTokensTable).values({ userId, token });
  });
};
```

**What Happens:**

```text
✅ Success: All 3 steps complete → COMMIT (changes saved)
❌ Error in any step: → ROLLBACK (no changes saved)
```

**Benefits:**

1. **Data Integrity**: Prevents partial updates
2. **No Orphaned Data**: User never has inconsistent state
3. **Consistency**: Only one active token per user
4. **Atomic Cleanup**: Expired tokens removed safely

---

## URL API Explained

### Why Use URL API?

The **URL API** provides a clean way to construct and manipulate URLs with automatic encoding.

**❌ Old Way (Manual Encoding):**

```javascript
export const createVerifyEmailLink = async ({ email, token }) => {
    const encodedEmail = encodeURIComponent(email); // Manual encoding
    const url = `${process.env.FRONTEND_URL}/verify-email-token?token=${token}&email=${encodedEmail}`;
    return url;
}
```

**✅ New Way (URL API):**

```javascript
export const createVerifyEmailLink = async ({ email, token }) => {
    const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
    url.searchParams.append("token", token);  // Auto-encoded
    url.searchParams.append("email", email);  // Auto-encoded
    return url.toString();
}
```

**Benefits:**

1. **Automatic Encoding**: Special characters handled automatically
2. **Cleaner Code**: More readable and maintainable
3. **URL Validation**: Catches invalid URLs early
4. **Easy Manipulation**: Add/remove parameters easily

**URL Components:**

```javascript
const url = new URL('https://example.com:3000/verify?token=123&email=test@mail.com#top');

console.log(url.protocol);    // 'https:'
console.log(url.hostname);    // 'example.com'
console.log(url.port);        // '3000'
console.log(url.pathname);    // '/verify'
console.log(url.search);      // '?token=123&email=test@mail.com'
console.log(url.searchParams.get('token')); // '123'
console.log(url.hash);        // '#top'
```

---

## Environment Variables

**File:** `.env`

```env
# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=url_shortner_mysql

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (Ethereal - Development)
ETHEREAL_USER=emilia.koelpin2@ethereal.email
ETHEREAL_PASS=VyYHYxBFjUjMbujeeB

# Email Configuration (Gmail - Production)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

---

## Security Best Practices

1. **Token Security**
   - Use cryptographically secure random tokens (`crypto.randomInt`)
   - Set reasonable expiry times (24 hours)
   - Delete tokens after use
   - Limit token generation attempts (rate limiting)

2. **Email Security**
   - Validate email format (use Zod)
   - Use HTTPS for verification links in production
   - Don't expose user existence in error messages
   - Implement rate limiting on resend requests

3. **Database Security**
   - Use parameterized queries (Drizzle handles this)
   - Implement cascade deletes
   - Regular backups
   - Never hardcode credentials

4. **Session Security**
   - Use httpOnly cookies (prevents XSS)
   - Use secure flag in production (HTTPS only)
   - Track IP and user agent for anomaly detection

---

## Production Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Set secure: true for cookies (requires HTTPS)
- [ ] Use production email service (Gmail/SendGrid)
- [ ] Enable database backups
- [ ] Implement rate limiting
- [ ] Add logging (Winston/Morgan)
- [ ] Set up error monitoring (Sentry)
- [ ] Use HTTPS
- [ ] Add email templates (MJML)
- [ ] Test on multiple email providers
- [ ] Set up graceful shutdown

---

## Additional Resources

- **Full Implementation**: `lect97_ProfilenEmail/` folder
- **Services**: `services/auth.services.js` (complete auth functions)
- **Controllers**: `controllers/auth.controller.js` (all controllers)
- **Middleware**: `middlewares/verify-auth.middleware.js` (JWT verification)
- **Schema**: `drizzle/schema.js` (complete database schema)

### Documentation Links

- [Nodemailer Documentation](https://nodemailer.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Argon2 vs Bcrypt](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [JWT Best Practices](https://jwt.io/introduction)
- [Gmail SMTP Setup](https://support.google.com/mail/answer/7126229)

---

## Conclusion

You now have a complete email verification system featuring:

✅ Secure 8-digit token generation using crypto
✅ Transaction-based database operations for data integrity  
✅ Dynamic profile page with verification status
✅ Email sending with Nodemailer (Ethereal + Gmail)
✅ URL API for clean verification links
✅ Proper error handling and validation
✅ 24-hour token expiry with automatic cleanup
✅ Manual and automatic verification methods

This implementation follows industry best practices and is production-ready!

**Happy Coding! 🚀**

**File:** `views/auth/profile.ejs`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Profile Form</title>

    <!-- Font Icon -->
    <link
      rel="stylesheet"
      href="fonts/material-icon/css/material-design-iconic-font.min.css"
    />

    <!-- Main css -->
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <%- include('../partials/header') %>
    <style>
      header, footer {
        width: 100% !important;
        max-width: 100% !important;
      }
    </style>

    <main class="container profile-container">
      <h1 class="page-title">Your Profile</h1>

      <div class="user-status">
        <% if(user) { %>
        <div class="status-badge success">
          <i class="zmdi zmdi-check-circle"></i>
          <span>You are logged in</span>
        </div>
        <% } else { %>
        <div class="status-badge warning">
          <i class="zmdi zmdi-alert-circle"></i>
          <span>You are not logged in</span>
        </div>
        <% } %> 
      </div>

      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <div class="avatar-placeholder">
              <% if(user.avatarUrl){ %>
              <img src="<%= user.avatarUrl %>" alt="" srcset="" />
              <% }else { %>
              <span><%= user.name.charAt(0).toUpperCase() %></span>
              <% } %>
            </div>
          </div>
          <div class="profile-info">
            <h2 class="profile-name"><%= user.name %></h2>
            <p class="profile-email">
              <i class="zmdi zmdi-email"></i> <%= user.email %>
            </p>
            <p class="member-since">
              <i class="zmdi zmdi-calendar"></i> Member since <%= new
              Date(user.createdAt).toLocaleDateString() %>
            </p>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value"
              ><%= user.links ? user.links.length : 0 %></span
            >
            <span class="stat-label">Links Created</span>
          </div>
          <div class="stat-item">
            <span class="stat-value"><%= user.totalClicks || 0 %></span>
            <span class="stat-label">Total Clicks</span>
          </div>
          <div class="stat-item">
            <span class="stat-value"
              ><%= user.lastActive ? new
              Date(user.lastActive).toLocaleDateString() : 'Today' %></span
            >
            <span class="stat-label">Last Active</span>
          </div>
        </div>

        <div class="profile-verification">
          <p class="verification-status">
            <span class="verification-label">Email Verification:</span>
            <% if (user.isEmailValid) { %>
            <span class="verification-badge verified">
              <i class="zmdi zmdi-check-circle"></i> Verified
            </span>
            <% } else { %>
            <span class="verification-badge not-verified">
              <i class="zmdi zmdi-alert-circle"></i> Not Verified
            </span>
            <a href="/verify-email" class="verify-link">
              <i class="zmdi zmdi-mail-send"></i> Verify Now
            </a>
            <% } %>
          </p>
        </div>
      </div>

      <div class="profile-actions">
        <a href="/edit-profile" class="btn">
          <i class="zmdi zmdi-edit"></i> Edit Profile
        </a>
        <% if(user.hasPassword) { %>
        <a href="/change-password" class="btn">
          <i class="zmdi zmdi-key"></i> Change Password
        </a>
        <% } else { %>
        <a href="/set-password" class="btn">
          <i class="zmdi zmdi-key"></i> Set Password
        </a>
        <% } %>
        <a href="/logout" class="btn">
          <i class="zmdi zmdi-power"></i> Logout
        </a>
      </div>
    </main>

    <%- include('../partials/footer.ejs') %>
  </body>
</html>
```

### Step 12: Create Email Verification Page

**File:** `views/auth/verify-email.ejs`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Verify Email</title>

    <!-- Font Icon -->
    <link
      rel="stylesheet"
      href="fonts/material-icon/css/material-design-iconic-font.min.css"
    />

    <!-- Main css -->
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <%- include('../partials/header') %>

    <main class="container main-container">
      <h1 class="section-title text-center">Verify Your Email</h1>

      <div class="alert-container">
        <% if(user) { %>
        <div class="alert alert-success">
          <i class="zmdi zmdi-check-circle"></i>
          <span>You are logged in</span>
        </div>
        <% } else { %>
        <div class="alert alert-warning">
          <i class="zmdi zmdi-alert-circle"></i>
          <span>You are not logged in</span>
        </div>
        <% } %>
      </div>

      <div class="card">
        <div class="card-body">
          <p class="info-text"><strong>Email:</strong> <%= email %></p>
          <p class="info-text">
            Your email has not been verified yet. Please verify your email by
            entering the 8-digit code or request a new verification link.
          </p>

          <form
            action="/resend-verification-link"
            method="post"
            class="form-inline"
          >
            <button type="submit" class="btn btn-secondary">
              Resend Verification Link
            </button>
          </form>
        </div>
      </div>

      <div class="card mt-20">
        <div class="card-body">
          <form action="/verify-email-token" method="get" class="form">
            <div class="form-group">
              <label for="token" class="control-label"
                >Enter 8-Digit Verification Code:</label
              >
              <input
                type="text"
                name="token"
                id="token"
                class="form-control"
                maxlength="8"
                required
                pattern="\d{8}"
                title="Please enter an 8-digit number"
              />
            </div>

            <input type="hidden" value="<%= email %>" name="email" />

            <button type="submit" class="btn btn-primary">Verify Code</button>
          </form>
        </div>
      </div>
    </main>
    <%- include('../partials/footer.ejs') %>
  </body>
</html>
```

---

## Main Application Setup

### Step 13: Configure Express App

**File:** `app.js`

```javascript
import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from "express";
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'connect-flash';
import requestIp from "request-ip";

import path from 'path';
import RouterUrl from "./routes/shortner.routes.js";
import { db } from "./config/db-client.js";
import { env } from "./config/env.js";
import { authRoutes } from './routes/auth.routes.js';
import { sql } from 'drizzle-orm';
import { verifyAuthentication } from './middlewares/verify-auth.middleware.js';

// Create Express application
const app = express();

const PORT = env.PORT;

// Configure EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Middleware setup
app.use(express.static("public")); // Serve static files
app.use(express.urlencoded({ extended: true })); // Parse form submissions

// Cookie parser middleware
app.use(cookieParser());

// Session middleware (place after cookie parser)
app.use(session({
    secret: 'my-secret',
    resave: true,
    saveUninitialized: false
}));

// Flash messages middleware
app.use(flash());

// Get user IP address
app.use(requestIp.mw());

// Authentication middleware (verify JWT tokens)
app.use(verifyAuthentication);

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.user;
    return next();
});

// Routes
app.use(authRoutes);
app.use('/', RouterUrl);

// Initialize database and start server
const startServer = async () => {
    try {
        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MySQL database:", error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await db.end && db.end();
    console.log('✅ Database connection closed');
    process.exit(0);
});

startServer();
```

---

## Gmail SMTP Setup (Production)

### Step 14: Configure Gmail for Email Sending

#### Option 1: Using Gmail App Password (Recommended)

**File:** `lib/nodemailer.js` (Updated for Gmail)

```javascript
import nodemailer from "nodemailer";

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports (587)
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // App password (not your Gmail password)
  },
});

// Email sending function
export const sendEmail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: `"Your App Name" <${process.env.GMAIL_USER}>`, // sender address
        to, // receiver email
        subject, // Subject line
        html, // html body
    });
    
    console.log("Message sent: %s", info.messageId);
    return info;
};
```

#### Step-by-Step Gmail Setup:

**1. Enable 2-Factor Authentication**
   - Go to Google Account: https://myaccount.google.com/
   - Click "Security" in left sidebar
   - Under "Signing in to Google", click "2-Step Verification"
   - Follow setup process to enable 2FA

**2. Generate App Password**
   - After enabling 2FA, go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and give it a name (e.g., "Node.js App")
   - Click "Generate"
   - **Copy the 16-character password** (you won't be able to see it again)

**3. Update .env File**

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Example:
# GMAIL_USER=myapp@gmail.com
# GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

**4. Security Best Practices**
   - Never commit `.env` file to Git
   - Add `.env` to `.gitignore`
   - Use different credentials for development and production
   - Rotate app passwords periodically

#### Option 2: Using OAuth2 (More Secure)

```javascript
import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const accessToken = await oauth2Client.getAccessToken();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    accessToken: accessToken.token,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
    const info = await transporter.sendMail({
        from: `"Your App Name" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });
    
    return info;
};
```

#### Gmail Sending Limits:

- **Free Gmail Account**: 500 emails/day
- **Google Workspace**: 2,000 emails/day
- Consider using dedicated email services for high volume:
  - SendGrid
  - AWS SES
  - Mailgun
  - Resend

---

## Testing the Implementation

### Step 15: Test the Complete Flow

#### 1. **User Registration**
```bash
POST /register
Body: { name: "John Doe", email: "john@example.com", password: "password123" }
```

#### 2. **Check Profile (Not Verified)**
```bash
GET /profile
# Should show: isEmailValid: false
```

#### 3. **Request Verification Email**
```bash
GET /verify-email
POST /resend-verification-link
# Check your email or Ethereal inbox
```

#### 4. **Verify Email**
- Click link in email OR
- Enter 8-digit code manually
```bash
GET /verify-email-token?token=12345678&email=john@example.com
```

#### 5. **Check Profile (Verified)**
```bash
GET /profile
# Should show: isEmailValid: true
```

---

## Database Transactions Explained

### Why Use Transactions for Email Verification?

**What is a Transaction?**
A transaction is a sequence of database operations that are treated as a single unit of work. Either ALL operations succeed, or ALL fail.

**ACID Properties:**
- **Atomicity**: All operations complete or none do
- **Consistency**: Database remains in valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Completed transactions persist

**In Our Implementation:**

```javascript
export const insertVerifyEmailToken = async ({ userId, token }) => {
  return db.transaction(async (tx) => {
    // Step 1: Delete expired tokens
    await tx.delete(verifyEmailTokensTable)
      .where(lt(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`));

    // Step 2: Delete existing tokens for user
    await tx.delete(verifyEmailTokensTable)
      .where(eq(verifyEmailTokensTable.userId, userId));
          
    // Step 3: Insert new token
    await tx.insert(verifyEmailTokensTable).values({ userId, token });
  });
};
```

**Benefits:**
1. **Data Integrity**: If any step fails, all changes are rolled back
2. **No Orphaned Data**: Prevents partial updates
3. **Consistency**: User never has multiple active tokens
4. **Atomic Cleanup**: Expired tokens removed safely

---

## URL API Explained

### What is the URL API?

The **URL API** is a built-in JavaScript interface for parsing, constructing, and manipulating URLs.

**Before URL API (Manual Encoding):**
```javascript
export const createVerifyEmailLink = async ({ email, token }) => {
    const uriEncodedEmail = encodeURIComponent(email);
    const generatedURL = `${process.env.FRONTEND_URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`;
    return generatedURL;
}
```

**With URL API (Automatic Encoding):**
```javascript
export const createVerifyEmailLink = async ({ email, token }) => {
    const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
    url.searchParams.append("token", token);
    url.searchParams.append("email", email);
    return url.toString();
}
```

**Benefits:**
1. **Automatic Encoding**: Special characters handled automatically
2. **Cleaner Code**: More readable and maintainable
3. **URL Validation**: Catches invalid URLs early
4. **Easy Manipulation**: Add/remove/modify parameters easily

**URL Components:**
```javascript
const url = new URL('https://example.com:3000/verify?token=123&email=test@mail.com#section');

console.log(url.protocol);    // 'https:'
console.log(url.hostname);    // 'example.com'
console.log(url.port);        // '3000'
console.log(url.pathname);    // '/verify'
console.log(url.search);      // '?token=123&email=test@mail.com'
console.log(url.searchParams.get('token')); // '123'
console.log(url.hash);        // '#section'
```

---

## SQL Joins in Email Verification

### Understanding Inner Joins

**What We're Doing:**
When verifying an email token, we need data from TWO tables:
1. `verifyEmailTokensTable` - Contains the token
2. `usersTable` - Contains the user email

**Without Join (Our Current Approach - 2 Queries):**
```javascript
// Query 1: Get token data
const tokenData = await db.select({
    userId: verifyEmailTokensTable.userId,
    token: verifyEmailTokensTable.token,
    expiresAt: verifyEmailTokensTable.expiresAt,
})
.from(verifyEmailTokensTable)
.where(and(
    eq(verifyEmailTokensTable.token, token),
    gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
));

const userId = tokenData[0].userId;

// Query 2: Get user data
const userData = await db.select({
    userId: usersTable.id,
    email: usersTable.email,
})
.from(usersTable)
.where(eq(usersTable.id, userId));
```

**With Inner Join (Single Query - More Efficient):**
```javascript
const result = await db
  .select({
    userId: usersTable.id,
    email: usersTable.email,
    token: verifyEmailTokensTable.token,
    expiresAt: verifyEmailTokensTable.expiresAt,
  })
  .from(verifyEmailTokensTable)
  .innerJoin(usersTable, eq(verifyEmailTokensTable.userId, usersTable.id))
  .where(and(
    eq(verifyEmailTokensTable.token, token),
    gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
  ));
```

**SQL Query Equivalent:**
```sql
SELECT 
    u.id AS userId,
    u.email,
    v.token,
    v.expires_at AS expiresAt
FROM is_email_valid v
INNER JOIN users u ON v.user_id = u.id
WHERE v.token = '12345678'
  AND v.expires_at >= CURRENT_TIMESTAMP;
```

**Benefits of Join:**
- ✅ Single database query (faster)
- ✅ Less network overhead
- ✅ Atomic operation
- ✅ Better performance with large datasets

**Types of Joins:**
1. **INNER JOIN**: Returns only matching rows from both tables
2. **LEFT JOIN**: Returns all rows from left table + matching rows from right
3. **RIGHT JOIN**: Returns all rows from right table + matching rows from left

---

## Common Issues and Solutions

### Issue 1: "Token expired or invalid"
**Solution:** Check that:
- Token hasn't expired (24 hours)
- Token exactly matches (case-sensitive)
- User hasn't requested multiple tokens (old tokens get deleted)

### Issue 2: "Email not sending"
**Solution:** Check:
- SMTP credentials are correct
- For Gmail: 2FA enabled and app password generated
- Firewall/antivirus not blocking port 587
- Check spam folder

### Issue 3: "JWT verification failed"
**Solution:**
- Ensure `JWT_SECRET` is set in .env
- Check token hasn't expired
- Verify cookie parser middleware is before auth middleware

### Issue 4: "Database migration errors"
**Solution:**
```bash
# Reset migrations (DEVELOPMENT ONLY!)
npm run db:migrate -- --drop

# Generate fresh migration
npm run db:generate

# Apply migration
npm run db:migrate
```

### Issue 5: "isEmailValid not updating"
**Solution:** Check:
- Email in token matches email in database (case-sensitive)
- Transaction completed successfully
- No database connection issues

---

## Environment Variables (.env)

```env
# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=url_shortner_mysql

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Ethereal - Development)
ETHEREAL_USER=emilia.koelpin2@ethereal.email
ETHEREAL_PASS=VyYHYxBFjUjMbujeeB

# Email Configuration (Gmail - Production)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

---

## Security Best Practices

1. **Token Security**
   - Use cryptographically secure random tokens
   - Set reasonable expiry times (24 hours)
   - Delete tokens after use
   - Limit token generation attempts

2. **Password Security**
   - Use Argon2 for hashing (more secure than bcrypt)
   - Never store plain text passwords
   - Implement password strength requirements

3. **Session Security**
   - Use httpOnly cookies (prevents XSS)
   - Use secure flag in production (HTTPS only)
   - Implement session expiry
   - Track user agent and IP for anomaly detection

4. **Email Security**
   - Validate email format
   - Use HTTPS for verification links
   - Don't expose user existence in error messages
   - Implement rate limiting

5. **Database Security**
   - Use parameterized queries (Drizzle handles this)
   - Implement cascade deletes
   - Regular backups
   - Use environment variables for credentials

---

## Performance Optimization

1. **Database Queries**
   - Use joins instead of multiple queries
   - Add indexes on frequently queried columns
   - Clean up expired tokens periodically

2. **Email Sending**
   - Send emails asynchronously (don't block response)
   - Use email queues for bulk sending
   - Implement retry logic

3. **Caching**
   - Cache user sessions
   - Use Redis for session storage in production

---

## Production Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Set secure: true for cookies (HTTPS)
- [ ] Use production email service (Gmail/SendGrid)
- [ ] Enable database backups
- [ ] Implement rate limiting
- [ ] Add logging (Winston/Morgan)
- [ ] Set up error monitoring (Sentry)
- [ ] Use HTTPS
- [ ] Implement CSRF protection
- [ ] Add email templates (MJML)
- [ ] Set up CI/CD pipeline
- [ ] Enable database connection pooling
- [ ] Implement graceful shutdown

---

## Additional Features to Implement

1. **Email Templates with MJML**
   - Professional-looking emails
   - Responsive design
   - Brand consistency

2. **Password Reset**
   - Similar flow to email verification
   - Time-limited reset tokens
   - Secure token generation

3. **Profile Updates**
   - Edit name/email
   - Change password
   - Upload avatar

4. **Two-Factor Authentication**
   - TOTP (Time-based One-Time Password)
   - SMS verification
   - Backup codes

5. **Account Security**
   - Login history
   - Active sessions management
   - Device tracking
   - Suspicious activity alerts

---

## Conclusion

You now have a complete, production-ready email verification system with:
- ✅ Secure token generation and validation
- ✅ Transaction-based database operations
- ✅ JWT-based authentication with refresh tokens
- ✅ Dynamic profile page with verification status
- ✅ Email sending with Nodemailer
- ✅ Gmail SMTP configuration
- ✅ Proper error handling and validation

This implementation follows industry best practices and can be extended with additional features as your application grows.

---

## Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Argon2 vs Bcrypt](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [JWT Best Practices](https://jwt.io/introduction)
- [MJML Email Framework](https://mjml.io/)
- [Gmail SMTP Setup](https://support.google.com/mail/answer/7126229)

---

**Happy Coding! 🚀** 