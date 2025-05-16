let posicionesJugadores;
let posicionPiedras;
let baseTrue;
let baseFalse;
let miPosicion;
let miId;
let width;
let height;

// Crear la conexión con el servidor WebSocket
const socket = new WebSocket('ws://localhost:8180');


socket.onopen = () => {
  socket.send(JSON.stringify({
    action: 'afegir jugador',
    admin: false
  }));
};

socket.onclose = function (event) {
  alert('La connexió s\'ha tancat. Motiu: ' + (event.reason || 'Desconegut'));
  // Redirigir a index.html a la mateixa pestanya
  window.location.href = 'index.html';
};

// Cuando se produce un error
socket.onerror = function (error) {
  alert('S\'ha produït un error en la connexió WebSocket.');
  // Redirigir a index.html a la mateixa pestanya
  window.location.href = 'index.html';
};

// Recibir y procesar los mensajes enviados por el servidor
socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    if (data.type === "actualizar_posicion") {
      // 1. Actualizar la posición en tu array local de jugadores
      posicionesJugadores = posicionesJugadores.map((jugador) => {
        if (jugador.id === data.id) {
          return {
            ...jugador,
            x: data.x,
            y: data.y
          };
        }
        return jugador;
      });

    
      if (data.id === miId && miPosicion) {
        miPosicion.x = data.x;
        miPosicion.y = data.y;
      }

     
      dibujar(miId, posicionesJugadores, posicionPiedras, baseTrue, baseFalse);

    } else {
     
      switch (data.type) {
        case 'configuració':
          width = data.width;
          height = data.height;
          break;

        case 'idJugador':
          miId = data.message;
          break;

        case "CoordenadasJuego":
          posicionesJugadores = data.posicionesJugadores;
          posicionPiedras = data.posicionPiedras;

          
          baseTrue = data.baseTrue;
          baseFalse = data.baseFalse;
         
          dibujar(miId, posicionesJugadores, posicionPiedras, baseTrue, baseFalse);
          break;

        case 'misCoodenadas':
          // Guardamos las coordenadas en miPosicion
          miPosicion = data.posicion;
          break;

        case 'estat_joc':
          if (data.running) {
            // Ajustar el tamaño del canvas
            const canvas = document.getElementById('gameCanvas');
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);

            const coordenadasJuego = datosJuego(posicionesJugadores, posicionPiedras);
            // Dibuja con la info
            dibujar(miId, coordenadasJuego.jugadores, coordenadasJuego.piedras, baseTrue, baseFalse);
          } else {
            window.location.href = '/index.html';
          }
          break;
        case "jugador_desconectado":
          posicionesJugadores = posicionesJugadores.filter(jugador => jugador.id !== data.id);
          // Redibujar el canvas
          dibujar(miId, posicionesJugadores, posicionPiedras, baseTrue, baseFalse);
          break;
        case 'benvinguda':
          console.log(data.message);
          break;
        case 'admin_conectado':
          console.log(data.message);
          break;
        case 'nou_client':
          console.log(data.message);
          break;

        default:
          console.log('Missatge desconegut:', data);
      }
    }
  } catch (error) {
    console.error("Error al procesar el mensaje:", error);
  }
};

function datosJuego(coordenadasJugadores, coordenadasPiedras) {
  return {
    jugadores: [...coordenadasJugadores],
    piedras: coordenadasPiedras
  };
}


function dibujar(miId, jugadores, piedras, baseTrue, baseFalse) {
  
  const canvas = document.getElementById("gameCanvas");

  const ctx = canvas.getContext("2d");


  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // === DIBUJAR BASE DEL EQUIPO FALSE
  if (baseFalse && baseFalse.topLeft && baseFalse.bottomRight) {
    const x1 = Math.min(baseFalse.topLeft.x, baseFalse.bottomRight.x);
    const y1 = Math.min(baseFalse.topLeft.y, baseFalse.bottomRight.y);
    const x2 = Math.max(baseFalse.topLeft.x, baseFalse.bottomRight.x);
    const y2 = Math.max(baseFalse.topLeft.y, baseFalse.bottomRight.y);

    ctx.fillStyle = "yellow";
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }

  // === DIBUJAR BASE DEL EQUIPO TRUE
  if (baseTrue && baseTrue.topLeft && baseTrue.bottomRight) {
    const x1 = Math.min(baseTrue.topLeft.x, baseTrue.bottomRight.x);
    const y1 = Math.min(baseTrue.topLeft.y, baseTrue.bottomRight.y);
    const x2 = Math.max(baseTrue.topLeft.x, baseTrue.bottomRight.x);
    const y2 = Math.max(baseTrue.topLeft.y, baseTrue.bottomRight.y);

    ctx.fillStyle = "purple";
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }

  // === DIBUJAR PIEDRAS
  if (piedras && Array.isArray(piedras)) {
    piedras.forEach((piedra) => {
      ctx.fillStyle = "black";
      ctx.fillRect(piedra.x, piedra.y, 10, 10);
    });
  }

  // === DIBUJAR JUGADORES
  if (jugadores && Array.isArray(jugadores)) {
    jugadores.forEach((jugador) => {
      if (jugador.id === miId) {
        ctx.fillStyle = "red";  // jugador local
      } else if (jugador.equipo) {
        ctx.fillStyle = "orange"; // equipo true
      } else {
        ctx.fillStyle = "blue";   // equipo false
      }

      if (jugador.tienePiedra) {
        ctx.fillStyle = "green";  // lleva piedra
      }

      ctx.fillRect(jugador.x, jugador.y, 20, 20);
    });
  }
}


document.addEventListener("keydown", (event) => {
  let movimiento;
  switch (event.key) {
    case "ArrowUp":
    case "w":
      movimiento = "arriba";
      break;
    case "ArrowDown":
    case "s":
      movimiento = "abajo";
      break;
    case "ArrowLeft":
    case "a":
      movimiento = "izquierda";
      break;
    case "ArrowRight":
    case "d":
      movimiento = "derecha";
      break;
    default:
      return;
  }


  socket.send(JSON.stringify({
    type: "movimiento",
    id: miId,
    movimiento: movimiento
  }));
});

