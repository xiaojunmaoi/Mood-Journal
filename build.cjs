const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'dist');
const files = ['index.html', 'styles.css', 'trend.css', 'trend.js', 'care.css', 'journal.js', 'app.js', 'care.js', 'nature-audio.js', 'album.js', 'album.css', 'journal-store.js', 'drinks.js', 'drinks.css', 'drink-store.js', 'photo-codec.js', 'photo-tools.js', 'photo-worker.js', 'assets/drink-lime.webp', 'assets/drink-orange.webp', 'assets/drink-tea.webp', 'assets/shop-osmanthus.webp', 'assets/sound-rain.webp', 'assets/sound-ocean.webp', 'assets/sound-forest.webp', 'assets/sound-stream.webp', 'assets/paper.png', 'assets/mood-faces.png', 'assets/daisies-transparent.png', 'assets/walking-transparent.png', 'assets/journals.png', 'assets/journal-entry.png', 'assets/journal-demo-lake.webp', 'assets/journal-demo-cafe.webp', 'assets/journal-demo-sunset.webp'];
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

fs.copyFileSync(path.join(__dirname, 'node_modules/@capacitor/core/dist/capacitor.js'), path.join(output, 'assets/capacitor-core.js'));
