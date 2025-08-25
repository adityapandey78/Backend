import { MongoClient } from "mongodb";

async function main() {
    const client = new MongoClient("mongodb://127.0.0.1:27017");
    try {
        await client.connect();

        const db = client.db('mongodb_nodejs_db');

        const userCollection = db.collection('users');

        //!Insertion of the data
        // user collection takes an object as a parameter
    //     await userCollection.insertOne({ name: 'Sudheer Pandey', age: 22 });

    //     ? insertMany takes an array of objects as a parameter
    //     await userCollection.insertMany([
    //         { name: 'John Doe',role:'user', age: 30 },
    //         { name: 'Jane Smith',role:'user', age: 25 },
    //         { name: 'Alice Johnson',role:'user', age: 28 },
    //         { name: 'Bob Babuji', role:'user', age: 35 },
    //         { name: 'Sakshi babuni',role:'user', age: 35 },
    //         { name: 'motu patlu',role:'user', age: 35 },
    //         { name: 'Sundar kumar',role:'admin', age: 35 },
    //     ]);

    //     console.log("Documents inserted successfully!");

    //! reading the data
    //const usersCursor=userCollection.find()
    //console.log(usersCursor);
    // ye format norma; userCursor ke format me data dega

    //* it'll give the data inthe form of objects
    //await lgane pdega data lene ke liye
    // for await (const user of usersCursor){
    //     console.log(user);
        
    // }

    //method 3: pehle hi saare input ko array me convert kr do
        // const usersCursor= await userCollection.find().toArray();
        // console.log(usersCursor);
    
        //Method 4: getting a single data
        const user= await userCollection.findOne({name:"motu patlu"});
        console.log(user);
        // console.log(user._id.toHexString());
        
        
    //! Updating the data

    await userCollection.updateOne({name:"motu patlu"},{$set:{age:95}})

    //Deleting the data
    const deleteUser=await userCollection.deleteOne({name:"John Doe"})

    console.log(`${deleteUser.deletedCount} Documents are deleted.`);
    
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    } finally {
        await client.close();
    }
}

main();