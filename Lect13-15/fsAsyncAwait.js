const fs= require("fs");
const path = require("path");

const fileName='asyntFile.txt';
const filePath= path.join(__dirname,fileName);

const filePath1=__dirname;
// fs.promises
//    .readdir(filePath1)
//     .then((data)=>console.log(data))
//     .catch((err)=>console.log(err));
//above code was useing promises

// const readFolder = async ()=>{
//     try {
//         const res=await fs.promises.readdir(filePath1);
//         console.log(res);
        
//     } catch (error) {
//         console.log("Error in reading folder",error);
        
//     }
// }
// readFolder();

