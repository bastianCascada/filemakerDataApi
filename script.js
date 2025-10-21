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
  let token = null;
  const maxRetries = 3; // Número máximo de reintentos
  const retryDelay = 500; // Tiempo de espera en milisegundos (0.5 segundos)

  try {
    token = await getFileMakerToken();
    if (!token) {
      throw new Error("No se pudo obtener el token de FileMaker.");
    }

    // El recordId solo lo buscamos una vez.
    const recordId = await getDeal(token, codigoNegocio);
    if (!recordId) {
      throw new Error(`❌ No se encontró el deal con código: ${codigoNegocio}`);
    }

    // --- INICIO DE LA LÓGICA DE REINTENTOS ---
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intento ${attempt} de ${maxRetries} para actualizar el deal ${codigoNegocio}...`);

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

        // Si la actualización es exitosa, salimos del bucle y retornamos los datos.
        if (response.ok && data.messages[0].code === "0") {
          console.log(`✅ Deal ${codigoNegocio} actualizado correctamente.`);
          return data;
        }

        // Si el error es específicamente "Record in use" (código 301 de FM)
        if (data.messages[0].code === "301") {
          console.warn(`Registro ${codigoNegocio} en uso. Reintentando en ${retryDelay}ms...`);
          // Si es el último intento, lanzamos el error para que sea capturado afuera.
          if (attempt === maxRetries) {
            throw new Error(`Error de FileMaker al actualizar: ${data.messages[0].message} (después de ${maxRetries} intentos)`);
          }
          // Esperamos antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          // Si es otro tipo de error de FileMaker, lo lanzamos inmediatamente.
          throw new Error(`Error de FileMaker al actualizar: ${data.messages[0].message}`);
        }

      } catch (error) {
        // Si el error es por el reintento y ya no quedan más, lo relanzamos
        if (attempt === maxRetries) {
          throw error;
        }
        // Si no, el bucle continuará al siguiente intento (si el error fue el 301)
      }
    }
    // --- FIN DE LA LÓGICA DE REINTENTOS ---

  } catch (error) {
    console.error("🚨 Error final durante la actualización del deal:", error.message);
    return { success: false, error: error.message };

  } finally {
    if (token) {
      console.log("⏳ Cerrando sesión de FileMaker...");
      await logoutFileMakerSession(token);
    }
  }
}



async function createDeal(campos = {}) {
  let token = null; // 1. Declara el token aquí para que sea accesible en 'finally'

  try {
    // Extrae los datos necesarios del objeto de entrada
    const id_deal = campos.objectId;
    const url_deal = "https://api.hubapi.com/deals/v1/deal/"+id_deal;
    const data_deal = obtenerDatosFetch(url_deal);
    const id_contacto = data_deal.associations.associatedVids[0];
    const nombre_negocio = data_deal.dealname.value;
    const monto = (data_deal.properties.amount.value).replaceAll(".", ",");
    const moneda = data_deal.properties.deal_currency_code.value;
    const mail_vendedor = data_deal.properties.createdate.sourceId;

    const $id_propietario = data_deal.properties.hubspot_owner_id.value;

    if(mail_vendedor == ""){
      
      mail_vendedor = "sistema@cascada.travel"; // solo por ahora.. debe ir la KAM de FIT

    }else if(mail_vendedor == "marilia@cascada.travel"){
      mail_vendedor = "lila@cascada.travel";
    }

    const pax = data_deal.properties.qpax.value;

    const timestampSegundos_fecha_inicio = Math.floor(((data_deal.properties.fecha_inicio_viaje.value)/1000) + 4 * 3600)

    let fecha_inicio_Obj = new Date(timestampSegundos_fecha_inicio * 1000);

    const formateador = new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const fecha_inicio = formateador.format(fecha_inicio_Obj);

    const timestampSegundos_fecha_creacion = Math.floor(((data_deal.properties.createdate.value)/1000) + 4 * 3600)

    let fecha_creacion_Obj = new Date(timestampSegundos_fecha_creacion * 1000);

    const fecha_creacion = formateador.format(fecha_creacion_Obj);

    let tipo_cliente = data_deal.properties.pipeline.value;

    const tipo_viajero = data_deal.properties.tipo_de_viajero.value;

    const llega_por = data_deal.properties.llega_por.value;

    const stage = data_deal.properties.dealstage.value;

    const booking_checkfront = data_deal.properties.booking_checkfront.value;

    const tipo_ota = data_deal.properties.tipo_de_ota.value;

    const deal_stage = data_deal.properties.dealstage.value;   


    if(stage == 'closedwon' || stage == '28496' || stage == '799833' || stage == '892488'){ // 799833 = 100% won FIT , 28496 = won 20% TO , closedwon = 20% won FIT, won TO = 892488

      const etapa = "NEGOCIO";

    }else if(stage == 'appointmentscheduled' || stage == '28494' || stage == '455777'){

      const etapa = "COTIZACION";

    } // solicita disponibilidad

         
    const pipeline_to = "76c9c89c-91f7-42ca-93ba-34a0aa882cca"; // pipeline TO

    const pipeline_fit = "default"; // pipeline FIT

    const pipeline_ota = "c787fac9-442b-4ec7-b009-5af7f023d99e";



      if(tipo_cliente == pipeline_fit){
        
        tipo_cliente = "RECEPTIVO / FIT";

      }else if(tipo_cliente == pipeline_to){

        tipo_cliente = "RECEPTIVO / Operador";

      }else if(tipo_cliente == pipeline_ota){

        tipo_cliente = "RECEPTIVO / OTA";

      }




         

      if(toUpperCase(tipo_cliente) == "RECEPTIVO / FIT" || (toUpperCase(tipo_cliente) == "RECEPTIVO / OTA" && tipo_ota == 'P2')){

        if(data_deal.associations.associatedVids[0]){ //obtener datos del cliente (contact hubspot)

            const id_cliente = data_deal.associations.associatedVids[0];

            const url_cliente = 'https://api.hubapi.com/contacts/v1/contact/vid/'+id_cliente+'/profile';

            try{

               
              const data_cliente = obtenerDatosFetch(url_cliente);

              const id_cliente = data_cliente.properties.email.value;

              const email_cliente = data_cliente.properties.email.value;

              const nombre_cliente = data_cliente.properties.firstname.value;

              const apellido_cliente = data_cliente.properties.lastname.value;           

              const pais_cliente = data_cliente.properties.country.value;

              const idioma_de_preferencia_cliente = data_cliente.properties.idioma_de_preferencia.value;

           }catch(error ){

              console.error("No se encontro data de cliente");

           }

           

        }

      }

      else if(toUpperCase(tipo_cliente) == "RECEPTIVO / OPERADOR" || (toUpperCase(tipo_cliente) == "RECEPTIVO / OTA" && tipo_ota == 'P1')){

         if(data_deal.associations.associatedCompanyIds[0]){//obtener datos de la compañia (company hubspot)

            const id_cliente = data_deal.associations.associatedVids[0];

            const url_cliente = 'https://api.hubapi.com/companies/v2/companies/'+id_cliente;

            try{

              const data_cliente = obtenerDatosFetch(url_cliente);

              
              const nombre_cliente = data_cliente.properties.name.value;

              const id_cliente = data_cliente.properties.name.value;

              const rut_empresa = data_cliente.properties.rut_to.value;

              const pais = data_cliente.properties.country.value;

            }

            catch(error){

              console.error("No se encontro data de cliente");

            }

         }

         if(data_deal.associations.associatedVids[0]){//obtener datos del contacto Tour Operador

            const id_contacto_to = data_deal.associations.associatedVids[0];

            const url_cliente_to = 'https://api.hubapi.com/contacts/v1/contact/vid/'+id_contacto_to+'/profile';

            try{

               data_contacto_to = obtenerDatosFetch(url_cliente_to); 

             
               const email_contacto_to = data_contacto_to.properties.email.value;

            }

            catch(error){
              
               email_contacto_to = "";               

            }

         }

      }


    console.log(`Creando deal para HubSpot ID: ${id_deal}`);
    console.log(id_deal);
    console.log(id_contacto);
    console.log(nombre_negocio);
    console.log(monto);
    console.log(moneda);
    console.log(mail_vendedor);
    console.log(id_propietario);
    console.log(pax);
    console.log(fecha_inicio);
    console.log(fecha_creacion);
    console.log(tipo_cliente);
    console.log(tipo_viajero);
    console.log(llega_por);
    console.log(stage);
    console.log(booking_checkfront);
    console.log(tipo_ota);
    console.log(deal_stage);
    console.log(etapa);
    console.log(pipeline_to);
    console.log(pipeline_fit);
    console.log(pipeline_ota);
    console.log(id_cliente);
    console.log(email_cliente);
    console.log(nombre_cliente);
    console.log(apellido_cliente);
    console.log(pais_cliente);
    console.log(idioma_de_preferencia_cliente);
    console.log(rut_empresa);
    console.log(pais);
    console.log(id_contacto_to);
    console.log(email_contacto_to);

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
          "IDE HUBSPOT": id_deal,
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

async function IngresarNegocioHubspot() {
  
}


async function obtenerDatosFetch(url) {
  try {
    // Realiza la petición a la URL
    const respuesta = await fetch(url);

    // Verifica si la respuesta fue exitosa (código 200-299).
    if (!respuesta.ok) {
        throw new Error(`Error en la petición: ${respuesta.status}`);
    }

    // Simula json_decode(): convierte la respuesta a un objeto JSON.
    const dataDeal = await respuesta.json();

    // Ahora puedes usar la variable dataDeal como un objeto de JavaScript.
    console.log(dataDeal);
    return dataDeal;

  } catch (error) {
    console.error("Hubo un problema con la operación de fetch:", error);
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
