const serializedStackMaxLength = 10;

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
	
	get current() {
		return this.stack[this.index];
	}

	canUndo() {
		return this.stack.length > 0 && this.index > 0;
	}

	canRedo() {
		return this.index < this.stack.length - 1;
	}
	
	undo(): UndoStack<T> {
		if (!this.canUndo()) return this;
		this.index--;
		return this.clone();
	}

	redo(): UndoStack<T> {
		if (!this.canRedo()) return this;
		this.index++;
		return this.clone();
	}

	push(element: T): UndoStack<T> {
		this.stack = this.stack.slice(0, this.index + 1)
		this.stack.push(element);
		this.index++;
		return this.clone();
	}

	pop(): UndoStack<T> {
		this.stack.pop();
		this.index--;
		return this.clone();
	}

	set(element: T): UndoStack<T> {
		this.stack[this.index] = element;
		this.stack = this.stack.filter((_, idx) => idx <= this.index);
		return this.clone();
	}

	clone(): UndoStack<T> {
		return new UndoStack(this.stack, this.index);
	}

	serialize() {
		this.stack = this.stack.slice(-serializedStackMaxLength);
		this.index = Math.min(this.index, serializedStackMaxLength - 1)
		return this;
	}
}