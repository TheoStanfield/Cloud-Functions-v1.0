const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Queue = require('./queue');

admin.initializeApp();
const db = admin.firestore();
const localesRef = db.collection('locales');
const usuariosRef = db.collection('users');

exports.agregarCola = functions.https.onCall(async (data, context) => {
    const keyUsuario = context.auth.uid;
    const keyLocal = data.keyLocal;
    const distancia = data.distancia;
    let nombreLocal = null;
    let ususarioEnCola = false;
    let posicionUsuario = 0;

    try {
        const doc = await localesRef.doc(keyLocal).get()
        if (!doc.exists) {
            console.error('Error: El local ' + keyLocal + ' no existe.');
        } else {

            let colaDeUsuarios = new Queue(doc.data().queuedPeople);
            nombreLocal = doc.data().title

            if (colaDeUsuarios.isEmpty()) {

                colaDeUsuarios.overwriteNext(keyUsuario);

            } else {
                if (!colaDeUsuarios.exists(keyUsuario)) {

                    colaDeUsuarios.enqueue(keyUsuario);
                    posicionUsuario = colaDeUsuarios.where(keyUsuario);

                } else {
                    console.error('Error: El usuario ' + keyUsuario + ' ya existe en la cola del local ' + keyLocal + '.');
                    ususarioEnCola = true;
                }
            }

            if (!ususarioEnCola) {
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
        }
    } catch(err) {
        console.error('Error', err); 
    }
    
    if (!ususarioEnCola) {
        const payload = {
            "notification": {
                "title": nombreLocal,
                "body": "Agregado a la cola."
            }
        }

        admin.messaging().sendToDevice(context.instanceIdToken, payload).then(res => {
            console.log('Notification sent.');
            return;
        }).catch(err => {
            console.error('Notification not sent', err);
        });

    } else {
        const payload = {
            "notification": {
                "title": nombreLocal,
                "body": "Ya estás en cola."
            }
        }
        
        admin.messaging().sendToDevice(context.instanceIdToken, payload).then(res => {
            console.log('Notification sent.');
            return;
        }).catch(err => {
            console.error('Notification not sent', err);
        });
    }

    return;
});

exports.eliminarCola = functions.https.onCall(async (data, context) => {
    const keyUsuario = data.keyUsuario;
    const keyLocal = data.keyLocal;
    const keyDispositivo = context.instanceIdToken;
    const llamadaLocal = data.llamadaLocal;
    let cantidadUsuarios = null;
    let posicionUsuario = null;
    let nombreLocal = null;
    let tokenUsuario = null;
    console.log(llamadaLocal);
    
    try {
        const docLocal = await localesRef.doc(keyLocal).get();
        if (!docLocal.exists) {
            console.error('Error: El local' + keyLocal + ' no existe.');
        } else {
            let colaDeUsuarios = new Queue(docLocal.data().queuedPeople);
            nombreLocal = docLocal.data().title;

            if (!colaDeUsuarios.isEmpty()) {
                if (colaDeUsuarios.exists(keyUsuario)) {

                     posicionUsuario = colaDeUsuarios.where(keyUsuario);

                    if (posicionUsuario <= 3) {
                        colaDeUsuarios.delete(posicionUsuario);
                        cantidadUsuarios = colaDeUsuarios.length()

                        if (colaDeUsuarios.isEmpty()) {
                            colaDeUsuarios.enqueue(null);
                            cantidadUsuarios = 0;
                        }

                        usuariosRef.doc(keyUsuario).collection('misColas').doc(keyLocal).delete();

                        localesRef.doc(keyLocal).set({
                            queueNumber: cantidadUsuarios,
                            queuedPeople: colaDeUsuarios.total()
                        }, { merge: true });
                        
                    } else {
                        console.error('Error: El ' + keyUsuario + ' no esta dentro de los 3 primeros de la fila.');
                        return;
                    }
                } else {
                    console.error('Error: El usuario ' + keyUsuario + ' no existe en la cola.');
                    return;
                }
            } else {
                console.error('Error: La cola está vacía.');
                return;
            }
        }

        if (llamadaLocal) {
            const docUsuario = await usuariosRef.doc(keyUsuario).get();
            if (!docUsuario.exists) {
                console.error('Error: El ususario ' + keyUsuario + ' no existe.');
            } else {
                tokenUsuario = docUsuario.data().token;
            }
        }

    } catch(err) {
        console.error('Error', err);
    }

    if (llamadaLocal) {
        const payloadLocal = {
            "notification": {
                "title": nombreLocal,
                "body": "Usuario removido de la cola."
            }
        }

        admin.messaging().sendToDevice(keyDispositivo, payloadLocal).then(res => {
            console.log('Notification sent.');
            return;
        }).catch(err => {
            console.error('Notification not sent', err);
        });

        const payloadUsuario = {
            "notification": {
                "title": nombreLocal,
                "body": "Fuiste removido de la cola."
            }
        }

        console.log('Token usuario: ' + tokenUsuario);

        admin.messaging().sendToDevice(tokenUsuario, payloadUsuario).then(res => {
            console.log('Notification sent.');
            return;
        }).catch(err => {
            console.error('Notifcation not snet', err);
        });
    } else {
        const payload = {
            "notification": {
                "title": nombreLocal,
                "body": 'Has salido de la cola.'
            }
        }

        admin.messaging().sendToDevice(keyDispositivo, payload).then(res => {
            console.log('Notification sent.');
            return;
        }).catch(err => {
            console.error('Notification not sent', err);
        })
    }

    return;
});

exports.iniciarApp = functions.https.onCall(async (data, context) => {
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
        const snapshotUsuario = await usuariosRef.doc(keyUsuario).collection('localesCercanos').get()
        snapshotUsuario.forEach(doc => {
            usuariosRef.doc(keyUsuario).collection('localesCercanos').doc(doc.id).delete();
        });

        const doc = await usuariosRef.doc(keyUsuario).get();

        latUsuario = doc.data().ubicacion.latitude * 111;
        longUsuario = doc.data().ubicacion.longitude * 111;

        const snapshotLocal = await localesRef.get()
        snapshotLocal.forEach(doc => {

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
    } catch(err) {
        console.error('Error', err)
    }

    return;
});

exports.notifiacionDeCola = functions.firestore.document('locales/{localId}').onUpdate((snapshot, context) => {
    const localBefore = snapshot.before.data();
    const localAfter = snapshot.after.data();
    const queuedPeopleBefore = new Queue(localBefore.queuedPeople);
    const queuedPeopleAfter = new Queue(localAfter.queuedPeople);
});