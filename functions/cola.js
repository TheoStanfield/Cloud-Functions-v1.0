class Cola {
    constructor() {
        this.personasEnCola = [];
    }
    total() {
        return this.personasEnCola;
    }
    quien(posicion) {
        return this.personasEnCola[posicion];
    }
    donde(keyUsuario) {
        for (let i = 0; i < this.personasEnCola.length(); i++) {
            if (this.personasEnCola[i] === keyUsuario) {
                return i;
            }
        }
        return 'Error';
    }
    agregar(keyUsuario) {
        this.personasEnCola.push(keyUsuario);
    }
    salir() {
        this.personasEnCola.shift();
    }
    estaVacio() {
        return this.personasEnCola.length === 0;
    }
    proximo() {
        return !this.estaVacio() ? this.personasEnCola[0] : undefined;
    }
    cantidad() {
        return this.personasEnCola.length;
    }
}

module.exports = Cola;