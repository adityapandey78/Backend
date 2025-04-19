const fs= require("fs/promises");
const path = require("path");

const fileName='asyntFile.txt';
const filePath= path.join(__dirname,fileName);

// const filePath1=__dirname;
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

 
//Writing a file or cre4ating it

// const writeFileExample = async()=>{
//     try {
//        await fs.writeFile(filePath,'This is the intial data by Pandey','utf-8');
//        console.log("File Created Successfully");
        
//     } catch (error) {
//         console.log("Error in writing file",error);
        
//     }
// }
// writeFileExample();


// const readFileExample = async()=>{
//     try {
//        const data =await fs.readFile(filePath,'utf-8');
//        console.log("File Read Successfully");
//        console.log(data.toString()); 
        
//     } catch (error) {
//         console.log("Error in reading file",error);
        
//     }
// }
// readFileExample();

const appendFileExample = async()=>{
    try {
       const data =await fs.appendFile(filePath,'\nThis is the appended data by Pandey','utf-8');
       console.log("File Appended Successfully\n Added data is: ",data.toString());
        
    } catch (error) {
        console.log("Error in writing file",error);
        
    }
}
appendFileExample();