const csv = require("csvtojson");
const fs = require("fs");

const getCSV = async (path) => {
  return new Promise((resolve, reject) => {
    csv()
      .fromFile(path)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const getDescription = async (path) => {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(path)) {
        fs.readFile(path, (err, text) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(text.toString());
          }
        });
      } else {
        console.log("filepath error");
        resolve("");
      }
    } catch (err) {
      reject(err);
    }
  });
};

const getDescriptions = async (path) => {
  try {
    const desc_path = path;
    const files = await fs.promises.readdir(desc_path);
    const descriptions = [];

    for (let i = 1; i < files.length; i++) {
      console.log(`Getting description for ${files[i]}`);

      const file_path = desc_path + "/" + files[i];
      const description = await getDescription(file_path);

      const startIndex = files[i].indexOf("CLEAN_") + 6;
      const endIndex = files[i].indexOf(".txt");
      const cleanedFilename = files[i].substring(startIndex, endIndex);

      const title = cleanedFilename;
      console.log(title);

      descriptions.push({ title, description });
    }

    return { descriptions };
  } catch (err) {
    throw err;
  }
};

module.exports = { getCSV, getDescription, getDescriptions };
