require("dotenv").config();
const express = require("express");
const app = express();
// servidor de pruebas
// const FM_HOST = "190.151.60.197";
// const DATABASE = "Negocios%20Receptivo_prueba";
const DATABASE = process.env.DATABASE;
const FM_HOST = process.env.FM_HOST;

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Esto es temporal para ignorar el certificado SSL (sacar en producción)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Codificamos en base64 el usuario que realizara la tarea en FM en este caso el usuario es "bastian"
const encodedCredentials = process.env.encodedCredentials;

// ****************************[INICIO] RUTAS****************************

// Ruta de prueba para chequear que el servidor funciona
app.get("/", async (req, res) => {
  res.send(`✅ Servidor activo.`);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});

app.post("/update-deal", async (req, res) => {
  const { r_filemaker, ...otrosCampos } = req.body;

  // Validación básica
  if (!r_filemaker || Object.keys(otrosCampos).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Se requiere 'r_filemaker' y al menos un campo a actualizar",
    });
  }

  try {
    const result = await updateDeal(r_filemaker, otrosCampos);
    res.json({
      success: true,
      message: "Deal actualizado correctamente.",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el deal",
      error: error.message,
    });
  }
});

app.post("/modificarEtapaNegocio", async (req, res) => {
  let data = req.body;

  console.log(data.properties.generado_en_sistema);

  if(data.properties.generado_en_sistema != undefined){

    let r_filemaker = data.properties.generado_en_sistema.value;
    let dealStage = dealStageName(data.properties.dealstage.value);

  
  
    let campos = {
      "ESTADO HS": dealStage,
    };

    try {
      const result = await updateDeal(r_filemaker, campos);
      res.json({
        success: true,
        message: "Deal actualizado correctamente.",
        result,
      });

      console.log("✅ Deal actualizado correctamente");
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar el deal",
        error: error.message,
      });

      console.log("❌ Error al actualizar el deal");
    }
  }else{
    console.log("El R del negocio aun no se ha creado");
  }
  
});

app.post("/modificarLlegaPor", async (req, res) => {
  let data = req.body;

  let r_filemaker = data.properties.generado_en_sistema.value;
  let llega_por = data.properties.llega_por.value;

  let campos = {
    "LLEGA POR": llega_por,
  };

  try {
    const result = await updateDeal(r_filemaker, campos);
    res.json({
      success: true,
      message: "Deal actualizado correctamente.",
      result,
    });

    console.log("✅ Deal actualizado correctamente");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el deal",
      error: error.message,
    });

    console.log("❌ Error al actualizar el deal");
  }
});

app.post("/modificarNombreNegocio", async (req, res) => {
  let data = req.body;

  let r_filemaker = data.properties.generado_en_sistema.value;
  let dealname = data.properties.dealname.value;

  let campos = {
    "NOMBRE DEL NEGOCIO": dealname,
  };

  try {
    const result = await updateDeal(r_filemaker, campos);
    res.json({
      success: true,
      message: "Deal actualizado correctamente.",
      result,
    });

    console.log("✅ Deal actualizado correctamente");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el deal",
      error: error.message,
    });

    console.log("❌ Error al actualizar el deal");
  }
});

app.post("/modificarQpax", async (req, res) => {
  let data = req.body;

  let r_filemaker = data.properties.generado_en_sistema.value;
  let qpax = data.properties.qpax.value;

  let campos = {
    "Nº PAX": qpax,
  };

  try {
    const result = await updateDeal(r_filemaker, campos);
    res.json({
      success: true,
      message: "Deal actualizado correctamente.",
      result,
    });

    console.log("✅ Deal actualizado correctamente");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el deal",
      error: error.message,
    });

    console.log("❌ Error al actualizar el deal");
  }
});

app.post("/create-deal", async (req, res) => {
  res.status(200).json({ success: true, message: "Recibido" });

  // Luego seguir procesando
  try {
    await createDeal(req.body); // o lo que corresponda
    console.log("✅ Deal creado correctamente.");
  } catch (error) {
    console.error("❌ Error al crear deal:", error);
  }
});

// ****************************[FIN] RUTAS****************************

// ****************************[INICIO] FUNCIONES****************************

async function getFileMakerToken() {
  var url =
    // Servidor de pruebas
    "https://" +
    FM_HOST +
    "/fmi/data/vLatest/databases/" +
    DATABASE +
    "/sessions";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.response && data.response.token) {
      console.log("✅ Token obtenido:", data.response.token);
      return data.response.token;
    } else {
      console.error("❌ Error al obtener token:", data);
    }
  } catch (error) {
    console.error("🚨 Error de conexión con FileMaker:", error.message);
  }
}

async function logoutFileMakerSession(token) {
  // Es crucial tener un token para poder cerrar la sesión
  if (!token) {
    console.error("❌ No se proporcionó un token para cerrar la sesión.");
    return;
  }

  // La URL para cerrar sesión incluye el token al final
  var url =
    "https://" +
    FM_HOST +
    "/fmi/data/vLatest/databases/" +
    DATABASE +
    "/sessions/" +
    token;

  try {
    const response = await fetch(url, {
      method: "DELETE", // El método para cerrar sesión es DELETE
    });

    const data = await response.json();

    // Una respuesta exitosa de cierre de sesión tiene un código "0"
    if (response.ok && data.messages[0].code === "0") {
      console.log("✅ Sesión cerrada correctamente.");
    } else {
      console.error("❌ Error al cerrar la sesión:", data);
    }
  } catch (error) {
    console.error("🚨 Error de conexión al cerrar sesión en FileMaker:", error.message);
  }
}

async function getAllDeals() {
  const token = await getFileMakerToken();

  var url =
    "https://" +
    FM_HOST +
    "/fmi/data/vLatest/databases/" +
    DATABASE +
    "/layouts/Negocios%20PHP/records";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log(data.response.data);
  } catch (error) {
    console.error("🚨 Error :", error.message);
  } 
  
}

async function getDeal(token, codigoNegocio) {
  // const token = await getFileMakerToken();

  const url =
    // Servidor de pruebas
    "https://" +
    FM_HOST +
    "/fmi/data/vLatest/databases/" +
    DATABASE +
    "/layouts/Negocios%20PHP/_find";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: [
          {
            "CODIGO NEGOCIO": codigoNegocio,
          },
        ],
      }),
    });

    const data = await response.json();

    if (response.ok && data.response.data.length > 0) {
      return data.response.data[0].recordId;
    } else {
      console.warn("🔍 Deal no encontrado para:", codigoNegocio);
      return null;
    }
  } catch (error) {
    console.error("🚨 Error al buscar deal:", error.message);
    throw error;
  } 

}

async function updateDeal(codigoNegocio, campos) {
  let token = null; // 1. Declara el token aquí para que sea accesible en 'finally'

  try {
    // 2. Intenta ejecutar toda la lógica principal
    token = await getFileMakerToken();
    if (!token) {
      throw new Error("No se pudo obtener el token de FileMaker.");
    }

    // Necesitamos el recordID del negocio para poder manipularlo en FM
    const recordId = await getDeal(token, codigoNegocio);
    if (!recordId) {
      throw new Error(`❌ No se encontró el deal con código: ${codigoNegocio}`);
    }

    const url =
      `https://` +
      FM_HOST +
      `/fmi/data/vLatest/databases/` +
      DATABASE +
      `/layouts/Negocios%20PHP/records/${recordId}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fieldData: campos,
      }),
    });

    const data = await response.json();

    if (response.ok && data.messages[0].code === "0") {
      console.log(`✅ Deal ${codigoNegocio} actualizado correctamente.`);
      return data; // Retorna el resultado si todo fue exitoso
    } else {
      // Si la API de FileMaker devuelve un error, lánzalo para que lo capture el 'catch'
      throw new Error(`Error de FileMaker al actualizar: ${data.messages[0].message}`);
    }

  } catch (error) {
    // 3. Captura cualquier error que ocurra en el bloque 'try'
    console.error("🚨 Error durante la actualización del deal:", error.message);
    // Opcionalmente, puedes retornar un valor de error o simplemente dejar que la función termine
    return { success: false, error: error.message };

  } finally {
    // 4. Se ejecuta SIEMPRE, haya habido éxito o error
    if (token) {
      console.log("⏳ Cerrando sesión de FileMaker...");
      await logoutFileMakerSession(token); // Asume que tienes esta función de la respuesta anterior
    }
  }
}

async function createDeal(campos = {}) {
  let token = null; // 1. Declara el token aquí para que sea accesible en 'finally'

  try {
    // Extrae los datos necesarios del objeto de entrada
    const id_hubspot = campos.objectId;
    const nombre_negocio = campos.properties.dealname.value;
    
    console.log(`Creando deal para HubSpot ID: ${id_hubspot}`);

    // 2. Intenta ejecutar la lógica principal
    token = await getFileMakerToken();
    if (!token) {
      throw new Error("No se pudo obtener el token de FileMaker.");
    }

    const url =
      `https://` +
      FM_HOST +
      `/fmi/data/vLatest/databases/` +
      DATABASE +
      `/layouts/Negocios%20PHP/records`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fieldData: {
          "IDE HUBSPOT": id_hubspot,
          "NOMBRE DEL NEGOCIO": nombre_negocio,
        },
      }),
    });

    const data = await response.json();

    if (response.ok && data.messages[0].code === "0") {
      console.log(`✅ Deal ${nombre_negocio} creado exitosamente en FileMaker.`);
      return data; // Retorna la respuesta exitosa
    } else {
      // Si la API de FileMaker devuelve un error, lánzalo
      throw new Error(`Error de FileMaker al crear: ${data.messages[0].message}`);
    }

  } catch (error) {
    // 3. Captura cualquier error que ocurra en el bloque 'try'
    console.error("🚨 Error durante la creación del deal:", error.message);
    return { success: false, error: error.message }; // Retorna un objeto de error

  } finally {
    // 4. Se ejecuta SIEMPRE, garantizando el cierre de sesión
    if (token) {
      console.log("⏳ Cerrando sesión de FileMaker...");
      // Asume que tienes la función logoutFileMakerSession de las respuestas anteriores
      await logoutFileMakerSession(token); 
    }
  }
}

function dealStageName(codigoDealStage) {
  const stages = {
    28494: "Solicita Servicio/Disponibilidad",
    28495: "Quote Sent",
    "d639ed73-f757-493a-a003-a425ad1b428a": "Quote Approved",
    28496: "Negocio Confirmado - Won",
    1186454: "Negocio listo para Welcome Letter",
    104531513: "Welcome letter lista con Observaciones",
    44174387: "Welcome letter lista",
    31786122: "Welcome Letter Enviada",
    28497: "Negocio perdido - Lost",
    appointmentscheduled: "Solicita servicio",
    presentationscheduled: "Proposal/Quote SENT",
    "205628d6-121b-4c99-921b-fb79a02eba79": "Booking Instructions SENT",
    closedwon: "Pago recibido 20% - Won",
    799833: "Pago 100% recibido",
    793264: "Negocio listo para Customer Service",
    31782955: "Welcome Letter Enviada",
    closedlost: "Cierre perdido",
    145110416: "Welcome Letter Lista",
    455777: "Solicita servicio",
    "f8b3f59c-e4f4-465d-a2fe-4342235ebefb": "Proposal/Quote SENT",
    "334dcddd-c1e7-4b58-8fa6-939bef3ae9f6": "Proposal/Quote Approved",
    892488: "Negocio Confirmado",
    892489: "Negocio Listo para Customer Service",
    31791890: "Welcome Letter Enviada",
    "048aee24-fb6d-4ad7-8141-3f3c8c282292": "Closed Lost",
    147809430: "Welcome Letter Lista",
  };

  return stages[codigoDealStage] ?? "Desconocido";
}

// ****************************[FIN] FUNCIONES****************************
