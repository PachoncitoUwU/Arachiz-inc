const xlsx = require('xlsx');

// Crear los datos para la hoja
const data = [
  {
    "TIPO_DOCUMENTO": "CC",
    "NUMERO_DOCUMENTO": "1002003004",
    "NOMBRES": "Juan Pablo",
    "APELLIDOS": "Perez Gomez",
    "CORREO_ELECTRONICO": "juan.perez@misena.edu.co",
    "TELEFONO": "3001234567",
    "FICHA_CARACTERIZACION": "3146013"
  },
  {
    "TIPO_DOCUMENTO": "TI",
    "NUMERO_DOCUMENTO": "1050607080",
    "NOMBRES": "Maria Camila",
    "APELLIDOS": "Lopez Diaz",
    "CORREO_ELECTRONICO": "maria.lopez@misena.edu.co",
    "TELEFONO": "3109876543",
    "FICHA_CARACTERIZACION": "3146013"
  }
];

// Crear un libro de trabajo y una hoja
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);

// Establecer anchos de columna para que sea más legible
ws['!cols'] = [
  { wch: 15 }, // TIPO_DOCUMENTO
  { wch: 20 }, // NUMERO_DOCUMENTO
  { wch: 20 }, // NOMBRES
  { wch: 20 }, // APELLIDOS
  { wch: 30 }, // CORREO_ELECTRONICO
  { wch: 15 }, // TELEFONO
  { wch: 25 }  // FICHA_CARACTERIZACION
];

// Añadir la hoja al libro de trabajo
xlsx.utils.book_append_sheet(wb, ws, "Aprendices");

// Guardar el archivo
xlsx.writeFile(wb, "Plantilla_Importacion_Aprendices.xlsx");

console.log("Archivo Plantilla_Importacion_Aprendices.xlsx creado exitosamente.");
