let socket = null; // No conectamos WebSocket de inmediato
let isAdminConnected = false; // Variable para verificar si el admin está conectado

function connectWebSocket() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        socket = new WebSocket("ws://localhost:8180");

        socket.addEventListener("open", function () {
            isAdminConnected = true;
            let data = JSON.stringify({
                type: "intento_admin",
                admin: isAdminConnected
            });

            socket.send(data);
            console.log("✅ Connexió WebSocket establerta.");
        });

        window.addEventListener("beforeunload", function () {
            isAdminConnected = false;
            //ENVIAR AL SERVIDOR EL ESTADO DE LA VARIABLE

            socket.send(JSON.stringify({
                type: "intento_admin",
                admin: isAdminConnected
            }))

            alert("⚠️ Connexió tancada. Redirigint a la pàgina principal.");
            window.location.href = "index.html";
        });

        socket.addEventListener("error", function () {
            alert("❌ Error en la connexió WebSocket.");
            window.location.href = "index.html";
        });

        socket.addEventListener("message", function (event) {
            console.log("📩 Missatge rebut:", event.data);

            try {
                let data = JSON.parse(event.data);

                if (data.type === "configuració") {
                    document.getElementById("width").value = data.width;
                    document.getElementById("height").value = data.height;
                    document.getElementById("pisos").value = data.pisos;

                } else if (data.type === "estat_joc") {
                    document.getElementById("startStopBtn").innerText = data.running ? "Aturar" : "Engegar";

                } else if (data.type === 'admin_conectado') {
                    // alert(data.message);
                } else if (data.type === 'error_admin') {
                    alert(data.message);
                    window.location.href = '/main';
                }
            } catch (error) {
                console.warn(event.data);
            }
        });
    }
}

function enviarConfiguracio() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "administrar" }));
    }

    let width = parseInt(document.getElementById("width").value, 10);
    let height = parseInt(document.getElementById("height").value, 10);
    let pisos = parseInt(document.getElementById("pisos").value, 10);
    
    // Validamos los campos. Si no cumplen, mostramos alert y detenemos
    if (width < 200 || width > 900) {
        alert("L'amplada ha de ser entre 200 i 900!");
        return;
    }
    if (height < 200 || height > 900) {
        alert("L'alçada ha de ser entre 200 i 900!");
        return;
    }
   
    if (pisos < 1 || pisos > 5) {
        alert("Els pisos han de ser entre 1 i 5!");
        return;
    }
    
   
    fetch("http://localhost:8081/configurar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width: width, height: height, pisos: pisos })
    })
    .then(response => response.json())
    .then(data => {
        alert("✅ Configuració enviada correctament!");
        console.log("📩 Resposta del servidor:", data);
    })
    .catch(error => {
        alert("❌ Error en enviar la configuració.");
        console.error("Error:", error);
    });
}

function iniciarAturarJoc() {
    let btn = document.getElementById("startStopBtn");
    let accio = btn.innerText === "Engegar" ? "engegar" : "aturar";

    fetch("http://localhost:8081/joc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: accio })
    })
        .then(response => response.json())
        .then(data => {
            btn.innerText = accio === "engegar" ? "Aturar" : "Engegar";
            alert(`✅ Joc ${accio === "engegar" ? "iniciat" : "aturat"} correctament!`);
        })
        .catch(error => {
            alert("❌ Error en canviar l'estat del joc.");
            console.error("Error:", error);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    // Connexio automatica web socket
    connectWebSocket();
    document.getElementById("startStopBtn").addEventListener("click", iniciarAturarJoc);
    document.getElementById("configurarBtn").addEventListener("click", enviarConfiguracio);

    // Crear el recuadro
    const widthInput = document.getElementById("width");
    const heightInput = document.getElementById("height");

    const previewBox = document.createElement("div");
    previewBox.style.position = "relative";
    previewBox.style.backgroundColor = "lightblue";
    previewBox.style.border = "2px solid black";
    previewBox.style.marginTop = "10px";

    // Agregarlo al cuerpo
    document.body.appendChild(previewBox);

    function updateBoxSize() {
        const width = parseInt(widthInput.value) || 0;
        const height = parseInt(heightInput.value) || 0;

        previewBox.style.width = `${width}px`;
        previewBox.style.height = `${height}px`;
    }

    widthInput.addEventListener("input", updateBoxSize);
    heightInput.addEventListener("input", updateBoxSize);
});
