class Cola {
    constructor() {
        this.personasEnCola = [];
    }
    enqueue(keyUsuario) {
        this.personasEnCola.push(keyUsuario);
    }
    dequeue() {
        this.personasEnCola.shift();
    }
    who(posicion) {
        return this.personasEnCola[posicion];
    }
    where(keyUsuario) {
        for (let i = 0; i < this.personasEnCola.length(); i++) {
            if (this.personasEnCola[i] === keyUsuario) {
                return i;
            }
        }
        return 'Error';
    }
    isEmpty() {
        return this.personasEnCola.length === 0;
    }
    peek() {
        return !this.isEmpty() ? this.personasEnCola[0] : undefined;
    }
    length() {
        return this.personasEnCola.length;
    }
    total() {
        return this.personasEnCola;
    }
}

module.exports = Cola;