const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Ruta de prueba para chequear que el servidor funciona
app.get("/", async (req, res) => {
  res.send(`✅ Servidor activo.`);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});


app.post("/update-deal", async (req, res) => {
    const { codigoNegocio, ...otrosCampos } = req.body;
  
    // Validación básica
    if (!codigoNegocio || Object.keys(otrosCampos).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere 'codigoNegocio' y al menos un campo a actualizar"
      });
    }
  
    try {
      const result = await updateDeal(codigoNegocio, otrosCampos);
      res.json({
        success: true,
        message: "Deal actualizado correctamente.",
        result
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar el deal",
        error: error.message
      });
    }
  });
  

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

async function getDeal(codigoNegocio) {
    const token = await getFileMakerToken();
  
    const url = "https://190.151.60.197/fmi/data/vLatest/databases/Negocios%20Receptivo_prueba/layouts/Negocios%20PHP/_find";
    
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
              "CODIGO NEGOCIO": codigoNegocio
            }
          ]
        })
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
  const recordId = await getDeal(codigoNegocio);

  if (!recordId) {
    throw new Error(`No se encontró el deal con código: ${codigoNegocio}`);
  }

  const url = `https://190.151.60.197/fmi/data/vLatest/databases/Negocios%20Receptivo_prueba/layouts/Negocios%20PHP/records/${recordId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      fieldData: campos
    })
  });

  const data = await response.json();
  return data;
}
  
  


  



// getFileMakerToken();
