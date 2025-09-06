import 'dotenv/config';
import { db } from "./config/db.js";
import { usersTable } from "./drizzle/schema.js";

const main= async()=>{
    //: Insert 
    // const insertUser= await db.insert(usersTable).values({name:"aditya", age:"31", email:"test@gmail.com"});
    // console.log(insertUser);

    //:insert many
    // const insertMany= await db.insert(usersTable).values([
    //     {name:"sakshiSingh",age:"24", email:"sakshi23@email.com"},
    //     {name:"singhJi",age:"22", email:"sakshiieie@email.com"},
    //     {name:"sakshiiyaaa11",age:"24", email:"sakshiyaaa@email.com"}
    // ])
    // console.log(insertMany);

    //: read Operation
    const user = await db.select().from(usersTable).where({
        email:"test@gmail.com"
    });
    console.log(user);

    //:Update Query
    const updateUser= await db.update(usersTable)
                                .set({name:"Aditya jii"}).
                                where({email:"test@gmail.com"})
    console.log(updateUser);
    
    
}
main().catch((error)=>{
    console.log(error);
})