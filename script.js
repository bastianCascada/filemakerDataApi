// Esto es temporal para ignorar el certificado SSL (sacalo en producción)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


// Codificamos en base64 → 
const encodedCredentials = "YmFzdGlhbjpDbGF2ZWZpbGVtYWtlcjIzMjQu";

async function getFileMakerToken() {

    var url = "https://190.151.60.197/fmi/data/vLatest/databases/Negocios%20Receptivo_prueba/sessions";

    try {
        const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${encodedCredentials}`
        }
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

    var url = "https://190.151.60.197/fmi/data/vLatest/databases/Negocios%20Receptivo_prueba/layouts/Negocios%20PHP/records";
    
    try {
        const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
        });

        const data = await response.json();
        console.log(data.response.data);

    } catch (error) {
        console.error("🚨 Error :", error.message);
    }
}

async function getDeal() {

    const token = await getFileMakerToken();

    var url = "https://190.151.60.197/fmi/data/vLatest/databases/Negocios%20Receptivo_prueba/layouts/Negocios%20PHP/_find";
    
    try {
        const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            query: [
              {
                "CODIGO NEGOCIO": "R10476/2011" // <- Asegurate que el nombre del campo es exactamente así
              }
            ]
        })
        });

        const data = await response.json();
        console.log(data.response.data[0].recordId);

    } catch (error) {
        console.error("🚨 Error :", error.message);
    }
}

async function udpateDeal() {

    const token = await getFileMakerToken();

    var url = "https://190.151.60.197/fmi/data/vLatest/databases/Negocios%20Receptivo_prueba/layouts/Negocios%20PHP/records/105519";
    
    try {
        const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fieldData: {
            "ESTADO HS": "render.com" 
          }
        })
        });

        const data = await response.json();
        console.log(data);

    } catch (error) {
        console.error("🚨 Error :", error.message);
    }
}

const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta de prueba para chequear que el servidor funciona
app.get("/", async (req, res) => {
//   udpateDeal();
  res.send(`✅ Servidor activo.`);
});

// A futuro, podrías agregar esto para recibir datos desde HubSpot:
app.post("/hubspot", (req, res) => {
  console.log("📩 Webhook de HubSpot:", req.body);
  // Acá procesás o reenviás los datos a FileMaker
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});


app.post("/update-deal", async (req, res) => {
    // 🔹 Extraemos los datos del cuerpo del request
    const { recordId, nuevoEstado } = req.body;
  
    // 🔸 Validamos que vengan los datos requeridos
    if (!recordId || !nuevoEstado) {
      return res.status(400).json({ 
        success: false, 
        error: "Faltan datos: recordId y nuevoEstado son obligatorios." 
      });
    }
  
    // 🔐 Obtenemos el token de FileMaker
    const token = await getFileMakerToken();
  
    // 🛠️ Construimos la URL con el ID del record
    const url = `https://190.151.60.197/fmi/data/vLatest/databases/Negocios%20Receptivo_prueba/layouts/Negocios%20PHP/records/${recordId}`;
  
    try {
      // 🔄 Enviamos la actualización a FileMaker
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fieldData: {
            "ESTADO HS": nuevoEstado  // <- Este es el campo que estás actualizando
          }
        })
      });
  
      const data = await response.json();
  
      // ✅ Respondemos al cliente con los datos devueltos por FileMaker
      res.json({ success: true, data });
  
    } catch (error) {
      console.error("🚨 Error al actualizar deal:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  



// getFileMakerToken();
