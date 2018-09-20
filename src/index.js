import colors from 'colors';
import fs from 'fs';
import semver from 'semver';
import path from 'path';

import OuiSncf from './oui-sncf-parser/OuiSncf';

// ensure node version
if (!semver.satisfies(process.versions.node, '=8.9.3')) {
    console.log(`Incorrect Node version (detected: ${process.versions.node})`.red);
    console.log('Please install nvm and do "nvm install 8.9.3" then "nvm use 8.9.3"'.red);
    process.exit();
}

// expect relative path to file.html as argument
if (process.argv.length <= 2) {
  console.error(`Usage: ${__filename} relative_path_to_html_file`.red);
  console.error(`Exemple: npm start ./src/test.html\n`.green);
  process.exit(-1);
}

const dist = './dist';
const filepath = path.resolve(process.cwd(), process.argv[2]);

const ouiSncf = new OuiSncf(filepath, true);
const ouiSncfResult = ouiSncf.getResult();

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist);
}

fs.writeFileSync('./dist/computed-test-result.json', JSON.stringify({
  status: 'ok',
  result: ouiSncfResult,
}, null, 2));

console.info(`json file has been created : ${path.resolve(process.cwd(), './dist/computed-test-result.json')}`.green);
