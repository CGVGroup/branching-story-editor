import Story from "./Story.ts"
import Instance from "./Instance.ts";

class Template {
	template: Story;
	instances: Instance[];

    constructor(template?: Story, instances: Instance[] = []) {
        this.template = template ?? new Story();
        this.instances = instances;
    }

    public clone() {
        return new Template(this.template, this.instances);
    }

    public cloneAndInstantiate() {
        this.instances.push(new Instance(`Istanza ${this.instances.length + 1}`, this.template));
        return this.clone();
    }
}

export default Template;
export {Instance};