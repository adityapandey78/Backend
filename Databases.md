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
