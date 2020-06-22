import path from 'path';
import fs from 'fs';
import {pack, build} from './generator';
import {loadProject} from './reader';
export {watch} from './ts';
export {LayerVfs, RealFs} from './vfs';

export {loadProject, pack, build};
// const project = loadProject(path.resolve('./src/index.js'));
// // const project = loadProject(path.resolve('./pg2/app.js'), cfg);
// const bundle = pack(project);
// fs.writeFileSync('./bundle.js', bundle, 'utf-8');