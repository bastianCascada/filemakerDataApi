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
            "ESTADO HS": "probando denuevo" 
          }
        })
        });

        const data = await response.json();
        console.log(data);

    } catch (error) {
        console.error("🚨 Error :", error.message);
    }
}


// getFileMakerToken();
