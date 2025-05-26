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

console.log(DATABASE);
console.log(FM_HOST);
console.log(encodedCredentials);

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

app.post("/create-deal", async (req, res) => {
  res.status(200).json({ success: true, message: "Recibido" });

  // Luego seguir procesando
  try {
    await createDeal(req.body); // o lo que corresponda
    console.log("✅ Deal creado correctamente.");
  } catch (err) {
    console.error("❌ Error al crear deal:", err);
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
  const token = await getFileMakerToken();

  // Necesitamos el recordID del negocio para poder manipularlo en FM
  const recordId = await getDeal(token, codigoNegocio);

  if (!recordId) {
    throw new Error(`No se encontró el deal con código: ${codigoNegocio}`);
  }
  // Servidor pruebas
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
  return data;
}

async function createDeal(campos = {}) {
  let id_hubspot = campos.objectId;
  let nombre_negocio = campos.properties.dealname.value;
  console.log(id_hubspot);
  console.log(nombre_negocio);

  const token = await getFileMakerToken();

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

  if (!response.ok) {
    console.error("❌ Error al crear el deal:", data);
    throw new Error(data.messages?.[0]?.message || "Error desconocido");
  }

  return data;
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
