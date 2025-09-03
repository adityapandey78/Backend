import { PrismaClient } from "./generated/prisma/index.js"

/**
 * Doing the CRUD operation using the PRISMA to mysql
 */
const prisma= new PrismaClient();
const main= async ()=>{
    //:1 Creating a single data
    try {
        // const user = await prisma.user.create({
        //     data:{
        //         name: "aditya",
        //         email:`aditya${Date.now()}@email.com`
        // 
            
        //: Creating the multiple users
        // const user = await prisma.user.createMany({
        //     data:[
        //     {name: "Addy",email:`aditya${Date.now()}@email.com`},
        //     {name: "Sundar",email:`sundar@email.com`},
        //     {name: "Kurup",email:`kurup@email.com`},
        // ]
        // })
        // console.log("User created successfully:", user);

        //: reading the data from DB

        // const reaUsers= await prisma.user.findMany();
        // console.log(reaUsers);
        
        //: reading the data of the particular user
        
        // const particularuser= await prisma.user.findUnique({
        //     where:{id:3}
        // });
        // console.log(particularuser);

        //: Filtering the data and showing it
        // const filteredUser= await prisma.user.findMany({
        //     where:{name:"aditya"}
        // });
        // console.log(filteredUser);

        //: Modifying the data -- Upadating one user
        // const updatedUser = await prisma.user.update({
        //     where:{id:3},
        //     data:{name:"aditya fking bihari"}
        // });
        // console.log(updatedUser);

        //: Modifying multiple user -- 
        // const updatedUser = await prisma.user.updateMany({
        //     where:{id:3},
        //     data:{name:"fking bihari",
        //         email:"adityaaaa@user.com"
        //     }
        // });
        // console.log(updatedUser);

        //: Delete the data
        const deleteUser= await prisma.user.delete({
            where:{id:3},
        })
        console.log(deleteUser);
    }
       
     catch (error) {
        if (error.code === 'P2002') {
            console.log("User with this email already exists. Let's fetch all users:");
            const allUsers = await prisma.user.findMany();
            console.log("All users:", allUsers);
        } else {
            throw error;
        }
    }
}
main()
    .catch((e)=> console.log(e))
    .finally(async()=>{
        await prisma.$disconnect();
    });