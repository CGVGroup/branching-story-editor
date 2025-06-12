export default class UndoStack<T> {
    stack: T[];
    index: number;

    constructor(initialElements?: T[], index?: number) {
        if (initialElements) {
            this.stack = [...initialElements];
        } else {
            this.stack = [];
        }
        this.index = index ?? 0;
    }

    canUndo() {
        return this.stack.length > 0 && this.index > 0;
    }

    canRedo() {
        return this.index < this.stack.length - 1;
    }
    
    undo() {
        if (!this.canUndo()) return this;
        this.index--;
        return this.clone();
    }

    redo() {
        if (!this.canRedo()) return this;
        this.index++;
        return this.clone();
    }

    push(element: T) {
        this.stack = this.stack.slice(0, this.index + 1)
        this.stack.push(element);
        this.index++;
        return this.clone();
    }

    pop() {
        this.stack.pop();
        this.index--;
        return this.clone();
    }

    set(element: T) {
        this.stack[this.index] = element;
        return this.stack.filter((_, idx) => idx <= this.index);
    }

    peek() {
        return this.stack[this.index];
    }

    clone() {
        return new UndoStack(this.stack, this.index);
    }
}