Introducció
Fa molts i molts anys, quan encara no existia l'antic Egipte, dues tribus lluitaven aferrissadament a banda i banda del riu Nil per controlar els recursos que proporcionava aquest riu.

Després de moltes batalles, es van adonar que tots sortien perjudicats, i van decidir unir-se sota el govern d'un únic líder, el Faraó.
Però cada tribu volia que el Faraó fos el seu líder.

Per decidir qui els havia de governar, van acordar que guanyaria la tribu que abans contruís una Gran Piràmide.

 

Arxiu index.html
Aquesta serà la pàgina d'entrada a la web de l'empresa OnlineGames.

De moment, l'únic joc que tenen és el Pyramid, així que només hi ha dos botons:

Administar: ha d'obrir la pàgina per administrar el joc (admin.html).
Jugar: ha d'obrir la pàgina per afegir-se al joc (player.html).
En qualsevol cas, abans poder accedir a qualsevol joc, cal autenticar l'usuari amb Google OAuth 2.0

 

Administrador
OK Després de carregar la pàgina admin.html, s'ha d'establir una connexió WebSocket amb el servidor en el port 8180.
OK Quan s'estableixi la connexió (onopen), ha d'enviar un missatge al servidor indicant que es vol administrar el joc.

OK En cas que es tanqui la connexió (onclose) o que es produeixi algun error (onerror), s'ha de mostrar el missatge amb alert() i tornar a la pàgina principal (index.html).

OK Ha de gestionar els missatges que rebi del servidor (onmessage), que poden ser:

OK un missatge de text: ha de mostrar el missatge per consola.
OK la configuració del joc: ha d'actualitzar la configuració.
OK actualitzar els valors que apareixen en el formulari de configuració (inputs "width", "height" i "pisos").
OK actualitzar els paràmetres del joc cridant.
OK posar en marxa el joc: canviar el text del botó Engengar per Aturar.
OK aturar el joc: canviar el text del botó Aturar per Engengar.
OK dibuixar els elements del joc.
 

Jugador
OK Després de carregar la pàgina player.html, s'ha d'establir una connexió WebSocket amb el servidor en el port 8180.
OK Quan s'estableixi la connexió (onopen), ha d'enviar un missatge al servidor indicant que es vol afegir un jugador.

FAIL En cas que es tanqui la connexió (onclose) o que es produeixi algun error (onerror), s'ha de mostrar el missatge amb alert() i tornar a la pàgina principal (index.html), que s'ha obrir en la mateixa pestanya.

Ha de gestionar els missatges que rebi del servidor (onmessage), que poden ser:

OK un missatge de text: ha de mostrar el missatge per consola.
OK la configuració del joc: ha d'actualitzar la configuració.
OK actualitzar el valor dels pisos que ha de tenir la piràmide (input "pisos").
OK actualitzar els paràmetres del joc.
FAIL connectat: ha de guardar l'identificador que li envia el servidor.
FAIL dibuixar els elements del joc.
FAIL També ha d'afegir el gestor per l'esdeveniment keydown.

Aquest gestor ha controlar les següents tecles:

A, S, D, W i fletxes per determinar la direcció en què es vol moure el jugador.
Les lletres fan els mateixos moviments que les fletxes; és per facilitar el joc als esquerrans.
Espai i Intro per agafar o deixar una pedra.
L'espai i l'Intro fan el mateix; és per facilitar el joc als esquerrans.
Quan es detecti una d'aquestes tecles, s'ha enviar un missatge al servidor per indicar l'acció que vol realitzar el jugador.

 

Servidor
El servidor web escolta el port 8080.

S'ha de programar un servidor WebSockets que escolti el port 8180 i que gestioni la lògica del joc i els missatges amb els clients.

Quan rebi una sol·licitud de connexió (connection), l'ha de crear, enviar un missatge amb la configuració del joc i gestionar els següents esdeveniments:

FAIL detectar si el client ha tancat la connexió (close): mostrar el missatge per consola indicant quin jugador (o administrador) s'ha desconnectat.
OK processar els missatges que li enviï el client (message):
OK administrar el joc: enviat al obrir la pàgina admin.html.
OK configurar el joc: enviat al clicar el botó Configurar de la pàgina admin.html.
FAIL engegar o aturar: enviat al clicar el botó Engegar/Aturar de la pàgina admin.html.
OK afegir un jugador: enviat al obrir la pàgina player.html.
FAILagafar, deixar o canviar direcció: enviat al prémer les tecles en la pàgina player.html.
També ha de generar un esdeveniment periòdic per moure els jugadors, afegir pedres...

FAIL Els jugadors no s'han de poder superposar ni sortir de l'àrea de joc.
FAIL Si dos jugador xoquen, no han de poder avançar.

FAIL Si un jugador deixa anar la pedra en la zona de construcció, s'afegeix a la piràmide.
FAIL Un jugador no li pot treure la pedra a un altre ni treure-les de la piràmide