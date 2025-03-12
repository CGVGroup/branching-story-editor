import Story from "./Story.ts";

class Instance {
    title: string;
    template: Story;
    instance: Story;
    
    constructor(title: string, template: Story) {
        this.title = title;
        this.template = template;
        this.instance = template.instantiate();
    }
}

export default Instance;