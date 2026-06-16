const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function test() {
  const filePath = path.join(__dirname, 'test.xlsx');
  const buffer = fs.readFileSync(filePath);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  console.log('Row count:', worksheet.rowCount);
  
  let nameIdx = -1, docIdx = -1, emailIdx = -1;
  let headerRowIdx = -1;

  for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
    worksheet.getRow(r).eachCell((cell, colNumber) => {
      let val = '';
      if (!cell || cell.value === null || cell.value === undefined) val = '';
      else if (typeof cell.value === 'object') {
        if (cell.value.result !== undefined && cell.value.result !== null) {
          val = cell.value.result.toString().trim();
        } else if (cell.value.richText) {
          val = cell.value.richText.map(t => t.text).join('').trim();
        } else if (cell.value.text) {
          val = cell.value.text.toString().trim();
        } else {
          val = cell.value.toString().trim();
        }
      } else {
        val = cell.value.toString().trim();
      }
      
      val = val.toLowerCase();
      console.log(`Row ${r}, Col ${colNumber}: ${val}`);
      
      if (val.includes('nombre')) nameIdx = colNumber;
      if (val.includes('documento') || val.includes('identificación')) docIdx = colNumber;
      if (val.includes('correo') || val.includes('email')) emailIdx = colNumber;
    });

    if (nameIdx !== -1 && docIdx !== -1 && emailIdx !== -1) {
      headerRowIdx = r;
      break;
    } else {
      nameIdx = -1; docIdx = -1; emailIdx = -1;
    }
  }

  console.log('Result:', { headerRowIdx, nameIdx, docIdx, emailIdx });
}

test();
