const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.agregarCola = functions.https.onCall((data, context) => {
    const keyLocal = data.keyLocal;

    console.log('Function Called');

    let oldCantidad = 0;
    let newCantidad = 0;
    let personas = []
    let q = new Cola();

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
                console.log('Dato a agregarse: ' + personas[i] + '. Largo actual: ' + q.largo());
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

function Cola() {
    this.personasEnCola = [];
}

Cola.prototype.total = function() {
    return this.personasEnCola;
}

Cola.prototype.quien = function(posicion) {
    return this.personasEnCola[posicion];
}

Cola.prototype.donde = function(keyUsuario) {
    for (let i = 0; i < this.personasEnCola.length(); i++) {
        if (this.personasEnCola[i] === keyUsuario) {
            return i;
        }
    }
    return 'Error';
}

Cola.prototype.agregar = function(keyUsuario) {
    this.personasEnCola.push(keyUsuario);
}

Cola.prototype.salir = function() {
    this.personasEnCola.shift();
}

Cola.prototype.estaVacio = function() {
    return this.personasEnCola.length === 0;
}

Cola.prototype.proximo = function() {
    return !this.isEmpty() ? this.personasEnCola[0] : undefined;
}

Cola.prototype.largo = function() {
    return this.personasEnCola.length;
}