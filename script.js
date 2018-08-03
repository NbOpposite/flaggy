const PREVIEW_SIZE = [500, 300];

class Line extends EventEmitter {
    constructor (parent, weight, color) {
        super();
        const createEl = document.createElement.bind(document);
        weight = weight === null || weight === undefined ? 1 : Number(weight);
        weight = this.weight = isFinite(weight) && weight >= 0 ? weight : 1;
        color = this.color = color ? color : "#"+((1<<24)*Math.random()|0).toString(16).padStart(6, '0');

        const root = this.root = createEl('tr');
        const colorInput = this.colorInput = root.appendChild(createEl('td')).appendChild(createEl('input'));
        const weightInput = this.weightInput = root.appendChild(createEl('td')).appendChild(createEl('input'));
        const removeButton = this.removeButton = root.appendChild(createEl('td')).appendChild(createEl('span'));
        removeButton.innerHTML = "&#x274C";
        removeButton.style = "user-select: none; cursor: pointer";
        removeButton.addEventListener('click', () => this.destroy());

        colorInput.type = 'color';
        colorInput.value = color;
        colorInput.addEventListener('change', e=>{this.color = e.target.value; this.emit('change')});

        weightInput.type = 'number';
        weightInput.value = weight;
        weightInput.min = 0;
        weightInput.addEventListener('change', e=>{this.weight = Number(e.target.value); this.emit('change')});
        parent.appendChild(root);
    }

    destroy() {
        this.emit('destroy', this);
        this.removeAllListeners();
        this.root.parentNode.removeChild(this.root);
    }
}

class FlagGenerator {
    constructor(parent) {
        const lines = this.lines = [];
        const vertical = this.vertical = false;
        const root = this.root = document.createElement('div');
        const container = this.container = document.createElement('div');
        container.style = `width: ${PREVIEW_SIZE[0]}px; height: ${PREVIEW_SIZE[1]}px; overflow: hidden;`;

        const canvas = this.canvas = container.appendChild(document.createElement('canvas'));
        canvas.width  = PREVIEW_SIZE[0];
        canvas.height = PREVIEW_SIZE[1];

        const linesElement = this.linesElement = document.createElement('table');
        linesElement.appendChild(document.createElement('caption')).innerHTML = 'Lines'
        const header = linesElement.appendChild(document.createElement('tr'));
        header.appendChild(document.createElement('th')).innerHTML = 'Color';
        header.appendChild(document.createElement('th')).innerHTML = 'Width';
        const addButton = header.appendChild(document.createElement('th'));
        addButton.innerHTML = '&#x2795;';
        addButton.style = "user-select: none; cursor: pointer";
        addButton.addEventListener('click', () => {this.createLine(); this.redraw()});

        const settingsContainer = this.settingsContainer = document.createElement('div');

        const verticalLabel = settingsContainer.appendChild(document.createElement('label'));

        const verticalCheckbox = verticalLabel.appendChild(document.createElement('input'));
        verticalLabel.appendChild(document.createTextNode('Vertical Stripes'));
        verticalCheckbox.type = 'checkbox';
        verticalCheckbox.checked = vertical;
        verticalCheckbox.id = 'verticalStripes';
        verticalCheckbox.addEventListener('change', e => {this.vertical = e.target.checked; this.redraw()});

        const widthInput = this.widthInput = settingsContainer.appendChild(document.createElement('input'));
        widthInput.type = 'number';
        widthInput.value = canvas.width;
        widthInput.addEventListener('change', e => {this.canvas.width = Number(e.target.value); this.updateSize()});
        const heightInput = this.heightInput = settingsContainer.appendChild(document.createElement('input'));
        heightInput.type = 'number';
        heightInput.value = canvas.height;
        heightInput.addEventListener('change', e => {this.canvas.height = Number(e.target.value); this.updateSize()});
        const saveButton = this.saveButton = settingsContainer.appendChild(document.createElement('span'));
        saveButton.innerHTML = '&#x1f4be;';
        saveButton.style = "user-select: none; cursor: pointer";
        saveButton.addEventListener('click', () => this.save());
        this.ctx = this.canvas.getContext('2d');

        this.createLine();
        this.createLine();

        this.updateSize();
        root.appendChild(container);
        root.appendChild(settingsContainer);
        root.appendChild(linesElement);
        parent.appendChild(root);
    }

    createLine(weight, color) {
        const line = new Line(this.linesElement, weight, color);
        line.once('destroy', line => {
            const index = this.lines.findIndex(el=> el === line);
            this.lines.splice(index, 1);
            this.redraw();
        });
        line.on('change', ()=>this.redraw());
        this.lines.push(line);
    }

    drawHorizontalLines() {
        const totWeight = this.lines.reduce((acc, line) => acc + line.weight, 0);
        const lines = this.lines.map(line => ({color: line.color, weight: line.weight/totWeight}));
        const { width, height } = this.canvas;
        let accWeight = 0;
        for(const line of lines) {
            this.ctx.fillStyle = line.color;
            this.ctx.fillRect(0, accWeight*height, width, line.weight * height);
            accWeight += line.weight;
        }
    }
    
    drawVerticalLines() {
        const totWeight = this.lines.reduce((acc, line) => acc + line.weight, 0);
        const lines = this.lines.map(line => ({color: line.color, weight: line.weight/totWeight}));
        const { width, height } = this.canvas;
        let accWeight = 0;
        for(const line of lines) {
            this.ctx.fillStyle = line.color;
            this.ctx.fillRect(accWeight*width, 0, line.weight*width, height);
            accWeight += line.weight;
        }
    }
    
    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if(this.vertical) {
            this.drawVerticalLines();
        } else {
            this.drawHorizontalLines();
        }
    }

    updateSize() {
        const scaleX = PREVIEW_SIZE[0] / this.canvas.width;
        const scaleY = PREVIEW_SIZE[1] / this.canvas.height;
        const scale = Math.min(scaleX, scaleY);
        this.canvas.style = `transform: scale(${scale}) translate(${-50/scale+50}%,${-50/scale+50}%);`;
        this.redraw();
    }

    save() {
        const download = document.createElement('a');
        const image = this.canvas.toDataURL("image/png");
        download.setAttribute("href", image);
        download.setAttribute("download", "flag.png");
        download.click();
    }
}

function init() {
    window.generator = new FlagGenerator(document.body);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}