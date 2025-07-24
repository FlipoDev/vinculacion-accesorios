const xlsx = require('xlsx');
const path = require('path');
const dbConfig = require('../utils/db');

// Rutas de los Excels
//const pathAccesoriosLight = path.join(__dirname, '../excel/accesorios_lista_opticas_con_monturas_transparentes.xlsx');
const pathAccesoriosNegros = path.join(__dirname, '../excel/accesorios_lista_opticas_sin_monturas_transparentes.xlsx');
const pathOpticasLight = path.join(__dirname, '../excel/opticas_con_montura_trasnparente.xlsx');

// Función para leer Excel
const readExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

const vincular = async () => {
  try {
    // Leer datos
    // const accesoriosLight = readExcel(pathAccesoriosLight);
    const accesoriosNegros = readExcel(pathAccesoriosNegros);
    const opticasLight = readExcel(pathOpticasLight);
 
    // Vinculación de accesorios LIGHT
    
    // for (const opticaRow of opticasLight) {
    //   const idCode = opticaRow["Codigo Optica"];
    //   if (!idCode) continue;

    //   const [rows] = await dbConfig.query(
    //     'SELECT BIN_TO_UUID(id) AS optica_uuid FROM optic WHERE id_code = ?',
    //     [idCode]
    //   );

    //   if (rows.length === 0) {
    //     console.warn(`Óptica con id_code ${idCode} no encontrada en la base de datos.`);
    //     continue;
    //   }

    //   const opticaUUID = rows[0].optica_uuid;
    //   console.log("🎯 Vinculando óptica light:", opticaUUID);

    //   for (const acc of accesoriosLight) {
    //     const accesorioId = acc.id;
       
    //     await dbConfig.query(
    //       `INSERT INTO optic_accessories (optic_id, accessory_id)
    //         VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?))`,
    //       [opticaUUID, accesorioId]
    //     );
    //   }
    // }

   
    // Vinculación de accesorios NO LIGHT
   
    const codigosOpticasLight = new Set(opticasLight.map(optica => optica["Codigo Optica"]));

    const [opticasActivasFiltradas] = await dbConfig.query(
      `SELECT BIN_TO_UUID(id) AS optica_uuid, id_code FROM optic 
       WHERE is_active = 0 AND id_code NOT IN (${[...codigosOpticasLight].map(() => '?').join(',')})`,
      [...codigosOpticasLight]
    );
    console.log("🚀 ~ vincular ~ opticasActivasFiltradas:", opticasActivasFiltradas)

    for (const optica of opticasActivasFiltradas) {
      const opticaUUID = optica.optica_uuid;
      console.log("Vinculando óptica no light:", opticaUUID);

      for (const acc of accesoriosNegros) {
        const accesorioId = acc.id;
        if (accesorioId) {
          await dbConfig.query(
            `INSERT INTO optic_accessories (optic_id, accessory_id)
             VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?))`,
            [opticaUUID, accesorioId]
          );
        }
      }
    }

    console.log('Vinculación completada con éxito.');
    process.exit();
  } catch (error) {
    console.error('Error en vinculación:', error.message);
    process.exit(1);
  }
};

vincular();