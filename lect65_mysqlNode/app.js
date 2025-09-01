import mysql from "mysql2/promise"

//Steps involved
//1: connect on mysql server
//2: create a db
//3: create a table over there
//4: perform the CRUD operations

//? step 1; creating the connection
const db = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "123456",
        database:"mysql_db",
    });
try {
    
    console.log("MySQL connected successfully... ");
    //? created a DB in the my sql
    //await db.execute(`CREATE DATABASE IF NOT EXISTS mysql_db`);
    // the above db.execute() just runs the Commands inside it in the mysql and fetches the response

    const [databases] = await db.execute("SHOW DATABASES");//here SHOW DATABASES is like  showing al the databases 
    console.log(databases);
} catch (error) {
    console.log("Error in connecting mysql database!", error);
}

//?step 3: Creating a table

// try {
//     await db.execute(`
//         CREATE TABLE users (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         username VARCHAR(100) NOT NULL,
//         email VARCHAR(100) NOT NULL UNIQUE); 
//         `)

//         console.log("Table is crrated successfully..");
        
// } catch (error) {
//     console.log("Error in creating the table", error);    
// }

//* Now the table is created so will comment lout this to prevent the retrying in table creation

//? Step 4: Inserting the data into the table
//! Insetion using the inline values (NOT RECCOMENDED)
// try {
//     await db.execute(`
//     insert into users(username, email) values('Aditya', 'aditya@user.com')
//     `);
//     console.log("Data inserted successfully...");
    
// } catch (error) {
//     console.log("Error in inserting the data..",error);
    
// }

//? Step4: How to read the data
try {
    const [rows] =await db.execute(`select * from users`)
    console.log("Succesfully read the data...\n");
    console.log(rows);
} catch (error) {
    console.log("Error in reading the data...");
}

// Now the above methods were old, so now trying the modern ways
//? Using the Prepared Statements(BEST PRACTICES)

// await db.execute(`insert into users(username, email) values(?,?)`,[
//     "Lucky",
//     "lucky@email.com"
// ]);


// const [rows] =await db.execute(`select * from users`)
// console.log(rows);

const values=[
    ["Alice","alice@example.com"],
    ["Bob","Bob@example.com"],
    ["Sundar","Sundar@example.com"],
    ["Jagriti","Jagriti@example.com"],
    ["Vivek","Vivek@example.com"],
];

await db.query("insert into users(username,email) values ?",
[values]);
//? db.query is used to insert  multiple files
const [rows] =await db.execute(`select * from users`)
console.log(rows);