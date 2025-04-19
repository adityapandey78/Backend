/**
 * !Objective:
 * Create a program using the node.js EventEmitter that"
 * Listens for multiple tupes of the user events(e.g login.logout,purchase and profile update)
 * tracks how many times each event has occurred
 * logs a summary of the event occuranxces when a special summary evcent is triggered
 * 
 * !Requirements:
 * Create at least four curtom events: login, logout, purchase, and profileUpdate.
 * Emit these events multiple times with diffrents args (usename, items_purchased.etc)
 * Tracks and stores the count of each event type
 * Defien a summary of events that logs deatailed report of the how many times each event has occurred
 */

const EventEmitter = require('events');
const emitter = new EventEmitter(); //creating an instance of EventEmitter class

const eventCounts={
    'user-login':0,
    'user-logout':0,
    'user-purchase':0,
    'profile-update':0
}

emitter.on('user-login',(username)=>{
    console.log(`${username} has logged in`);
    eventCounts['user-login']++;
});
emitter.on('user-purchase',(username,item)=>{
    console.log(`${username} has purchased ${item}`);
    eventCounts['user-purchase']++;
});
emitter.on('profile-update',(username,update)=>{
    console.log(`${username} has lupdated the ${update}`);
    eventCounts['profile-update']++;
});
emitter.on('user-login',(username)=>{
    console.log(`${username} has logged out`);
    eventCounts['user-logout']++;
});



//Emit Events
emitter.emit('user-login',"Aditya");
emitter.emit('user-purchase',"aditya",'laptop');
emitter.emit('profile-update','aditya','email');
emitter.emit('user-logout','aditya');

emitter.on('summary',()=>{
    console.log('Summary of events:');
    console.log(eventCounts);
})


emitter.emit('summary');