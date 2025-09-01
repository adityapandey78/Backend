import mongoose from "mongoose";
import { email } from "zod";

//Step 1: connecting to server
try {
    await mongoose.connect("mongodb://127.0.0.1/mongoose_database");
    mongoose.set("debug",true);
} catch (error) {
    console.log("Error connecting with mongoose and mongoDB", error);
    process.exit();
    
}

// step 2: creating the schema
const userSchema= mongoose.Schema({
    name:{type: String, requred:true},
    email:{type:String, required:true, unique:true},
    age:{type:Number,required:true, min:5},
    createdAt:{type:Date, default:Date.now()},
    updatedAt:{type:Date,default:Date.now()}
});

// will move this middleware before creating the model
userSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function(next){
    this.set({updatedAt: Date.now()});
    next();
});

// step3: Creating a model
const Users=mongoose.model("user",userSchema);// always keep user here in singular form i.e. user

// Creating the user
//await Users.create({name:"thapa", age:31, email:"thapa@email.com"});

// Updating the User
//await Users.updateOne({email:"thapa@email.com"},{$set:{age:90}});

// Now this normal update will not not change the updatedAt data, so to use that we will use middleware

// step 4: using the middleware
// userSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function(next){
//     this.set({updatedAt: Date.now()});
//     next();
// });

await Users.updateOne({email:"thapa@email.com"},{$set:{age:50}});
await mongoose.connection.close();