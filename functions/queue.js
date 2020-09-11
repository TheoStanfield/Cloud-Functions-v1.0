class Queue {
    constructor(queue) { this.queue = queue; }
    enqueue(keyUsuario) { this.queue.push(keyUsuario); }
    overwriteNext(keyUsuario) { this.queue[0] = keyUsuario; }
    dequeue() { this.queue.shift(); }
    delete(posicion) {
        this.queue.splice(posicion, 1);
    }
    who(posicion) { return this.queue[posicion]; }
    where(keyUsuario) {
        for (let i = 0; i < this.queue.length; i++) { if (this.queue[i] === keyUsuario) { return i; } }
        return 'Error.';
    }
    exists(keyUsuario) {
        for (let i = 0; i < this.queue.length; i++) { if (this.queue[i] === keyUsuario) { return true; } }
        return false;
    }
    isEmpty() { return this.length() === 0 || this.who(0) === null ? true : false; }
    length() { return this.queue.length; }
    total() { return this.queue; }
}
module.exports = Queue;
