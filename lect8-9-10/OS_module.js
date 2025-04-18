const { log } = require("console");
const os = require("os");
console.log("Platform:", os.platform()); // win32
console.log("Arch:", os.arch()); // x64
console.log("CPU:", os.cpus()); // CPU information
console.log("Free Memory:", os.freemem()); // Free memory in bytes
console.log("Total Memory:", os.totalmem()); // Total memory in bytes   
console.log("Home Directory:", os.homedir()); // Home directory path
console.log("Network Interfaces:", os.networkInterfaces()); // Network interfaces information
console.log("OS Type:", os.type()); // Operating system type
console.log("OS Hostname:", os.hostname()); // Hostname of the operating system
