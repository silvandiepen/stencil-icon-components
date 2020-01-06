const svgtojsx = require("svg-to-jsx");
const { kebabCase, fileName } = require("./helpers.js");

const BUILD = {};

BUILD.SPEC = async (fileData) => {
	const file = `import { Icon } from './${kebabCase(fileName(fileData.name))}';

    describe('icon-${kebabCase(fileName(fileData.name))}', () => {
        it('builds', () => {
        expect(new Template()).toBeTruthy();
        });
    });
    `;
	return file;
};

BUILD.E2E = async (fileData) => {
	const file = `import { newE2EPage } from '@stencil/core/testing';

    describe('icon-${kebabCase(fileName(fileData.name))}', () => {
        it('renders', async () => {
        const page = await newE2EPage();
        await page.setContent('<icon-${kebabCase(
					fileName(fileData.name)
				)}></icon-${kebabCase(fileName(fileData.name))}>');
    
        const element = await page.find('icon-${kebabCase(
					fileName(fileData.name)
				)}');
        expect(element).toHaveClass('hydrated');
        });
    });
`;
	return file;
};

BUILD.CSS = async (fileData) => {
	const file = `:host {
    display: block;
    width: var(--icon-width,20px);
    height: var(--icon-height,20px);
}
svg{
    fill: var(--icon-color);
}
`;
	return file;
};

BUILD.TSX = async (fileData, options) => {
	return await svgtojsx(fileData.data).then(function(jsx) {
		const file = `import { Component, Host, h } from '@stencil/core';
    
@Component({
  tag: '${options.prefix}${kebabCase(fileName(fileData.name))}',
  styleUrl: '${kebabCase(fileName(fileData.name))}.css'
})

@Prop() width: string;
@Prop() height: string = this.width;
@Prop() color: string;


export class Icon {
    @Element() IconElement: HTMLElement;
    
    private SvgElement: HTMLElement;

    componentDidLoad(){
        this.SvgElement = this.IconElement.querySelector('svg');
    }
    
    render() {
    
    // Set Style Props
    if(this.width) this.IconElement.style.setProperty('icon-width', this.width);
    if(this.height) this.IconElement.style.setProperty('icon-height', this.height);
    if(this.color) this.IconElement.style.setProperty('icon-fill', this.color);

    return (
        <Host>
            ${jsx}
        </Host>);
  }
}
`;
		return file;
	});
};

module.exports = BUILD;
