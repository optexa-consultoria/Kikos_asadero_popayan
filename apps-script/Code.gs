const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI'; // Reemplazar con el ID real de la hoja de cálculo

/**
 * Función que maneja las peticiones GET (Lectura de Menú)
 * @param {Object} e Objeto del evento
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DB_Menu');
    if (!sheet) {
      throw new Error('Hoja DB_Menu no encontrada');
    }
    
    // Obtener todos los datos de la hoja
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      throw new Error('La hoja está vacía');
    }
    
    const headers = data.shift(); // Extrae la primera fila (encabezados)
    
    // Convertir el array 2D en un array de objetos JSON
    const jsonArray = data.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
    
    // Retornar JSON
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: jsonArray
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función que maneja las peticiones POST (Inserción de Pedidos)
 * @param {Object} e Objeto del evento
 */
function doPost(e) {
  try {
    // Validar que se reciba cuerpo en la petición
    if (!e.postData || !e.postData.contents) {
      throw new Error('No se recibieron datos en el cuerpo de la petición POST.');
    }
    
    const body = JSON.parse(e.postData.contents);
    
    // Desestructurar datos esperados del pedido (Ajustar según frontend)
    // Ejemplo de estructura: { "id_pedido": "123", "cliente": "Juan", "items": [...], "total": 25.50 }
    const id_pedido = body.id_pedido || generateId();
    const cliente = body.cliente || 'Anónimo';
    const items = body.items ? JSON.stringify(body.items) : '[]';
    const total = body.total || 0;
    const estado = 'Pendiente'; // Estado inicial
    const fecha = new Date(); // Marca de tiempo del servidor
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Log_Pedidos');
    if (!sheet) {
      throw new Error('Hoja Log_Pedidos no encontrada');
    }
    
    // Insertar la fila. El orden debe coincidir con las columnas de tu hoja Log_Pedidos
    // Ejemplo de columnas: Fecha | ID Pedido | Cliente | Items (JSON) | Total | Estado
    sheet.appendRow([fecha, id_pedido, cliente, items, total, estado]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Pedido registrado correctamente en Log_Pedidos'
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Utilidad: Generar ID único simple si no viene del frontend
 */
function generateId() {
  return 'ORD-' + Math.floor(Math.random() * 1000000);
}
