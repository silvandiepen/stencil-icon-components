#!/usr/bin/env node
const argv = require("yargs").argv;
const path = require("path");
const fsp = require("fs").promises;
const { red, white, yellow, bgWhite, black, blue, green, bold, italic } = require('kleur');

let settings = {
	src: path.join(__dirname, argv.src),
    dest: path.join(__dirname, argv.dest),
    filelist: [],
    files: [],
	error: null
};

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
function buildSpec(){
const file = `import { Icon } from './${fileName}';

describe('icon-${fileName}', () => {
  it('builds', () => {
    expect(new Template()).toBeTruthy();
  });
});
`;
return file;

}
function builde2e(){
    const file = `
    import { newE2EPage } from '@stencil/core/testing';

    describe('icon-${fileName}', () => {
      it('renders', async () => {
        const page = await newE2EPage();
        await page.setContent('<icon-${fileName}></icon-${fileName}>');
    
        const element = await page.find('icon-${fileName}');
        expect(element).toHaveClass('hydrated');
      });
    });
`;
return file;    
}
function buildCss(){
    const file = `
        :host {
            display: block;
            width: 20px;
            height: 20px;
        }
`;
    return file;    
}
function buildTsx(){
    const file = `
import { Component, Host, h } from '@stencil/core';
@Component({
  tag: 'icon-${fileName}',
  styleUrl: 'icon.css'
})
export class Icon {
  render() {
    return (${fileData});
  }
}
`;
    return file;
}

const writeComponent = async function(file){
    try {
        fsp.writeFile(path.join(settings.dest, file.name), file.data);
        console.log(`\t${green('✔')} ${file.name}`);
    } catch(err){
        console.log(`\t${red('×')} ${file.name} ${err}`);
    }
}
const createFolder =  async function(){
    try{
        fsp.mkdir(settings.dest);
        console.log(settings.dest, 'is created');
    } catch(err) {
        console.log('folder exists', err);
    }    
}

function logResult() {
    // Log it all\
    
	console.log("\n");
	console.log(`\t${bold('Generating')} ${bgWhite().black(' Stencil ')} ${bold('web components from svg files.')}`);
	console.log("\n");

	if (settings.src && settings.dest) {
		if (settings.files && settings.files.length > 0) {
			console.log(`\tsrc:\t ${green().italic(argv.src)} `);
		} else {
			console.log(`\tsrc:\t ${yellow().italic(argv.src)} ${red('Your source folder doesn\'t contain any') + red().bold(' .svg ') + red('files.')}`);
		}
		console.log(`\tdest:\t ${green().italic(argv.dest)}`);

		console.log(`\n`);
        
		if (settings.files && settings.files.length > 0){
            console.log(`\t${bold('Files')} ${blue().bold('('+settings.files.length+')')}`);


        	settings.files.forEach((file) => {
				console.log(`\t${green('✔')} ${file.name}`);
                // console.log(`\t${file.data}`);

                // Create the folder if it doesn't exist yet.
                // if (fsp.existsSync(settings.dest)) {
                //     writeComponent(file);
                // } else {
                    createFolder()
                    writeComponent(file);
                // }


			});
		} 
		console.log(`\n`);
	} else {
		console.log(`\tdefine --src and --dest`);
		process.exit(1);
	}
}
