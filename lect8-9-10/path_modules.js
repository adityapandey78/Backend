const { log } = require('console');
const path =require('path');
console.log(__dirname); // till the directory name of the current module
console.log(__filename); // till the file name of the current module

const filePath=path.join('folder','students','data.text');
console.log(filePath); // folder/students/data.text

const parseData=path.parse(filePath);
const resolvedPath=path.resolve(filePath);;
const extname=path.extname(filePath);
const basename= path.basename(filePath);
console.log({parseData,resolvedPath,extname,basename});
/**
 * folder\students\data.text
{
  parseData: {
    root: '',
    dir: 'folder\\students',
    base: 'data.text',
    ext: '.text',
    name: 'data'
  },
  resolvedPath: 'D:\\Coding\\Devlopment\\Backend\\folder\\students\\data.text',
  extname: '.text',
  basename: 'data.text'
}
 */
