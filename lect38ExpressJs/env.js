/*//:method 1


// const PORT = isNaN(process.send.PORT)?3000:process.parseInt(process.env.PORT);

import {z,ZodError} from 'zod';

const ageSchema = z.number().min(18).max(100).int();
const userAge = 19;

//:method 2
// const parseUserAge= ageSchema.parse(userAge);
// console.log(parseUserAge);

try {
    const parsedUserAge = ageSchema.parse(userAge);
    console.log(parsedUserAge);// in case of success

} catch (error) {
    // instanceof is a Javascript operator used to check if an object is an isntance of specific class or constructor function.
    if(error instanceof ZodError){
        console.log(error.issues[0].message);
        
    } else{
        console.log('Something went wrong!', error);
        
    }
}

// Why We use Parse not validate?
// 1. parse is used to validate and transform the data in one step, while validate only checks if the data is valid without transforming it.
// 2. parse throws an error if the data is invalid, while validate returns a boolean value indicating whether the data is valid or not.
*/

//: Now for the .env file

import {z,ZodError} from 'zod'
const portSchema = z.coerce.number().min(1).max(685553).default(3000);

//coerce: it is used to convert the input value to the specified type before validating it.
const PORT = portSchema.parse(process.env.PORT);
export {PORT};