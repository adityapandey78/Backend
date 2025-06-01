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