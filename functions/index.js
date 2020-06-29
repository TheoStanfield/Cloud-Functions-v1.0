const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Cola = require('./cola.js');

admin.initializeApp();
const db = admin.firestore();
const localesRef = db.collection('locales');
const usuariosRef = db.collection('users');

exports.agregarCola = functions.https.onCall((data, context) => {
    const uid = context.auth.uid;
    const keyLocal = data.keyLocal;
    let cantidadDePersonas = 0;
    let personas = [];
    let cola = new Cola();

    localesRef.doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera')
    .get().then(doc => {
        if (!doc.exists) {
            console.warn('Error: El local ' + keyLocal + ' no existe.');
        } else {
            cantidadDePersonas = doc.data().cantidad;
            personas = doc.data().personasEnCola;
            if (!(personas[0] === null)) {
                for (let i = 0; i < personas.length; i++) {
                    cola.enqueue(personas[i]);
                }
            }
            cola.enqueue(uid);
            localesRef.doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera').set({
                cantidad: cantidadDePersonas + 1,
                personasEnCola: cola.total()
            }, { merge: true });
        }
        return;
    }).catch(err => {
        console.warn('Error', err);
    });
    return;
});

exports.eliminarCola = functions.https.onCall((data, context) => {
    const keyLocal = data.keyLocal;
    let cantidadDePersonas = 0;
    let personas = [];
    let cola = new Cola();

    localesRef.doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera')
    .get().then(doc => {
        if (!doc.exists) {
            console.warn('Error: El local ' + keyLocal + ' no existe.');
        } else {
            cantidadDePersonas = doc.data().cantidad;
            personas = doc.data().personasEnCola;
            if (!(personas[0] === null)) {
                for (let i = 0; i < personas.length; i++) {
                    cola.enqueue(personas[i]);
                }
            }
            cola.dequeue();
            if (cola.isEmpty() || cantidadDePersonas === 1) {
                cola.enqueue(null)
            }
            localesRef.doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera').set({
                cantidad: cantidadDePersonas - 1,
                personasEnCola: cola.total()
            }, { merge: true });
        }
        return;
    }).catch(err => {
        console.warn('Error', err);
    });
    return;
});