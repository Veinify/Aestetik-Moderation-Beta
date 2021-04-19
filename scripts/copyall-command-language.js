const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
var source = './languages/en-US/economy/profile.json';
var target = '/economy/';

let languages;
(async () => {
	languages = (await walkDirectory('./languages')).languages;
	for (const l of languages) {
		copyFileSync(source, `./languages/${l}${target}`);
		console.log(`Copied file to ${l}`);
	}
	console.log('done')
})();
function copyFileSync(source, target) {
	var targetFile = target;

	// If target is a directory, a new file with the same name will be created
	if (fs.existsSync(target)) {
		if (fs.lstatSync(target).isDirectory()) {
			targetFile = path.join(target, path.basename(source));
		}
	}

	fs.writeFileSync(targetFile, fs.readFileSync(source));
}
async function walkDirectory(dir, namespaces = [], folderName = '') {
	const files = await fsp.readdir(dir);

	const languages = [];
	for (const file of files) {
		const stat = await fsp.stat(path.join(dir, file));
		if (stat.isDirectory()) {
			const isLanguage = file.includes('-');
			if (isLanguage) languages.push(file);

			const folder = await walkDirectory(
				path.join(dir, file),
				namespaces,
				isLanguage ? '' : `${file}/`
			);

			namespaces = folder.namespaces;
		} else {
			namespaces.push(`${folderName}${file.substr(0, file.length - 5)}`);
		}
	}

	return { namespaces: [...new Set(namespaces)], languages };
}
