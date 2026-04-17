const fs = require('fs');

const data = JSON.parse(fs.readFileSync('keywords.json'));

if (data.length > 0) {
    console.log("Test Passed");
} else {
    throw new Error("Test Failed");
}