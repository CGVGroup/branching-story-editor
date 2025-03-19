export default class UndoStack<T> {
    stack: T[];
    index: number;

    constructor(initialElements?: T[], index?: number) {
        if (initialElements !== undefined) {
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
        return new UndoStack(this.stack, this.index);
    }

    redo() {
        if (!this.canRedo()) return this;
        this.index++;
        return new UndoStack(this.stack, this.index);
    }

    push(element: T) {
        this.stack = this.stack.slice(0, this.index + 1)
        this.stack.push(element);
        this.index++;
        return new UndoStack(this.stack, this.index);
    }

    pop() {
        this.stack.pop();
        this.index--;
        return new UndoStack(this.stack, this.index);
    }

    set(element: T) {
        this.stack[this.index] = element;
        return new UndoStack(this.stack, this.index);
    }

    peek() {
        return this.stack[this.index];
    }

    clone() {
        return new UndoStack(this.stack, this.index);
    }
}