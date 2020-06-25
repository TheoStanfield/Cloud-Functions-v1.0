const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.agregarCola = functions.https.onCall((data, context) => {
    const keyLocal = data.keyLocal;

    console.log('Function Called');

    let oldCantidad = 0;
    let newCantidad = 0;

    db.collection('locales').doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera')
    .get().then(doc => {
        if (!doc.exists) {
            console.log('El local ' + keyLocal + ' no existe.');
        } else {
            oldCantidad = doc.data().cantidad;
            newCantidad = oldCantidad + 1;
            db.collection('locales').doc(keyLocal).collection('colaDeEspera').doc('colaDeEspera').set({
                cantidad: newCantidad
            } , { merge: true });
        }
        return;
    }).catch(err => {
        console.log('Error', err);
    });
    return;
});