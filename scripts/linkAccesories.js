const xlsx = require('xlsx');
const path = require('path');
const dbConfig = require('../utils/db');

// Ruta de los excels
const pathAccesoriosLight = path.join(__dirname, '../excel/accesorios_lista_opticas_con_monturas_transparentes.xlsx');
//const pathAccesoriosNegros = path.join(__dirname, '../excel/accesorios_lista_opticas_sin_monturas_transparentes.xlsx');
const pathOpticasLight = path.join(__dirname, '../excel/opticas_con_montura_trasnparente.xlsx');

//lee hoja de excel y devuelve un array de objetos
const readExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

const vincular = async () => {
  try {
    // Leer los excels y cargar los datos
    const accesoriosLight = readExcel(pathAccesoriosLight);
    const opticasLight = readExcel(pathOpticasLight);
   
    for (const opticaRow of opticasLight) {
      const idCode = opticaRow["Codigo Optica"];

      if (!idCode) continue;

      const [rows] = await dbConfig.query(
        'SELECT BIN_TO_UUID(id) AS optica_uuid FROM optic WHERE id_code = ?',
        [idCode]
      );

      if (rows.length === 0) {
        console.warn(`Óptica con id_code ${idCode} no encontrada en la base de datos.`);
        continue;
      }

      const opticaUUID = rows[0].optica_uuid;
      console.log("🚀 ~ vincular ~ opticaUUID:", opticaUUID)
    
      for (const acc of accesoriosLight) {
        const accesorioId = acc.id;
        // console.log(`INSERT INTO optic_accessories (optic_id, accessory_id)
        //     VALUES (UUID_TO_BIN("${opticaUUID}"), UUID_TO_BIN("${accesorioId}"))`)
        if (accesorioId) {
          await dbConfig.query(
            `INSERT INTO optic_accessories (optic_id, accessory_id)
            VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?))
      `,
            [opticaUUID, accesorioId]
          );
          // console.log("🚀 ~ vincular ~ dbConfig:", dbConfig)
        }
      }
    }

    console.log('Vinculación completada.');
    process.exit();
  } catch (error) {
    console.error('Error en vinculación:', error.message);
    process.exit(1);
  }
};

vincular();
