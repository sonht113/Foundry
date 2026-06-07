const sharp = require("sharp");
const path = require("path");

const input = path.join(__dirname, "..", "apps", "electron", "assets", "icon-256.png");
const output = path.join(__dirname, "..", "apps", "electron", "assets", "icon.ico");

sharp(input)
  .resize(256, 256)
  .toFile(output)
  .then(() => console.log("icon.ico generated at:", output))
  .catch((err) => console.error("Failed:", err));
