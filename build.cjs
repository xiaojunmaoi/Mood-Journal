const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'dist');
const files = ['index.html', 'styles.css', 'care.css', 'journal.js', 'app.js', 'care.js', 'nature-audio.js', 'assets/sound-rain.png', 'assets/sound-ocean.png', 'assets/sound-forest.png', 'assets/sound-stream.png', 'assets/paper.png', 'assets/mood-faces.png', 'assets/daisies-transparent.png', 'assets/walking-transparent.png', 'assets/journals.png'];
for (const file of files) {
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(__dirname, file), destination);
}
const iconOutput = path.join(output, 'assets/icons');
fs.mkdirSync(iconOutput, { recursive: true });
for (const name of fs.readdirSync(path.join(__dirname, 'assets/icons'))) {
  fs.copyFileSync(path.join(__dirname, 'assets/icons', name), path.join(iconOutput, name));
}
const audioOutput = path.join(output, 'assets/audio');
fs.mkdirSync(audioOutput, { recursive: true });
for (const name of fs.readdirSync(path.join(__dirname, 'assets/audio'))) {
  fs.copyFileSync(path.join(__dirname, 'assets/audio', name), path.join(audioOutput, name));
}
console.log('Static HTML prototype built in dist/');
