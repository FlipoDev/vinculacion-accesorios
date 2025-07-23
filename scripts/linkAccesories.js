const xlsx = require('xlsx');
const path = require('path');
const dbConfig = require('../utils/db');

// Ruta de los excels
const pathAccesoriosLight = path.join(__dirname, '../excel/accesorios_lista_opticas_con_monturas_transparentes.xlsx');
const pathAccesoriosNegros = path.join(__dirname, '../excel/accesorios_lista_opticas_sin_monturas_transparentes.xlsx');
const pathOpticasLight = path.join(__dirname, '../excel/opticas_con_montura_trasnparente.xlsx');

const readExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

const vincular = async () => {
  try {
    const accesoriosLight = readExcel(pathAccesoriosLight);
    const accesoriosNegros = readExcel(pathAccesoriosNegros);
    const opticasLight = readExcel(pathOpticasLight);

    const [opticasActivas] = await dbConfig.query('SELECT id, nombre FROM opticas WHERE activa = 1');

    // Vincular accesorios light a ópticas específicas
    for (const optica of opticasLight) {
      const opticaId = optica.optica_id || optica.id || optica.ID;
      if (!opticaId) {
        console.error(`Optica ID no encontrado para: ${optica.nombre}`);
        continue;
      }
      for (const acc of accesoriosLight) {
        const accesorioId = acc.accesorio_id || acc.ID_accesorio || acc.id_accesorio;
        const monturaId = acc.id_montura || acc.montura_id;

        if (accesorioId && monturaId) {
          await dbConfig.query(
            'INSERT INTO optic_accessories (optica_id, accesorio_id, montura_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE montura_id = VALUES(montura_id)',
            [opticaId, accesorioId, monturaId]
          );
        }
      }
    }

    // Vincular accesorios negros a todas las ópticas activas
    for (const optica of opticasActivas) {
      const opticaId = optica.id;

      for (const acc of accesoriosNegros) {
        const accesorioId = acc.accesorio_id || acc.ID_accesorio || acc.id_accesorio;
        const monturaId = acc.id_montura || acc.montura_id;

        if (accesorioId && monturaId) {
          await dbConfig.query(
            'INSERT INTO optic_accessories (optica_id, accesorio_id, montura_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE montura_id = VALUES(montura_id)',
            [opticaId, accesorioId, monturaId]
          );
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
