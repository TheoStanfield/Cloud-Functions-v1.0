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
    let posicionUsuario = 0;
    let yaExisteEnCola = false;

    // set person in store's queue
    localesRef.doc(keyLocal).get().then(doc => {
        if (!doc.exists) {
            console.log('Error: El local ' + keyLocal + ' no existe.');
        } else {
            let colaDeUsuarios = new Queue(doc.data().queuedPeople);
            if (colaDeUsuarios.isEmpty()) {
                colaDeUsuarios.overwriteNext(keyUsuario);
            } else {
                if (colaDeUsuarios.exists(keyUsuario)) {
                    console.log('Error: El usuario ' + keyUsuario + " ya existe en la cola del local "
                    + keyLocal + ". - Coleccion Local.");
                    yaExisteEnCola = true;
                    return;
                } else {
                    colaDeUsuarios.enqueue(keyUsuario);
                    posicionUsuario = colaDeUsuarios.where();
                }
            }
            localesRef.doc(keyLocal).set({
                queueNumber: colaDeUsuarios.length(),
                queuedPeople: colaDeUsuarios.total()
            }, { merge: true });
        }
        return;
    }).catch(err => { console.error('Error', err); });

    // set user queue status
    usuariosRef.doc(keyUsuario).get().then(doc => {
        if (!doc.exists) {
            console.error('Error: el usuario ' + keyUsuario + ' no existe.');
        } else {
            if(!yaExisteEnCola) {
                misColas_Local = doc.data().misColas;
                usuariosRef.doc(keyUsuario).collection('misColas').doc(keyLocal).create({
                    posicion: posicionUsuario,
                    keyLocal: keyLocal
                });
            } else {
                console.log('El usuario ' + keyUsuario + " ya existe en la cola del local "
                + keyLocal + ". - Coleccion Usuario.");
            }
        }
        return;
    }).catch(err => { console.error('Error', err); });
    return;
});

exports.eliminarCola = functions.https.onCall((data, context) => {
    const keyUsuario = data.keyUsuario;
    const keyLocal = context.auth.uid;
    let errorEliminar = false;
    
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
                    } else {
                        console.log('Error: El ' + keyUsuario + ' no esta dentro de los 3 primeros de la fila.');
                        errorEliminar = true;
                        return;
                    }
                } else {
                    console.log('Error: El usuario ' + keyUsuario + ' no existe en la cola.');
                    errorEliminar = true;
                    return;
                }
            } else {
                console.log('Error: El array "queuedPeople" esta vacio.');
                errorEliminar = true;
                return;
            }
        }
        return;
    }).catch(err => { console.log('Error', err); });

    if (errorEliminar) {
        usuariosRef.doc(keyUsuario).collection('misColas').doc(keyLocal).delete();
    }
    return;
});