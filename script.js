require("dotenv").config();
const express = require("express");
const cors = require('cors'); 
const app = express();

app.use(cors());

// servidor de pruebas
// const FM_HOST = "190.151.60.197";
// const DATABASE = "Negocios%20Receptivo_prueba";
const DATABASE = process.env.DATABASE;
const FM_HOST = process.env.FM_HOST;
const TOKEN_HUBSPOT = process.env.TOKEN_HUBSPOT;

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Esto es temporal para ignorar el certificado SSL (sacar en producción)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Codificamos en base64 el usuario que realizara la tarea en FM 
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

  if(data.properties.generado_en_sistema != undefined){

    let r_filemaker = data.properties.generado_en_sistema.value;
    let dealStageCode = data.properties.dealstage.value;
    let dealStage = dealStageName(dealStageCode);
    let id_hs = data.objectId;
    let status_booking = "VACIO";

    let booking_checkfront = data.properties.booking_checkfront?.value;

    if(booking_checkfront){
        status_booking = data.properties.status_checkfront.value;
    }

    let etapa = "";

    console.log(dealStageCode);
    

  if(dealStageCode == "205628d6-121b-4c99-921b-fb79a02eba79" || dealStageCode == '28496' || dealStageCode == 'closedwon' || dealStageCode == '892488'){            
    etapa = "NEGOCIO";
  }else if(dealStageCode == 'appointmentscheduled' || dealStageCode == '28494' || dealStageCode == '455777'){ // solicita disponibilidad
    etapa = "COTIZACION";
  }
  
    let campos = {
      "ESTADO HS": dealStage,
    };

    
    let data_fm = "idhs=\""+id_hs+"\";  generado_en_sistema=\""+r_filemaker+"\"; etapa=\""+etapa+"\"; status_booking=\""+status_booking+"\"";


    try {
      const result = await updateDeal(r_filemaker, campos);
      res.json({
        success: true,
        message: "Deal actualizado correctamente.",
        result,
      });

      ejecutarScriptEnFM("ActualizarNegocioHS", data_fm);

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
    await createDeal(data);
    // console.log("El R del negocio aun no se ha creado");
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

app.post("/modificarMontoFilemaker", async (req, res) => {
  let data = req.body;
  
  if(data.properties.generado_en_sistema != undefined){

    let objectId = data.objectId;
    let r_filemaker = data.properties.generado_en_sistema.value;
    let monto = data.properties.amount.value;

    let dataParaFilemaker = {
      "objectId": objectId,
      "properties": {
          "generado_en_sistema": r_filemaker,
          "amount": monto
      }
    };



    ejecutarScriptEnFM("ActualizarCambioDeMonto", dataParaFilemaker);

  }else{
    // await createDeal(data);
    // console.log("El R del negocio aun no se ha creado");
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

app.post("/crear_lista_participantes", async (req, res) => {
  res.status(200).json({ success: true, message: "Recibido" });

  // Luego seguir procesando
  try {
    await crearListaParticipantes(req.body); // o lo que corresponda
    console.log("Lista de participantes creada exitosamente.");
  } catch (error) {
    console.error("❌ Error al crear la lista de participantes:", error);
  }
});

app.post("/get_data_participante", async (req, res) => {
  console.log("entra a get deal con:", req.body);

  try {
    const token = await getFileMakerToken();
    const data_negocio = await getDeal(token, req.body.codigo_negocio);
    
    // Extraemos los datos para enviarlos limpios
    
    const respuestaData = {
        pais: data_negocio.fieldData.PAIS,
        codigo_pais: data_negocio.fieldData['CODIGO PAIS'],
        direccion: data_negocio.fieldData.DIRECCION,
        ciudad: data_negocio.fieldData.CIUDAD,
        comuna: data_negocio.fieldData.COMUNA
    };

    // AQUI enviamos la respuesta final al cliente
    res.status(200).json({ 
        success: true, 
        data: respuestaData 
    });

    await logoutFileMakerSession(token);

  } catch (error) {
    console.error("❌ Error:", error);
    // Es importante responder con error si falla
    res.status(500).json({ success: false, message: "Error al obtener datos" });
  }
});

app.post("/modificarPropietarioNegocio", async (req, res) => {
  let data = req.body;

  if(data.properties.generado_en_sistema != undefined){
    if(data.properties.hubspot_owner_id.source == "API"){ // cambio realizado por la API como respuesta de restablecimiento (se cancela la modificación)
      console.log("Cambio realizado por la API");
      
   }else{
    let id_deal = data.objectId;
    let r_filemaker = data.properties.generado_en_sistema.value;
    let id_checkfront = data.properties.booking_checkfront?.value;
    let id_propietario = data.properties.hubspot_owner_id.value;
    let cambiado_por = data.properties.hubspot_owner_id.sourceId;
    let pipeline = data.properties.pipeline.value;
    let llega_por = data.properties.llega_por.value;
    let usuario_autorizado = true;

    let url_propietario  = "https://api.hubspot.com/crm/v3/owners/"+id_propietario;

    let data_propietario_total = await obtenerDatosFetch(url_propietario);

    let data_propietario = {

            "n_negocio":      r_filemaker,

            "nombre":         data_propietario_total.firstName,

            "apellido":       data_propietario_total.lastName,

            "email":          data_propietario_total.email,

            "llega_por":      llega_por,

            "cambiado_por":   cambiado_por

   };

   ejecutarScriptEnFM("notificarCambioDePropietario", data_propietario);

    // switch(pipeline){

    //      case "default"   : //FIT

    //         if(cambiado_por == "chloe@cascada.travel" ||

    //            cambiado_por == "isabel@cascada.travel" ||

    //            cambiado_por == "patricio@cascada.travel" ||

    //            cambiado_por == "david@cascada.travel" ||

    //            cambiado_por == "userId:6358169" ||

    //            cambiado_por == "userId:6351451" ||

    //            cambiado_por == "userId:6286929" ||

    //            cambiado_por == "userId:7747062")

    //            usuario_autorizado = true;

    //         break;

    //   case "76c9c89c-91f7-42ca-93ba-34a0aa882cca"   : // TO

    //         if(cambiado_por == "paula.b@cascada.travel" || 

    //         cambiado_por == "lorena@cascada.travel" || 

    //         cambiado_por == "marilia@cascada.travel" || 

    //         cambiado_por == "isabel@cascada.travel" || 

    //         cambiado_por == "patricio@cascada.travel" || 

    //         cambiado_por == "david@cascada.travel" ||

    //         cambiado_por == "userId:6351454" ||

    //         cambiado_por == "userId:6351451" ||

    //         cambiado_por == "userId:6286929" ||

    //         cambiado_por == "userId:7747062")

    //            usuario_autorizado = true;

    //         break;

    //   case "c787fac9-442b-4ec7-b009-5af7f023d99e"   : // OTA

    //         if(cambiado_por == "chloe@cascada.travel" || 

    //         cambiado_por == "isabel@cascada.travel" || 

    //         cambiado_por == "patricio@cascada.travel" || 

    //         cambiado_por == "david@cascada.travel" ||

    //         cambiado_por == "userId:6358169" ||

    //         cambiado_por == "userId:6351451" ||

    //         cambiado_por == "userId:6286929" ||

    //         cambiado_por == "userId:7747062")

    //            usuario_autorizado = true;

    //         break;

    //   }


   }
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
  } catch (error) {
    console.error("🚨 Error :", error.message);
  } 

}

async function getDeal(token, codigoNegocio) {
  // const token = await getFileMakerToken();

  const url =
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
      // return data.response.data[0].recordId;
      return data.response.data[0];
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
    const data_negocio = await getDeal(token, codigoNegocio);
    if (!data_negocio.recordId) {
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
          `/layouts/Negocios%20PHP/records/${data_negocio.recordId}`;

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
    let id_deal = campos.objectId;
    let url_deal = "https://api.hubapi.com/deals/v1/deal/"+id_deal;
    
    
    let data_deal = await obtenerDatosFetch(url_deal);
    
    let id_contacto = data_deal.associations?.associatedVids[0] ;
                
    let nombre_negocio = data_deal.properties.dealname?.value ;

    let monto = (data_deal.properties.amount?.value || '').replaceAll('.', ',');

    let moneda = data_deal.properties.deal_currency_code?.value ;
    let mail_vendedor = data_deal.properties.createdate?.sourceId ;

    let id_propietario = data_deal.properties.hubspot_owner_id?.value ;

    let url_vendedor  = "https://api.hubspot.com/crm/v3/owners/"+id_propietario;
    

    let data_vendedor = await obtenerDatosFetch(url_vendedor);

    

    let email_vendedor = data_vendedor.email;
    
    let vendedor = data_vendedor.firstName;

    let apellido_vendedor = data_vendedor.lastName;

    if(mail_vendedor == ""){
      
      mail_vendedor = "sistema@cascada.travel"; // solo por ahora.. debe ir la KAM de FIT

    }else if(mail_vendedor == "marilia@cascada.travel"){
      mail_vendedor = "lila@cascada.travel";
    }

    let pax = data_deal.properties.qpax?.value;

    let timestampSegundos_fecha_inicio = Math.floor(((data_deal.properties.fecha_inicio_viaje?.value)/1000) + 4 * 3600)

    let fecha_inicio_Obj = new Date(timestampSegundos_fecha_inicio * 1000);

    let formateador = new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let fecha_inicio = formateador.format(fecha_inicio_Obj);

    let timestampSegundos_fecha_creacion = Math.floor(((data_deal.properties.createdate?.value)/1000) + 4 * 3600)

    let fecha_creacion_Obj = new Date(timestampSegundos_fecha_creacion * 1000);

    let fecha_creacion = formateador.format(fecha_creacion_Obj);

    let tipo_cliente = data_deal.properties.pipeline?.value;

    let tipo_viajero = data_deal.properties.tipo_de_viajero?.value;

    let llega_por = data_deal.properties.llega_por?.value;

    let stage = data_deal.properties.dealstage?.value;

    let etapa = "";

    let id_cliente = "";

    let email_cliente = "";

    let nombre_cliente = "";

    let apellido_cliente = "";

    let pais_cliente = "";

    let idioma_de_preferencia_cliente = "";

    let rut_empresa = "";

    let pais_empresa = "";

    let id_contacto_to = "";

    let email_contacto_to = "";

    let booking_checkfront = data_deal.properties.booking_checkfront?.value ?? "";

    let tipo_ota = data_deal.properties.tipo_de_ota?.value ;

    let deal_stage = data_deal.properties.dealstage?.value; 



    if(stage == 'closedwon' || stage == '28496' || stage == '799833' || stage == '892488'){ // 799833 = 100% won FIT , 28496 = won 20% TO , closedwon = 20% won FIT, won TO = 892488

      etapa = "NEGOCIO";

    }else if(stage == 'appointmentscheduled' || stage == '28494' || stage == '455777' || stage == 'closedlost'){
      
      etapa = "COTIZACION";
      
    } // solicita disponibilidad
    
    
    let pipeline_to = "76c9c89c-91f7-42ca-93ba-34a0aa882cca"; // pipeline TO
    
    let pipeline_fit = "default"; // pipeline FIT
    
    let pipeline_ota = "c787fac9-442b-4ec7-b009-5af7f023d99e";
    


      if(tipo_cliente == pipeline_fit){
        
        tipo_cliente = "RECEPTIVO / FIT";

      }else if(tipo_cliente == pipeline_to){

        tipo_cliente = "RECEPTIVO / Operador";

      }else if(tipo_cliente == pipeline_ota){

        tipo_cliente = "RECEPTIVO / OTA";

      }                           
      

      if(tipo_cliente.toUpperCase() == "RECEPTIVO / FIT" || (tipo_cliente.toUpperCase() == "RECEPTIVO / OTA" && tipo_ota == 'P2')){

        if(data_deal.associations?.associatedVids[0]){ //obtener datos del cliente (contact hubspot)

            id_cliente = data_deal.associations?.associatedVids[0];

            let url_cliente = 'https://api.hubapi.com/contacts/v1/contact/vid/'+id_cliente+'/profile';

            try{
               
              let data_cliente = await obtenerDatosFetch(url_cliente);
              
              id_cliente = (data_cliente.properties.email?.value).replaceAll('@', '-');

              email_cliente = data_cliente.properties.email?.value;

              nombre_cliente = data_cliente.properties.firstname?.value;

              apellido_cliente = data_cliente.properties.lastname?.value;           

              pais_cliente = data_cliente.properties.country?.value;

              idioma_de_preferencia_cliente = data_cliente.properties.idioma_de_preferencia?.value;

           }catch(error ){

              console.error("No se encontro data de cliente");

           }

           

        }

      }

      else if(tipo_cliente.toUpperCase() == "RECEPTIVO / OPERADOR" || (tipo_cliente.toUpperCase() == "RECEPTIVO / OTA" && tipo_ota == 'P1')){

         if(data_deal.associations?.associatedCompanyIds[0]){//obtener datos de la compañia (company hubspot)

            id_cliente = data_deal.associations?.associatedCompanyIds[0];

            let url_cliente = 'https://api.hubapi.com/companies/v2/companies/'+id_cliente;
          
            try{

              let data_cliente = await obtenerDatosFetch(url_cliente);

              
              nombre_cliente = data_cliente.properties.name?.value;

              id_cliente = data_cliente.properties.name?.value;

              rut_empresa = data_cliente.properties.rut_to?.value;

              pais_empresa = data_cliente.properties.country?.value;

            }

            catch(error){

              console.error("No se encontro data de cliente empresa");

            }

         }

         if(data_deal.associations?.associatedVids[0]){//obtener datos del contacto Tour Operador

            id_contacto_to = data_deal.associations?.associatedVids[0];

            let url_cliente_to = 'https://api.hubapi.com/contacts/v1/contact/vid/'+id_contacto_to+'/profile';

            try{

              data_contacto_to = obtenerDatosFetch(url_cliente_to); 

             
              email_contacto_to = data_contacto_to.properties.email?.value;

            }

            catch(error){
              
               email_contacto_to = "";               

            }

         }

      }


    // 2. Intenta ejecutar la lógica principal
    token = await getFileMakerToken();
    if (!token) {
      throw new Error("No se pudo obtener el token de FileMaker.");
    }
    
    let url =
      `https://` +
      FM_HOST +
      `/fmi/data/vLatest/databases/` +
      DATABASE +
      `/layouts/Negocios%20PHP/_find`;

    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        "query": [
          {"IDE HUBSPOT": `==${id_deal}`}
      ],
      }),
    });
        let data = await response.json();
        
        data = data.response.data[0]?.fieldData
        

        if(data){
          vendedor = data?.VENDEDOR;
        }
        

    
    parametros = "idhs=\""+id_deal+"\"; idclientehs=\""+id_contacto+"\"; etapa=\""+etapa+"\";  booking=\""+booking_checkfront+"\"; tipocliente=\""+tipo_cliente.toUpperCase()+"\"; tipoOta=\""+tipo_ota+"\";idcliente=\""+id_cliente+"\"; rutempresa=\""+rut_empresa+"\"; nombrecliente=\""+nombre_cliente+"\";apellidoCliente=\""+apellido_cliente+"\"; emaildecontacto=\""+email_cliente+"\";mailcliente=\""+email_cliente+"\"; nombrenegocio=\""+nombre_negocio+"\"; monto=\""+monto+"\";moneda=\""+moneda+"\"; mailvendedor=\""+email_vendedor+"\"; vendedor=\""+vendedor+"\"; apellidovendedor=\""+apellido_vendedor+"\"; fechacreacion=\""+fecha_creacion+"\"; pax=\""+pax+"\"; fechainicio=\""+fecha_inicio+"\"; pais=\""+pais_cliente+"\"; tipodeviajero=\""+tipo_viajero+"\";llegapor=\""+llega_por+"\"; productos=\"\"; deal_stage=\""+deal_stage+"\"; idioma_de_preferencia=\""+idioma_de_preferencia_cliente+"\" ";
    
    let url_2 =
      `https://` +
      FM_HOST +
      `/fmi/data/vLatest/databases/` +
      DATABASE +
      `/layouts/Negocios%20PHP/script/CrearNegocioHS?script.param=`+encodeURIComponent(parametros);;

    let response_2 = await fetch(url_2, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    let data_2 = await response_2.json();

    

    if (response.ok && data_2.messages[0].code === "0") {
      console.log(`✅ Deal ${nombre_negocio} creado exitosamente en FileMaker.`);
      return data_2; // Retorna la respuesta exitosa
    } else {
      // Si la API de FileMaker devuelve un error, lánzalo
      throw new Error(`Error de FileMaker al crear: ${data_2.messages[0].message}`);
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

async function crearListaParticipantes(campos = {}) {
  let id_deal = campos.objectId;

  let pipeline_to = "76c9c89c-91f7-42ca-93ba-34a0aa882cca"; // pipeline TO
  let pipeline_fit = "default"; // pipeline FIT

  let url_deal = "https://api.hubapi.com/deals/v1/deal/"+id_deal;

  let data_deal = await obtenerDatosFetch(url_deal);

  let id_contacto = data_deal.associations?.associatedVids[0];

  let tipo_cliente = data_deal.properties.pipeline?.value;

  if(tipo_cliente == pipeline_fit){
    tipo_cliente = "FIT";
  }else if(tipo_cliente == pipeline_to){
    tipo_cliente = "TO";
  }else{
    tipo_cliente = "FIT";
  }

  let url_contacto = "https://api.hubapi.com/contacts/v1/contact/vid/"+id_contacto+"/profile";

if(id_contacto == undefined){
  console.log("No existe id_contacto !!!");
  
  id_contacto = "";
}
console.log(id_contacto);

  
  let url_lista_participantes = "https://participantes.cascada.systems/formulario/?cliente="+tipo_cliente+"&idd="+id_deal+"&idc="+id_contacto;
  

  let url = "https://api.hubapi.com/crm/v3/objects/0-3/"+id_deal;

  let response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN_HUBSPOT}`,
      },
      body: JSON.stringify({
        "properties": {
            "url_lista_de_participantes": url_lista_participantes
        }
      }),
    });
      let data = await response.json();       

}



async function obtenerDatosFetch(url) {
  try {
    // Realiza la petición a la URL, añadiendo las cabeceras (headers)
    const respuesta = await fetch(url, {
      headers: {
        // Agrega la cabecera de autorización con el esquema "Bearer"
        'Authorization': `Bearer ${TOKEN_HUBSPOT}`,
        'Content-Type': 'application/json'
      }
    });

    // Verifica si la respuesta fue exitosa (código 200-299).
    if (!respuesta.ok) {
        // Lanza un error con el status para poder identificar problemas (ej. 401, 403)
        throw new Error(`Error en la petición: ${respuesta.status}`);
    }

    // Convierte la respuesta a un objeto JSON.
    const dataDeal = await respuesta.json();

    // Ahora puedes usar la variable dataDeal como un objeto de JavaScript.
    return dataDeal;

  } catch (error) {
    console.error("Hubo un problema con la operación de fetch:", error);
  }
}

async function ejecutarScriptEnFM(guionFM, data) {

  token = await getFileMakerToken();
    if (!token) {
      throw new Error("No se pudo obtener el token de FileMaker.");
    }

  const url =
    `https://` +
    FM_HOST +
    `/fmi/data/vLatest/databases/` +
    DATABASE +
    `/layouts/Negocios%20PHP/script/${guionFM}?script.param=${encodeURIComponent(data)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    const data = await response.json();

    console.log(data);
    
  } catch (error) {
    console.error("🚨 Error al ejecutar guion '"+ guionFM +"':", error.message);
    throw error;
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
