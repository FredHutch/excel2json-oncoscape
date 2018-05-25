// https://www.npmjs.com/package/csvtojson
// node --max-old-space-size=3000 trying to mimic lambda specification

const csv=require('csvtojson')
var async = require("async");
const testFolder = '.';
const fs = require('fs');
var csvFiles;
fs.readdir(testFolder, (err, files) => {
    csvFiles = files.filter(f => f.indexOf('.csv') > 0)
})

var csv2json = function(csvFilePath){
    return new Promise((resolve, reject) => { 
        csv()
        .fromFile(csvFilePath)
        .then((jsonObj)=>{
            console.log(jsonObj.length);
            resolve(jsonObj);
        });
    });
}
// Async / await usage
var data;
async.each(csvFiles, (file) =>{
    console.log(file);
    var result = csv2json(file);
}, err => {
    if (err) console.error(err.message);
});

