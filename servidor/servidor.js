
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import WebSocket, { WebSocketServer } from 'ws';
import * as gameLogic from './gameLogic.js';

import passport from 'passport';
import express from 'express';
import path from 'path';
import session from 'express-session';
import fs from 'fs';

import '../public/JS/auth.js';

// Crear servidor WebSockets i escoltar en el port 8180
const wsServer = new WebSocketServer({ port: 8180 });
console.log("Servidor WebSocket escoltant en http://localhost:8180");
// Enviar missatge a tothom excepte a 'clientExclos'
//	(si no s'especifica qui és el 'clientExclos', s'envia a tots els clients)
function broadcast(missatge, clientExclos) {
  wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && client !== clientExclos) {
      client.send(missatge);


    }
  });
}
let baseTrue = null;  // Base del equipo true (abajo derecha)
let baseFalse = null; // Base del equipo false (arriba izquierda)


let puntuacionEquipos = { true: 0, false: 0 };

let ultimaConfiguracio = null;
let clientesConectados = new Map(); // Guardará los clientes con su ID

let administradorConectado = false;
let desconectandoAdmin = false;

let administradoresConectados = new Map(); // Lista de administradores conectados

// Al rebre un nou client (nova connexió)
wsServer.on("connection", (client, peticio) => {
  let id = peticio.socket.remoteAddress + ":" + peticio.socket.remotePort;
  clientesConectados.set(client, id); // Guardamos la referencia del cliente con su ID
  console.log(`Cliente conectado: ${id}`);

  let id2 = clientesConectados.get(client); // Obtiene el ID del cliente

  if (!id2) {
    console.warn(" ID para un cliente.",);
  }


  client.send(JSON.stringify({ type: "benvinguda", message: `Benvingut ${id}` }));
  client.send(JSON.stringify({ type: "idJugador", message: `${id}` }));

  broadcast(JSON.stringify({ type: "nou_client", message: `Nou client afegit: ${id}` }), client);

  console.log(`Benvingut ${id}`);
  console.log(`Nou client afegit: ${id}`);

  // Si hay una configuración guardada, enviarla al nuevo cliente
  if (ultimaConfiguracio) {
    client.send(JSON.stringify({ type: "configuració", ...ultimaConfiguracio }));
  }

  client.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'movimiento') {
        const jugador = posicionesJugadores.find(j => j.id === data.id);
        if (!jugador) return;

        // Mover al jugador
        switch (data.movimiento) {
          case 'arriba':
            jugador.y = Math.max(0, jugador.y - 10);
            break;
          case 'abajo':
            jugador.y = Math.min(ultimaConfiguracio.height - 20, jugador.y + 10);
            break;
          case 'izquierda':
            jugador.x = Math.max(0, jugador.x - 10);
            break;
          case 'derecha':
            jugador.x = Math.min(ultimaConfiguracio.width - 20, jugador.x + 10);
            break;
        }

        // Si NO lleva piedra, mira a ver si coge alguna
        if (!jugador.tienePiedra) {
          for (let i = 0; i < posicionPiedras.length; i++) {
            const piedra = posicionPiedras[i];
            const colisionX = jugador.x < (piedra.x + 10) && (jugador.x + 20) > piedra.x;
            const colisionY = jugador.y < (piedra.y + 10) && (jugador.y + 20) > piedra.y;

            if (colisionX && colisionY) {
              posicionPiedras.splice(i, 1);  // Elimina la piedra
              jugador.tienePiedra = true;    // Jugador toma la piedra
              console.log(`Jugador ${jugador.id} COGE piedra. Ahora tienePiedra=${jugador.tienePiedra}`);
              break;
            }
          }
        }

        
        if (jugador.tienePiedra) {
          // Si es equipo === true, comprobamos con baseTrue;
          // Si es equipo === false, comprobamos con baseFalse
          if (jugador.equipo === true && gameLogic.estaEnBase(jugador, baseTrue)) {
            // suelta piedra y suma punto
            puntuacionEquipos[jugador.equipo] += 1;
            jugador.tienePiedra = false;
          } else if (jugador.equipo === false && gameLogic.estaEnBase(jugador, baseFalse)) {
            puntuacionEquipos[jugador.equipo] += 1;
            jugador.tienePiedra = false;
          }
        }

        // Avisar a todos de la posición actualizada
        broadcast(JSON.stringify({
          type: 'actualizar_posicion',
          id: data.id,
          x: jugador.x,
          y: jugador.y
        }));

        // Avisar lista de piedras y posiciones
        broadcast(JSON.stringify({
          type: 'CoordenadasJuego',
          posicionesJugadores,
          posicionPiedras,
          baseTrue,
          baseFalse,
        }));





      } else if (data.type === "intento_admin") {
        const admin = data.admin;

        if (admin) {
          administradoresConectados.set(client, id);

          if (administradorConectado) {
            console.log("Ya hay un administrador conectado");

            client.send(JSON.stringify({
              type: "error_admin",
              message: "Ja hi ha un administrador connectat"
            }));

            setTimeout(() => {
              client.close(); // Desconectar automáticamente al nuevo admin
            }, 500);
          } else {
            console.log("Administrador connectat");

            administradorConectado = true;

            client.send(JSON.stringify({
              type: "admin_conectado",
              message: "Ets l'administrador"
            }));


            console.log("Administradores conectados: ", administradoresConectados.size);

            broadcast(JSON.stringify({
              type: "admin_conectado",
              message: "S'ha connectat un administrador",
            }), client);
          }
        } else {
          administradorConectado = false;
          broadcast(JSON.stringify({
            type: "admin_conectado",
            message: "S'ha connectat un administrador",
          }), client);
        }






        //if (adminConectado) {
        //  // Si ya hay un administrador, rechazamos la conexión
        //  client.send(JSON.stringify({
        //    type: "error_admin",
        //    message: "Ya hay un administrador conectado. No puedes unirte."
        //  }));
        //  client.close(); // Cerramos la conexión del cliente
        //  return;
        //} else {
        //  // Si no hay un administrador, lo marcamos como conectado
        //  adminConectado = true;
        //  console.log("✅ Un administrador se ha conectado.");
        //
        //  client.send(JSON.stringify({
        //    type: "admin_conectado",
        //    message: "Eres el administrador y tienes acceso."
        //  }));
        //}
      } else if (data.type === "error_admin") {
        desconectandoAdmin = true; // Marcamos que se está redirigiendo manualmente

        setTimeout(() => {
          client.close();
        }, 500); // Esperamos 500ms para que el servidor procese
      }
    } catch (error) {
      console.error("Error procesando mensaje:", error);
    }
  });
  client.on("close", () => {

    clientesConectados.delete(client); 

    if (administradoresConectados.has(client)) {
      console.log("⚠️ Un administrador se ha desconectado.");
      administradoresConectados.delete(client);
      if (!desconectandoAdmin) {
        administradorConectado = false; 
      }
    }

    console.log("Administradores conectados: ", administradoresConectados.size);
    console.log(`Cliente desconectado: ${id}`);


    // Enviar mensaje de desconexión a todos
    broadcast(JSON.stringify({ type: 'jugador_desconectado', id: id }));
  });
});

/******************************************************************************
*						SERVIDOR WEB (port 8080)
******************************************************************************/
import { createServer } from 'http';
import { parse } from 'url';
import { existsSync, readFile } from 'fs';

function header(resposta, codi, cType) {
  resposta.setHeader('Access-Control-Allow-Origin', '*');
  resposta.setHeader('Access-Control-Allow-Methods', 'GET');
  if (cType) resposta.writeHead(codi, { 'Content-Type': cType });
  else resposta.writeHead(codi);
}
function enviarArxiu(resposta, dades, filename, cType, err) {
  if (err) {
    header(resposta, 400, 'text/html');
    resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>Error al l legir l'arxiu</p>");
    return;
  }
  header(resposta, 200, cType);
  resposta.write(dades);
  resposta.end();
}
function onRequest(peticio, resposta) {
  let cosPeticio = "";
  peticio.on('error', function (err) {
    console.error(err);
  }).on('data', function (dades) {
    cosPeticio += dades;
  }).on('end', function () {
    resposta.on('error', function (err) {
      console.error(err);
    });
    if (peticio.method == 'GET') {
      let q = parse(peticio.url, true);
      let filename = "." + q.pathname;
      if (filename == "./") filename += "index.html";
      if (existsSync(filename)) {
        readFile(filename, function (err, dades) {
          enviarArxiu(resposta, dades, filename, undefined, err);
        });
      }
      else {
        header(resposta, 404, 'text/html');
        resposta.end("<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>404 Not Found</p>");
      }
    }
  });
}
let server = createServer();
server.on('request', onRequest);
server.listen(8080);
console.log("Servidor escoltant en http://localhost:8080");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IMAGES_FOLDER = path.join(__dirname, 'imagenesCanva');
const app = express();

const credentials = JSON.parse(fs.readFileSync('private/credentials.json'));

// Configurar sessió Auth
app.use(session({ secret: credentials.client_secret }));
app.use(passport.initialize());
app.use(passport.session());



app.use(cors());
const PORT = 8081;
// Middleware per convetir JSON
app.use(express.json());
// Servir arxius estàtics des de la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));
// Carpeta on es troben les plantilles (arxius .ejs)
//	i el motor que s'utilitzarà per generar les pàgines html
app.set('views', path.join(__dirname, '../plantilles'));
app.set('view engine', 'ejs');

// Obtener valores de juego:
let posicionPiedras;

let posicionesJugadores = [];
app.post("/configurar", (req, res) => {
  const { width, height, pisos } = req.body;

  posicionPiedras = gameLogic.generarCoordenadasPiedra(width, height);

  const bases = gameLogic.generarCoordenadasBases(width, height);
  baseTrue = bases.baseTrue;
  baseFalse = bases.baseFalse;

  if (!width || !height || !pisos) {
    return res.status(400).json({ error: "Falten paràmetres." });
  }

  ultimaConfiguracio = { width, height, pisos };
  console.log("Nova configuració:", ultimaConfiguracio);

  // Enviar configuración a todos los clientes WebSocket
  wsServer.clients.forEach(client => {
    if (client.readyState === 1) { // Verifica si el cliente está abierto
      let id = clientesConectados.get(client); // Obtiene el ID del cliente
      let posicionJugador = gameLogic.generarCoordenadasJugador(width, height);
      let { x, y } = posicionJugador; 
      let equipo;
      // Guardamos cada jugador en el array
      posicionesJugadores.push({
        id,
        x,
        y,
        equipo,           // según tu lógica (true/false)
        tienePiedra: false  // nuevo flag
      });

      client.send(JSON.stringify({
        type: "configuració",
        ...ultimaConfiguracio
      }));

      console.log('La id del jugador es ' + id);
      client.send(JSON.stringify({ type: "missatge", id: id }));

      client.send(JSON.stringify({
        type: "misCoodenadas",
        id: id,
        posicion: posicionJugador
      }));

      console.log('Mi id y cordenadas: ' + JSON.stringify({ id, posicionJugador }));
    }
  });

  // Elimina el primer elemento (es el admin. Este cliente no debe estar en el juego)
  posicionesJugadores.splice(0, 1);


  posicionesJugadores.forEach((jugador, index) => {
    // Si index es par ⇒ true, si es impar ⇒ false
    jugador.equipo = (index % 2 === 0);
  });

  // Envía a todos los clientes la información completa

  broadcast(JSON.stringify({
    type: 'CoordenadasJuego',
    posicionesJugadores,
    posicionPiedras,
    baseTrue,
    baseFalse,
  }));

  res.json({
    message: "Configuració rebuda!",
    ultimaConfiguracio,
  });
});

app.post('/joc', (req, res) => {
  let joc = req.body.action;

  if (joc == "engegar") {
    broadcast(JSON.stringify({ type: "estat_joc", running: true }));
  } else if (joc == "aturar") {
    broadcast(JSON.stringify({ type: "estat_joc", running: false }));
  } else {
    return res.status(400).json({ error: "Acció no vàlida." });
  };
});

app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

app.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/failure',
    successRedirect: '/main',
  }),
);


app.get('/main', isLoggedIn, (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Main</title>
      </head>
      <body>
          <h1>Benvingut, <span id="username"></span></h1>
          
          <p><a href="admin.html">Administrar</a></p>
    <p><a href="player.html">Jugar</a></p>
          <script>
              const user = ${JSON.stringify(req.user)};
              document.getElementById('username').innerText = user.displayName;
          </script>
      </body>
      </html>
    `);
});


app.get('/auth/failure', (req, res) => {
  res.send("Something went wrong...");
})

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor responent en http://localhost:${PORT}`);
});

function esAdministrador(id) {
  return administradoresConectados.some(admin => admin.id === id);
}