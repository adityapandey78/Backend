import {createReadStream, createWriteStream, read, write} from 'fs';
import path from 'path';

const inputFilePath = path.join(import.meta.dirname,'input.txt');
const outputFilePath= path.join(import.meta.dirname, 'output.txt');

const readableStream= createReadStream(inputFilePath,{
    encoding:'utf-8',
    highWaterMark:16,
})

const writableStream= createWriteStream(outputFilePath)
//listen for data chunks
readableStream.on('data',(chunk)=>{
    console.log('New chunk received:', chunk);
    console.log('Received Chunk', Buffer.from(chunk));
    writableStream.write(chunk)
})
 
//handle end of stream
readableStream.on('end',()=>{
    console.log('No more data to read');
    writableStream.end()
})

readableStream.pipe(writableStream)//handle errors

readableStream.on('error',(err)=>{
    console.error('Error reading the file:', err);
})

writableStream.on('error',(err)=>{
    console.error('Error writing to the file:', err);
})
