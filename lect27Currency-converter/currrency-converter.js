import https from 'https';
import readline from 'readline';
import chalk from 'chalk';


const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout
})

const api='81c020f9ac82cea71e576bdd';
const url=`https://v6.exchangerate-api.com/v6/${api}/latest/USD`;


const convertCurreency=(amount,rate)=>{
    return (amount*rate).toFixed(2);
}

https.get(url,(res)=>{
    let data='';
    res.on('data',(d)=>{
        data+=d;
    })
    res.on('end',()=>{
        const rates = JSON.parse(data).conversion_rates;

        rl.question(chalk.blue('Enter the amount in USD you want to convert: '),(amount)=>{
            
        rl.question(chalk.blue('Enter the currency you want to convert to: '),(currency)=>{
        const rate = rates[currency.toUpperCase()];
        if(rate){
            console.log(chalk.green(`${amount} USD is approximately ${convertCurreency(amount,rate)} ${currency}`));   
        } else{
            console.log(chalk.red('Invalid currency code. Please try again.'));
        }
        rl.close();
    })

    }
    )
})})