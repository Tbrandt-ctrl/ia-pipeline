const csv = require("csvtojson");
const { Parser } = require("@json2csv/plainjs");

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

const DoTheThings = (jobs) => {
  const promises = [];

  jobs.forEach((job) => {
    const { Title, Description, Company } = job;

    console.log(`Processing job ${Title}`);

    const path = __dirname + "/textFiles";

    const fileTitle = Title.replace("/", "-");
    const full_path = `${path}/${Company} - ${fileTitle}.txt`;
    const local_path = `/textFiles/${Company} - ${fileTitle}.txt`;

    if (Title && Description) {
      const promise = new Promise((resolve, reject) => {
        fs.writeFile(full_path, Description, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const index = jobs.findIndex((job) => job.Description === Description);
      jobs[index].link = local_path;
      jobs[index].Description = "";
      console.log(`Finished job ${local_path}`);

      promises.push(promise);
    }
  });

  return promises;
};

(async () => {
  const jobs = await getCSV(__dirname + "/databases/jobs.csv");
  const promises = DoTheThings(jobs);

  await Promise.all(promises)
    .then(() => {
      console.log("All jobs processed successfully");

      try {
        const opts = {};
        const parser = new Parser(opts);
        const csv = parser.parse(jobs);

        const path = __dirname + "/databases/new_jobs2.csv";

        fs.writeFile(path, csv, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("FILE WRITTEN");
          }
        });
      } catch (err) {
        console.error(err);
      }
    })
    .catch((err) => console.error(err));
})();
