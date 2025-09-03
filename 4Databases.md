# SQL vs NoSQL Databases

| Feature | SQL Databases | NoSQL Databases |
|---------|--------------|-----------------|
| **Structure** | Relational, table-based with predefined schema | Non-relational, flexible schemas (document, key-value, graph, column-family) |
| **Examples** | MySQL, PostgreSQL, Oracle, SQL Server | MongoDB, Redis, Cassandra, DynamoDB |
| **Best for** | Complex queries, transactions, and structured data | Large volumes of rapidly changing unstructured data |
| **Scaling** | Vertical (adding more power to existing server) | Horizontal (adding more servers) |
| **ACID compliance** | Strong | Often sacrificed for performance and scalability |
| **Schema** | Fixed schema | Dynamic schema |
| **Joins** | Better for complex joins | Typically avoids joins |
| **Performance** | Optimized for complex queries | Better for simple read/write operations |
| **Consistency** | Stronger consistency | Often uses eventual consistency |
| **Data Types** | Structured data | Handles structured, semi-structured, and unstructured data |

## Collection in MongoDB
A collection in MongoDB is a group of MongoDB documents. It is equivalent to a table in relational databases. Collections do not enforce a schema, allowing for flexibility in the types of documents stored.

## Document in MongoDB
A document in MongoDB is a data structure composed of field and value pairs. It is similar to a row in a relational database but can contain nested structures and arrays. Documents are stored in BSON format, which is a binary representation of JSON-like documents.

## BSON (Binary JSON)
BSON is a binary representation of JSON-like documents. It extends JSON's capabilities by allowing for additional data types, such as binary data and date types, and supports more complex structures like arrays and nested documents. BSON is used internally by MongoDB to store documents efficiently.

## Setting up MongoDB with Express.js

### 1. Installation
```bash
npm install mongoose express
```

### 2. Basic Connection Setup
```javascript
// app.js
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mydatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

### 3. Creating a Schema and Model
```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
```

## Common MongoDB Operations

### 1. Create (INSERT)
```javascript
// Create a new user
const User = require('./models/User');

app.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

### 2. Read (FIND)
```javascript
// Get all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Find with conditions
app.get('/users/age/:minAge', async (req, res) => {
    try {
        const users = await User.find({ age: { $gte: req.params.minAge } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 3. Update (UPDATE)
```javascript
// Update user by ID
app.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

### 4. Delete (DELETE)
```javascript
// Delete user by ID
app.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Important MongoDB Concepts

### ObjectId
MongoDB automatically creates an `_id` field for each document with a unique ObjectId. It's a 12-byte identifier consisting of timestamp, machine identifier, process id, and counter.

### Indexing
```javascript
// Create index for better query performance
userSchema.index({ email: 1 }); // Ascending index on email
userSchema.index({ name: 1, age: -1 }); // Compound index
```

### Aggregation Pipeline
```javascript
// Example: Get average age by grouping
app.get('/users/stats', async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    averageAge: { $avg: '$age' },
                    totalUsers: { $sum: 1 },
                    maxAge: { $max: '$age' },
                    minAge: { $min: '$age' }
                }
            }
        ]);
        res.json(stats[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Schema Validation
```javascript
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/, 'Please enter a valid email']
    }
});
```

### Population (Referencing other documents)
```javascript
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Populate author information
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'name email');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Middleware in Mongoose
```javascript
// Pre-save middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Post-save middleware
userSchema.post('save', function(doc, next) {
    console.log(`User ${doc.name} was saved to the database`);
    next();
});
```

### Virtual Properties
```javascript
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Include virtuals when converting to JSON
userSchema.set('toJSON', { virtuals: true });
```

## Mongoose Advanced Features

### Query Helpers
```javascript
userSchema.query.byAge = function(age) {
    return this.where({ age: { $gte: age } });
};

// Usage
const adults = await User.find().byAge(18);
```

### Static Methods
```javascript
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email });
};

// Usage
const user = await User.findByEmail('john@example.com');
```

### Instance Methods
```javascript
userSchema.methods.getPublicProfile = function() {
    return {
        name: this.name,
        email: this.email,
        createdAt: this.createdAt
    };
};

// Usage
const publicProfile = user.getPublicProfile();
```

### Transactions
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
    const user = new User({ name: 'John', email: 'john@example.com' });
    await user.save({ session });
    
    const post = new Post({ title: 'My Post', author: user._id });
    await post.save({ session });
    
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

## MySQL Integration with Node.js

### 1. Installation
```bash
npm install mysql2 express
# OR for connection pooling
npm install mysql2 express-promise-mysql
```

### 2. Basic MySQL Connection
```javascript
// config/database.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydatabase',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = connection;
```

### 3. Connection Pool (Recommended)
```javascript
// config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydatabase',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
});

module.exports = pool;
```

### 4. Creating Tables
```sql
-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## MySQL CRUD Operations

### 1. Create (INSERT)
```javascript
const pool = require('./config/database');

// Create user
app.post('/users', async (req, res) => {
    try {
        const { name, email, age } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
            [name, email, age]
        );
        
        res.status(201).json({
            id: result.insertId,
            name,
            email,
            age
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Bulk insert
app.post('/users/bulk', async (req, res) => {
    try {
        const users = req.body.users;
        const values = users.map(user => [user.name, user.email, user.age]);
        
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, age) VALUES ?',
            [values]
        );
        
        res.status(201).json({ 
            message: `${result.affectedRows} users created`,
            insertId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 2. Read (SELECT)
```javascript
// Get all users with pagination
app.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const [users] = await pool.execute(
            'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        
        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
        const total = countResult[0].total;
        
        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [req.params.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search users
app.get('/users/search/:term', async (req, res) => {
    try {
        const searchTerm = `%${req.params.term}%`;
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?',
            [searchTerm, searchTerm]
        );
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 3. Update (UPDATE)
```javascript
// Update user
app.put('/users/:id', async (req, res) => {
    try {
        const { name, email, age } = req.body;
        const [result] = await pool.execute(
            'UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?',
            [name, email, age, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Partial update
app.patch('/users/:id', async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        values.push(req.params.id);
        
        const [result] = await pool.execute(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 4. Delete (DELETE)
```javascript
// Delete user
app.delete('/users/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Soft delete (recommended)
app.delete('/users/:id/soft', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User soft deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## MySQL Key Points and Best Practices

### 1. Transaction Management
```javascript
app.post('/transfer-funds', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Debit from sender
        await connection.execute(
            'UPDATE accounts SET balance = balance - ? WHERE id = ?',
            [req.body.amount, req.body.fromAccount]
        );
        
        // Credit to receiver
        await connection.execute(
            'UPDATE accounts SET balance = balance + ? WHERE id = ?',
            [req.body.amount, req.body.toAccount]
        );
        
        await connection.commit();
        res.json({ message: 'Transfer completed successfully' });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Transfer failed' });
    } finally {
        connection.release();
    }
});
```

### 2. Prepared Statements (Always Use)
```javascript
// Good - Prevents SQL injection
const [users] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [userEmail]
);

// Bad - Vulnerable to SQL injection
const [users] = await pool.execute(
    `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### 3. Error Handling
```javascript
const handleDatabaseError = (error, res) => {
    console.error('Database error:', error);
    
    switch (error.code) {
        case 'ER_DUP_ENTRY':
            return res.status(409).json({ error: 'Duplicate entry' });
        case 'ER_NO_REFERENCED_ROW_2':
            return res.status(400).json({ error: 'Foreign key constraint failed' });
        case 'ER_DATA_TOO_LONG':
            return res.status(400).json({ error: 'Data too long for column' });
        default:
            return res.status(500).json({ error: 'Database error' });
    }
};
```

### 4. Connection Pool Best Practices
```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydatabase',
    connectionLimit: 20,          // Max connections
    acquireTimeout: 60000,        // Max time to get connection
    timeout: 60000,               // Max time for query
    reconnect: true,              // Reconnect on connection loss
    idleTimeout: 300000,          // Close idle connections after 5 minutes
    maxReusedConnections: 100     // Max times to reuse connection
});

// Always handle pool errors
pool.on('connection', (connection) => {
    console.log('New connection established as id ' + connection.threadId);
});

pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // Handle connection lost
    }
});
```

### 5. Performance Optimization
```javascript
// Use indexes for better performance
// CREATE INDEX idx_users_email ON users(email);
// CREATE INDEX idx_users_created_at ON users(created_at);

// Limit results for large datasets
app.get('/users/recent', async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT id, name, email, created_at 
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY created_at DESC 
            LIMIT 100
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 6. Data Validation and Sanitization
```javascript
const validateUser = (req, res, next) => {
    const { name, email, age } = req.body;
    
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    
    if (!email || !/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (age && (age < 0 || age > 150)) {
        return res.status(400).json({ error: 'Age must be between 0 and 150' });
    }
    
    next();
};

app.post('/users', validateUser, async (req, res) => {
    // Handler code here
});
```

