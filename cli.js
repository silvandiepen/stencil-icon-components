#!/usr/bin/env node
const argv = require("yargs").argv;
const path = require("path");
const mkdirp = require('mkdirp');
const fsp = require("fs").promises;
const { red, white, yellow, bgWhite, black, blue, green, bold, italic } = require('kleur');

let settings = {
	src: path.join(__dirname, argv.src),
    dest: path.join(__dirname, argv.dest),
    filelist: [],
    files: [],
    error: null
};




function fileName(filename) {
    return path.basename(filename).replace(path.extname(filename),'');
}
function fileExtension(filename) {
    return path.extname(fileName);
}
function kebabCase(value){
    return value.replace(/\s+/g, '-').toLowerCase();
}

const getSrcFiles = async function(log){
	try {
        // Get the files
        await getFileList();
        await getFilesData();   
       
	} catch (err) {
		console.log(err);
	}
	return log;
}

const getFileList = async function(){
    // Genereate a list of svg files from the source folder.
    let files = await fsp.readdir(settings.src);
  
    files.forEach((fileName) => {
        if (path.extname(fileName) == ".svg") {
            try {
                settings.filelist.push(fileName);
            } catch(err){
                console.log(err)
            }
        }
    });
}
const getFilesData = async function(){
        // Go through each file and write it to the settings.
        let files = [];
       
        await settings.filelist.forEach((fileName,i) => {
            try {
              getFileData(fileName).then(fileData=>{
                let file = { name: fileName, data: fileData};
                settings.files.push(file);           
               });
             } catch(err){
               console.log(err);
            }
        })

}
const getFileData = async function(fileName){
    try {
        // let fileData = 'hoi';
        return fsp.readFile(path.join(settings.src,fileName)).then(file=>{
            return file.toString();
        });
    } catch(err) {
        console.log(err);
    }
}


getSrcFiles(settings).then((result) => {
	setTimeout(()=>{
        logResult();
    },1000)
});

function buildFiles(){

}
function buildSpec(fileData){
const file = `import { Icon } from './${kebabCase(fileName(fileData.name))}';

describe('icon-${kebabCase(fileName(fileData.name))}', () => {
  it('builds', () => {
    expect(new Template()).toBeTruthy();
  });
});
`;
return file;

}
function buildE2E(fileData){
    const file = `import { newE2EPage } from '@stencil/core/testing';

    describe('icon-${kebabCase(fileName(fileData.name))}', () => {
      it('renders', async () => {
        const page = await newE2EPage();
        await page.setContent('<icon-${kebabCase(fileName(fileData.name))}></icon-${kebabCase(fileName(fileData.name))}>');
    
        const element = await page.find('icon-${kebabCase(fileName(fileData.name))}');
        expect(element).toHaveClass('hydrated');
      });
    });
`;
return file;    
}
function buildCss(fileData){
    const file = `:host {
    display: block;
    width: 20px;
    height: 20px;
}
`;
    return file;    
}
function buildTsx(fileData){
    const file = `import { Component, Host, h } from '@stencil/core';
@Component({
  tag: 'icon-${kebabCase(fileName(fileData.name))}',
  styleUrl: 'icon.css'
})
export class Icon {
  render() {
    return (${fileData.data});
  }
}
`;
    return file;
}
const writeComponent = async function(file){
    try {        
        console.log(`\t${green('✔')} ${file.name}`);
   
        // TSX
        fsp.writeFile(path.join(settings.dest, fileName(file.name), fileName(file.name) + '.tsx'), buildTsx(file));
        // CSS
        fsp.writeFile(path.join(settings.dest, fileName(file.name), fileName(file.name) + '.css'), buildCss(file));
        // E2E
        fsp.writeFile(path.join(settings.dest, fileName(file.name), fileName(file.name) + '.e2e.ts'), buildE2E(file));
        // Spec
        fsp.writeFile(path.join(settings.dest, fileName(file.name), fileName(file.name) + '.spec.ts'), buildSpec(file));

    } catch(err){
        console.log(`\t${red('×')} ${file.name} ${err}`);
    }
}


function logResult() {
    // Log it all\
    
	console.log("\n");
	console.log(`\t${bold('Generating')} ${bgWhite().black(' Stencil ')} ${bold('web components from svg files.')}`);
	console.log("\n");

	if (settings.src && settings.dest) {

		if (settings.files && settings.files.length > 0) console.log(`\tsrc:\t ${green().italic(argv.src)} `);
		else console.log(`\tsrc:\t ${yellow().italic(argv.src)} ${red('Your source folder doesn\'t contain any') + red().bold(' .svg ') + red('files.')}`);
		
		console.log(`\tdest:\t ${green().italic(argv.dest)}`);
		console.log(`\n`);
        
		if (settings.files && settings.files.length > 0){
            console.log(`\t${bold('Files')} ${blue().bold('('+settings.files.length+')')}`);
        	settings.files.forEach((file,i) => {
                mkdirp(path.join(settings.dest, fileName(file.name)), function(err) { 
                    writeComponent(file); 
                    
                    if(settings.files.length == i+1) setTimeout(()=>{ console.log(`\n`)},10);
                    
                });
                
			});
        } 
	} else {
		console.log(`\tdefine --src and --dest`);
		process.exit(1);
	}
}