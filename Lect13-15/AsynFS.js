const fs= require('fs');
const path=require('path');

//* #13: Node.js FS Module (Async): How to Write, Read, Update, and Delete Files in Node.js

const fileName="test.txt";
const filePath = path.join(__dirname,fileName);
//writing a 
fs.writeFile(filePath,"This will be the initial text in the file",'utf-8',(err)=>{
    if(err){
        console.log("Error in creating file",err);
    }else{
        console.log("File Created Successfully");
    }
});

//reading a file
fs.readFile(filePath,'utf-8',(err,data)=>{
    if(err){
        console.log("Error in reading file",err);
    }else{

        console.log("File Read Successfully: ",data.toString()); // This will be the initial text in the file
    }
});
