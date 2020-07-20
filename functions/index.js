const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Queue = require('./queue');

admin.initializeApp();
const db = admin.firestore();
const localesRef = db.collection('locales');
const usuariosRef = db.collection('users');

exports.agregarCola = functions.https.onCall((data, context) => {
    const keyUsuario = context.auth.uid;
    const keyLocal = data.keyLocal;
    const distancia = data.distancia;
    let posicionUsuario = 0;

    localesRef.doc(keyLocal).get().then(doc => {
        if (!doc.exists) {
            console.log('Error: El local ' + keyLocal + ' no existe.');
        } else {

            let colaDeUsuarios = new Queue(doc.data().queuedPeople);

            if (colaDeUsuarios.isEmpty()) {

                colaDeUsuarios.overwriteNext(keyUsuario);

            } else {
                if (!colaDeUsuarios.exists(keyUsuario)) {

                    colaDeUsuarios.enqueue(keyUsuario);
                    posicionUsuario = colaDeUsuarios.where(keyUsuario);

                } else {
                    console.log('Error: El usuario ' + keyUsuario + " ya existe en la cola del local " + keyLocal + ".");
                    return;
                }
            }

            localesRef.doc(keyLocal).set({
                queueNumber: colaDeUsuarios.length(),
                queuedPeople: colaDeUsuarios.total()
            }, { merge: true });
            
            usuariosRef.doc(keyUsuario).collection('misColas').doc(keyLocal).create({
                posicion: posicionUsuario,
                keyLocal: keyLocal,
                distancia: distancia
            });
        }
        return;

    }).catch(err => { console.error('Error', err); });

    return;
});

exports.eliminarCola = functions.https.onCall((data, context) => {
    const keyUsuario = data.keyUsuario;
    const keyLocal = context.auth.uid;
    
    localesRef.doc(keyLocal).get().then(doc => {
        if (!doc.exists) {
            console.log('Error: El local' + keyLocal + ' no existe.');
        } else {
            let colaDeUsuarios = new Queue(doc.data().queuedPeople);

            if (!colaDeUsuarios.isEmpty()) {
                if (colaDeUsuarios.exists(keyUsuario)) {

                    let posicionUsuario = colaDeUsuarios.where(keyUsuario);

                    if (posicionUsuario <= 3) {
                        colaDeUsuarios.delete(posicionUsuario);

                        usuariosRef.doc(keyUsuario).collection('misColas').doc(keyLocal).delete();

                        localesRef.doc(keyLocal).set({
                            queueNumber: colaDeUsuarios.length(),
                            queuedPeople: colaDeUsuarios.total()
                        }, { merge: true });
                    } else {
                        console.log('Error: El ' + keyUsuario + ' no esta dentro de los 3 primeros de la fila.');
                        return;
                    }
                } else {
                    console.log('Error: El usuario ' + keyUsuario + ' no existe en la cola.');
                    return;
                }
            } else {
                console.log('Error: El array "queuedPeople" esta vacio.');
                return;
            }
        }
        return;

    }).catch(err => { console.log('Error', err); });

    return;
});

exports.iniciarApp = functions.https.onCall(async(data, context) => {
    const keyUsuario = context.auth.uid;
    const radio = 5;
    let latUsuario = 0;
    let longUsuario = 0;
    let latLocal = 0;
    let longLocal = 0;
    let lat1 = 0;
    let lat2 = 0;
    let long1 = 0;
    let long2 = 0;

    try {
        const snapshot = await localesRef.doc(keyUsuario).collection('localesCercanos').get()
        snapshot.forEach(doc => {
            usuariosRef.doc(keyUsuario).collection('localesCercanos').doc(doc.id).delete();
        });
    } catch(err) {
        console.error('Error', err)
    }

    try {
        const doc = await usuariosRef.doc(keyUsuario).get();

        latUsuario = doc.data().ubicacion.latitude * 111;
        longUsuario = doc.data().ubicacion.longitude * 111;
    } catch(err) {
        console.error('Error', err);
    }

    localesRef.get().then(snapshot => {
        snapshot.forEach(doc => {
            latLocal = doc.data().ubicacion.latitude * 111;
            longLocal = doc.data().ubicacion.longitude * 111;

            if (latUsuario > latLocal) { lat2 = latUsuario; lat1 = latLocal; }
            if (latUsuario < latLocal) { lat2 = latLocal; lat1 = latUsuario; }
            if (longUsuario > longLocal) { long2 = longUsuario; long1 = longLocal; }
            if (longUsuario < longLocal) { long2 = longLocal; long1 = longUsuario; }

            var distancia = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(long2 - long1, 2));

            if (distancia <= radio) {
                distancia = Math.round(distancia * 10) / 10;
                usuariosRef.doc(keyUsuario).collection('localesCercanos').doc(doc.id).create({
                    keyLocal: doc.id,
                    distancia: distancia
                });
            }
        });
        return;

    }).catch(err => { console.error('Error', err) });

    return;
});