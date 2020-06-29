const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Cola = require('./cola.js');

admin.initializeApp();
const db = admin.firestore();

exports.agregarCola = functions.https.onCall((data, context) => {
    console.log('Function Called');

    const keyLocal = data.keyLocal;

    let oldCantidad = 0;
    let newCantidad = 0;
    let personas = [];
    let q = new Cola()

    db.collection('locales').doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera')
    .get().then(doc => {
        if (!doc.exists) {
            console.log('El local ' + keyLocal + ' no existe.');
        } else {
            oldCantidad = doc.data().cantidad;
            personas = doc.data().personasEnCola;
            console.log('Lista original es: ' + personas);

            for (let i = 0; i < personas.length; i++) {
                q.agregar(personas[i]);
                console.log('Dato a agregarse: ' + personas[i] + '. Largo actual: ' + q.cantidad());
            }

            console.log('Lista q: ' + q.total());
            q.agregar('personaTest');
            newCantidad = oldCantidad + 1;

            db.collection('locales').doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera').set({
                cantidad: newCantidad,
                personasEnCola: q.total()
            } , { merge: true });
        }
        return;
    }).catch(err => {
        console.log('Error', err);
    });
    return;
});