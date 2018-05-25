// const XlsxStreamReader = require("xlsx-stream-reader");
 
// var workBookReader = new XlsxStreamReader();
// workBookReader.on('error', function (error) {
//     throw(error);
// });
// // workBookReader.on('sharedStrings', function () {
// //     // do not need to do anything with these, 
// //     // cached and used when processing worksheets
// //     console.log(workBookReader.workBookSharedStrings);
// // });
 
// // workBookReader.on('styles', function () {
// //     // do not need to do anything with these
// //     // but not currently handled in any other way
// //     console.log(workBookReader.workBookStyles);
// // });

// var data =  [];

// workBookReader.on('worksheet', function (workSheetReader) {
//     var obj = {};
//     if (workSheetReader.id > 1){
//         // we only want first sheet
//         workSheetReader.skip();
//         return; 
//     }
//     // print worksheet name
//     console.log(workSheetReader.name);
//     obj[workSheetReader.name] = [];
//     // if we do not listen for rows we will only get end event
//     // and have infor about the sheet like row count
//     workSheetReader.on('row', function (row) {
//         var row = [];
//         if (row.attributes.r == 1){
//             // do something with row 1 like save as column names
//         }else{
//             // second param to forEach colNum is very important as
//             // null columns are not defined in the array, ie sparse array
//             row.values.forEach(function(rowVal, colNum){
//                 // do something with row values
//                 console.log('rowVal: ', rowVal);
//                 console.log('colNum: ', colNum);
//             });
//         }
//     });
//     workSheetReader.on('end', function () {
//         console.log(workSheetReader.rowCount);
//     });
 
//     // call process after registering handlers
//     workSheetReader.process();
// });
// workBookReader.on('end', function () {
//     // end of workbook reached
// });

// var fileName = 'GBM-LGG.xlsx';

// fs.createReadStream(fileName).pipe(workBookReader);

// ========================================================================================

const fs = require('fs');
const server = require('http').createServer();
server.on('request', (req, res) => {
    const src = fs.createReadStream('./uploading_demo.xlsx');
    src.pipe(res);
  });
  
  server.listen(8000);

// ========================================================================================
// stream rows from the first sheet on the file
var excel = require('excel-stream')
var fs = require('fs')
 
fs.createReadStream('uploading_demo.xlsx')
  .pipe(excel())  // same as excel({sheetIndex: 0})
  .on('data', console.log)
 