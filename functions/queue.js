class Queue {
    constructor() { this.queue = []; }
    enqueue(keyUsuario) { this.queue.push(keyUsuario); }
    dequeue() { this.queue.shift(); }
    who(posicion) { return this.queue[posicion]; }
    where(keyUsuario) {
        for (let i = 0; i < this.queue.length; i++) { if (this.queue[i] === keyUsuario) { return i; } }
        return 'Error';
    }
    exists(keyUsuario) {
        for (let i = 0; i < this.queue.length; i++) { if (this.queue[i] === keyUsuario) { return true; } }
        return false;
    }
    isEmpty() { return this.queue.length === 0; }
    peek() { return !this.isEmpty() ? this.queue[0] : undefined; }
    length() { return this.queue.length; }
    total() { return this.queue; }
    delete(keyUsuario) {
        for (let i = 0; i < this.queue.length(); i++) {
            if (this.queue[i] === keyUsuario) {
                this.queue.splice(i, 1);
            }
        }
    }
}
module.exports = Queue;