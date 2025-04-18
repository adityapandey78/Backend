/**#12: FS Module in Node.js : Complete CRUD Operations & File Renaming (Sync) */
const fs= require('fs');
const path= require('path');

const fileName="test.txt";
const filePath = path.join(__dirname,fileName);
// const writeFile= fs.writeFileSync(fileName,"This will be the initial text in the file",'utf-8');
// console.log("File Created Successfully");
//it will create the file in the current directory


const readFile=fs.readFileSync(filePath);
console.log(readFile.toString()); // This will be the initial text in the file

const appendFile=fs.appendFileSync(filePath," This will be the appended text in the file",'utf-8');
console.log("File Appended Successfully");


//deleting the server file
// const deleteFile=fs.unlinkSync(filePath);
// console.log("File Deleted Successfully");
const UpdateFileName="UpdatedTest.text";
const newFilePath=path.join(__dirname,UpdateFileName);
const renameFile=fs.renameSync(filePath,newFilePath);
console.log("File Renamed Successfully");