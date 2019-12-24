#!/usr/bin/env node
const argv = require("yargs").argv;
const path = require("path");
const mkdirp = require('mkdirp');
const rimraf = require("rimraf");
const fsp = require("fs").promises;
const svgtojsx = require('svg-to-jsx');
const { red, yellow, bgWhite, blue, green, bold } = require('kleur');

let settings = {
	src: path.join(argv.src),
    dest: path.join(argv.dest),
    filelist: [],
    files: [],
    error: null,
    options: {
        removeOld: argv.removeOld ? true : false,
        prefix: argv.prefix ? `${argv.prefix}-` : '' 
    }
};

const fileName = (str) => `${settings.options.prefix}${path.basename(str).replace(path.extname(str),'')}`;
const fileExtension = (str) => path.extname(str);
const kebabCase = (str) =>str.match(/[A-Z]{2,}(?=[A-Z][a-z0-9]*|\b)|[A-Z]?[a-z0-9]*|[A-Z]|[0-9]+/g)
.filter(Boolean)
.map(x => x.toLowerCase())
.join('-') 


// If remove old is set, the destination folder will be removed in order to be sure all files are new. 
if(settings.options.removeOld){
    rimraf(settings.dest, () => { console.log("Removed destination folder"); });
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
       
        settings.filelist.forEach((srcFileName,i) => {
            try {
              getFileData(srcFileName).then(fileData=>{
                let file = { name: kebabCase(fileName(srcFileName)), data: fileData};
                settings.files.push(file);           
               });
             } catch(err){
               console.log(err);
            }
        })

}
const getFileData = async function(srcFileName){
    try {
        // let fileData = 'hoi';
        return fsp.readFile(path.join(settings.src,srcFileName)).then(file=>{
            return file.toString();
        });
    } catch(err) {
        console.log(err);
    }
}


getSrcFiles(settings).then((result) => setTimeout(()=>logResult(),1000));

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
    svgtojsx(fileData.data).then(function(jsx) {
        const file = `import { Component, Host, h } from '@stencil/core';
    
@Component({
  tag: 'icon-${kebabCase(fileName(fileData.name))}',
  styleUrl: '${kebabCase(fileName(fileData.name))}.css'
})
export class Icon {
  render() {
    return (${jsx});
  }
}
`;
    return file;   
    });

}
const writeComponent = async function(file){
    try {        
        console.log(`\t${green('✔')} ${file.name}`);
   
        // TSX
        fsp.writeFile(path.join(settings.dest, fileName(file.name), kebabCase(fileName(file.name)) + '.tsx'), buildTsx(file));
        // CSS
        fsp.writeFile(path.join(settings.dest, fileName(file.name), kebabCase(fileName(file.name)) + '.css'), buildCss(file));
        // E2E
        fsp.writeFile(path.join(settings.dest, fileName(file.name), kebabCase(fileName(file.name)) + '.e2e.ts'), buildE2E(file));
        // Spec
        fsp.writeFile(path.join(settings.dest, fileName(file.name), kebabCase(fileName(file.name)) + '.spec.ts'), buildSpec(file));

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
