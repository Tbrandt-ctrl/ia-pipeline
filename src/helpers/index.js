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

module.exports = { getCSV, getDescription };
