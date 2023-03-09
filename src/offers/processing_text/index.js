const {
  getCSV,
  getDescription,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/helpers/index.js");

const LanguageDetect = require("languagedetect");
const lngDetector = new LanguageDetect();

const fs = require("fs");

const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

//MAIN

(async () => {
  // Récupération de la liste dans le CSV
  const jobs = await getCSV(
    "/Users/Thomas/Desktop/Montréal/Cours/H2023/Réalisation d'applicaitons d'intelligence artificielle/Travail d'équipe/Données/src/databases/final_jobs.csv"
  );

  //LOOP DANS TOUS LES JOBS
  const structured_jobs = await loopJobs(jobs.slice(66, jobs.length));
  //const structured_jobs = await oneJob(jobs);

  //Une fois que les promises de jobs sont terminées
  console.log("DONE PREPROCESSING");
  console.log(structured_jobs);

  /*  for (structured_job of structured_jobs) {
    writeTEXT(structured_job);
  } */
})();

const writeTEXT = (structured_job) => {
  console.log("STARTING TO WRITE FILE");

  const path =
    "/Users/Thomas/Desktop/Montréal/Cours/H2023/Réalisation d'applicaitons d'intelligence artificielle/Travail d'équipe/Données/src" +
    "/textFiles/preprocessed";

  const full_path = `${path}/${structured_job.FileTitle}.txt`;

  if (structured_job) {
    new Promise((resolve, reject) => {
      fs.writeFile(full_path, structured_job.desc, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log("FILE WRITTEN");
          resolve();
        }
      });
    });
  }
};

const loopJobs = async (jobs) => {
  let structured_jobs = [];

  for (const job of jobs) {
    //Récupération des informations de la job
    const { Title, link, Company } = job;

    const FileTitle = Company + " - " + Title;

    console.log(`Processing job ${Title}`);

    //Récupération de la description grâce au lien dans le fichier csv
    const path =
      "/Users/Thomas/Desktop/Montréal/Cours/H2023/Réalisation d'applicaitons d'intelligence artificielle/Travail d'équipe/Données/src" +
      link;

    const description = await getDescription(path);

    //Si une description a été trouvée
    if (description) {
      console.log("GOTTEN THE DESCRIPTION");
      const structured_description = await getProcessedText(description);
      if (structured_description) {
        console.log("GOTTEN THE STRUCTURED DESCRIPTION");
        const structured_job = { FileTitle, desc: structured_description };

        console.log("WRITTING TEXT");
        writeTEXT(structured_job);

        structured_jobs.push(structured_job);
      }
    } else {
      console.log("pas de description on continue au prochain");
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 60000));
    console.log("finished timeout");
  }

  return structured_jobs;
};

const oneJob = async (jobs) => {
  const job = jobs[0];
  let structured_jobs = [];
  //Récupération des informations de la job
  const { Title, link, Company } = job;

  const FileTitle = Company + " - " + Title;

  console.log(`Processing job ${Title}`);

  //Récupération de la description grâce au lien dans le fichier csv
  const path =
    "/Users/Thomas/Desktop/Montréal/Cours/H2023/Réalisation d'applicaitons d'intelligence artificielle/Travail d'équipe/Données/src" +
    link;

  const description = await getDescription(path);

  //Si une description a été trouvée
  if (description) {
    console.log("GOTTEN THE DESCRIPTION");
    const structured_description = await getProcessedText(description);
    if (structured_description) {
      console.log("GOTTEN THE STRUCTURED DESCRIPTION");
      console.log(structured_description);

      const structured_job = { FileTitle, desc: structured_description };

      console.log("WRITTING TEXT");
      writeTEXT(structured_job);

      structured_jobs.push(structured_job);
    }
  }
  return structured_jobs;
};

//OPEN AI

const getProcessedText = async (description) => {
  console.log("GETTING THE PROCESSED TEXT");

  return new Promise(async (resolve, reject) => {
    console.log("STARTING API CALL");
    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Voici un poste d'emploi, si le texte est en anglais traduit le en français (si une partie du texte est déjà en français, efface la partie anglaise). Si le texte était déjà en français corrige seulement les erreurs d'encodage et enlève les parties en anglais. + ${description}`,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      if (
        response &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        const cleaned_description = response.data.choices[0].text.trim();

        console.log("GOTTEN PROCESSED TEXT");
        resolve(cleaned_description);
      } else {
        console.error("No sentiment analysis response received");
      }
    } catch (err) {
      reject(err);
    }
  });
};

//Rendre un nouveau fichier avec les données cleans et un lien vers les fichiers texte
