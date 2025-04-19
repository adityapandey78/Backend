const EventEmitter = require('events');
//importing EventEmitter Class
const emitter = new EventEmitter();//creating an instance 

//steps
//1.Define an event listener
emitter.on('greet',(user)=>{
    console.log(`Hello from EventEmitter class by ${user}`);
    //this is the callback function which will be executed when the event is emitted
})
//2.Trigger the event
emitter.emit('greet',"aditya");//emitting the event

//here we can pass ay data to the event listener as well