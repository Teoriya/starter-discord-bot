const path = require('path');
const directoryPath = path.join(__dirname, '../discordEvents');
const {allJSfetcher} = require('../utils/fileUtils');

const events = allJSfetcher(directoryPath)
console.log(`Trying to load ${events.length} events: `);
events.forEach((event) => {
    try {
        require(event);
        console.log(`Loaded event ${event.name || path.basename(event, '.js')}✅`);
    } catch (error) {
        console.log(`Error Loading ${event.name || path.basename(event, '.js')}❌`);
        console.error({error});
    } 
});