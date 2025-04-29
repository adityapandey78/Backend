import readline from 'readline/promises'

//Open Weather API KEY
const API_KEY='25fe44688065f4b74c81c106dbd9e0f1';
const BASE_URL =`https://api.openweathermap.org/data/2.5/weather`;


const rl=readline.createInterface({
    input:process.stdin,
    output:process.stdout
});

const getWeather= async (city)=>{
    const URL =`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`;
    try {
        const response = await fetch(URL);
        if(!response.ok){
            throw new Error('city not found');
        }
        const weatherData= await response.json();
        console.log('\nWeather Information:');
        console.log(`City: ${weatherData.name}`);
        console.log(`Temperature: ${weatherData.main.temp} Celcius`);
        console.log(`Description: ${weatherData.weather[0].description}`);
        console.log(`Humidiy: ${weatherData.main.humidity}%`);
        console.log(`Wind Speed: ${weatherData.wind.speed} m/s\n`);
    } catch (error) {
        console.log('Error fetching the weather details:',error.message);
    }
}
const city =await rl.question('Enter the city name:');
await getWeather(city);
rl.close();

