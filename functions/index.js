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

    // set person in store's queue
    localesRef.doc(keyLocal).get().then(doc => {
        if (!doc.exists) {
            console.error('Error: El local ' + keyLocal + ' no existe.');
        } else {
            alreadyQueued = doc.data().queuedPeople;

            if (!(alreadyQueued[0] === null)) {

                for (let i = 0; i < alreadyQueued.length; i++) { queue.enqueue(alreadyQueued[i]); }

                if (!queue.exists(keyUsuario)) {
                    queue.enqueue(keyUsuario);
                } else {
                    console.error('Error: el usuario ya existe dentro de la cola.');
                    return;
                }

            } else {
                queue.enqueue(keyUsuario);
            }
            localesRef.doc(keyLocal).set({
                queueNumber: queue.length(),
                queuedPeople: queue.total()
            }, { merge: true });
        }

        return;

    }).catch(err => { console.error('Error', err); });

    // set user queue status
    usuariosRef.doc(keyUsuario).get().then(doc => {
        if (!doc.exists) {
            console.error('Error: el usuario ' + keyUsuario + ' no existe.');
        } else {
            alreadyMyQueues = doc.data().misColas;

            if (!(alreadyMyQueues[0] === null)) {
                for (let i = 0; i < alreadyMyQueues.length; i++) { myQueues.enqueue(alreadyMyQueues[i]); }

                if (!myQueues.exists(keyLocal)) {
                    myQueues.enqueue(keyLocal);
                } else {
                    console.error('Error: el usuario ya existe dentro de la cola.');
                    return;
                }
            } else {
                myQueues.enqueue(keyLocal);
            }

            usuariosRef.doc(keyUsuario).set({ misColas: myQueues.total() }, { merge: true })
        }

        return;

    }).catch(err => { console.error('Error', err); });

    return;
});

exports.eliminarCola = functions.https.onCall((data, context) => {
    const keyUsuario = data.keyUsuario;
    const keyLocal = context.auth.uid;
    let alreadyQueued = [];
    let alreadyMyQueues = [];
    let queue = new Queue();
    let myQueues = new Queue();

    localesRef.doc(keyLocal).get().then(doc => {
        if (!doc.exists) {
            console.error('Error: el local requerido no existe.');
        } else {
            alreadyQueued = doc.data().queuedPeople;

            for (let i = 0; i < alreadyQueued.length; i++) {
                queue.enqueue(alreadyQueued[i]);
            }
            if (queue.exists(keyUsuario)) {
                queue.delete(keyUsuario);
            } else {
                console.error("Error: El usuario no existe en la cola.");
            }
        }

        localesRef.doc(keyLocal).set({
            queueNumber: queue.length(),
            queuedPeople: queue.total()
        });

        return;

    }).catch(err => { console.error('Error', err); });

    localesRef.doc(keyUsuario).get().then(doc => {
        if (!doc.exists) {
            console.error('Error: el local requerido no existe.');
        } else {
            alreadyMyQueues = doc.data().misColas;

            for (let i = 0; i < alreadyMyQueues.length; i++) {
                myQueues.enqueue(alreadyMyQueues[i]);
            }

            if (myQueues.exists(keyLocal)) {
                myQueues.delete(keyLocal);
            } else {
                console.error("Error: El usuario no existe en la cola.")
            }
        }

        return;

    }).catch(err => { console.error('Error', err); });

    return;
});