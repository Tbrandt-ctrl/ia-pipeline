const {
  getCSV,
  getDescription,
} = require("/Users/Thomas/Desktop/Montréal/Cours/H2023/Réalisation d'applicaitons d'intelligence artificielle/Travail d'équipe/Données/src/helpers/index.js");

const fs = require("fs");
const { Parser } = require("@json2csv/plainjs");
var json2csv = require("json2csv");
const dJSON = require("dirty-json");

const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

const getDescriptions = async (path) => {
  try {
    const desc_path = path + "/textFiles/preprocessed";
    const files = await fs.promises.readdir(desc_path);
    const descriptions = [];

    for (let i = 1; i < files.length; i++) {
      console.log(`Getting description for ${files[i]}`);

      const file_path = desc_path + "/" + files[i];
      const description = await getDescription(file_path);

      descriptions.push(description);
    }

    return descriptions;
  } catch (err) {
    throw err;
  }
};

(async () => {
  const path =
    "/Users/Thomas/Desktop/Montréal/Cours/H2023/Réalisation d'applicaitons d'intelligence artificielle/Travail d'équipe/Données/src";

  //Récupérer les jobs du fichier CSV
  /* const jobs = await getCSV(
    "/Users/Thomas/Desktop/Montréal/Cours/H2023/Réalisation d'applicaitons d'intelligence artificielle/Travail d'équipe/Données/src/databases/final_jobs.csv"
  ); */

  //Récupérer les descriptions pour chaque job
  const descriptions = await getDescriptions(path);

  //Structurer les descriptions de chaque job et rendre les descriptions structurées
  let issues = [];

  const structured_descriptions = await loopDescriptions(
    descriptions.slice(22, 40),
    path,
    issues
  );

  console.log(issues);

  //Créer le fichier CSV avec tous les descriptions structuréees

  //createCSV(structured_descriptions, path);
})();

const loopDescriptions = async (descriptions, path, issues) => {
  let structured_descriptions = [];

  for (let i = 0; i <= descriptions.length; i++) {
    const description = descriptions[i];

    console.log(description);
    const structured_description = await getStructuredDescription(
      description,
      i,
      issues
    );

    console.log(`finished working on ${structured_description.JobTitle} `);
    structured_descriptions.push(structured_description);

    //appendToCSV(structured_description, path);
    updateJSON(structured_description, path);

    await new Promise((resolve) => setTimeout(resolve, 60000));
    console.log("finished timeout");
  }

  return structured_descriptions;
};

const updateJSON = (structured_description, path) => {
  console.log("UPDATING JSON");

  console.log("STRUCTURED DESCRIPTION TO BE ADDED TO JSON");
  console.log(structured_description);

  const file_path = path + "/databases/structured_descriptions_t2.json";

  fs.readFile(file_path, function (err, data) {
    const json = JSON.parse(data);

    json.push(structured_description);

    const stringified_JSON = JSON.stringify(json);
    fs.writeFile(file_path, stringified_JSON, () => {});
  });
};

const getStructuredDescription = async (description, i, issues) => {
  console.log("GETTING STRUCTURED TEXT");

  return new Promise(async (resolve, reject) => {
    console.log("STARTING API CALL");

    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      const prompt = `
      Je vais te donner un poste d’emploi pour une job en TI, en te basant sur le modèle JSON suivant, remplis ce modèle avec ce que tu arrives à déchiffrer du texte, si tu ne trouves pas l’information mets “NA” dans la variable : 


{
    "JobTitle": "",
    "CompanyName": "",
    "JobLocation": "",
    "JobType": "",
    "ProgrammingType":"",
    "YearlySalary": "",
    "HourlySalary": "",
		"WorkFromHome": "",
    "ApplicationLimitDate": "",
    "JobIndustry": "",
    "RequiredHardSkills": "",
    "PreferredHardSkills": "",
    "RequiredSoftSkills": "",
    "PreferredSoftSkills": "",
    "NeededExperience": "",
    "LegalRequirements": "",
    "Tasks": "",
    "StudyRequirements": "",
    "StudyPreferences": "",
    "LegalPreferences": ""
  }


Voici plus de détail sur certaines variables individuelles: 

JobLocation: mets la ville du poste ici, si il n’y en a pas mets “NA”

CompanyName: Le nom de l'entreprise qui offre le poste

JobType: Une de ces options: temps plein, temps partiel, contrat

ProgrammingType: Une de ces options: web, logiciel, mobile, donnees, geomatique, jeux-videos, general

JobIndustry: Pas l'industrie de l'emploi mais celui dans lequel l'emploi sera effectué

YearlySalary: en chiffres et sans signe $, si il s'agit de d'une intervalle utilise le format : chiffre1-chiffre2

HourlySalary: en chiffres et sans signe $, si il s'agit de d'une intervalle utilise le format : chiffre1-chiffre2

WorkFromHome: Une de ces options: oui, non, hybride

ApplicationLimitDate : datae limite pour postuler en format canadien

RequiredHardSkills :liste ici les compétences que le candidat doit avoir tel que des connaissances de certaines langues de programmation, etc.

PreferredHardSkills: liste ici les compétences que le candidat pourrait avoir tel que des connaissances de certaines langues de programmation, etc. 

RequiredSoftSkills : liste ici les soft skills que le candidat sera obligé d'avoir tel que communication, travail d'équipe, etc. (si la communication et le travail d'équipe ne sont pas listés, ce n'est pas nécessaire de les inclure)

PreferredSoftSkills : liste ici les soft skills que le candidat n'est pas obligé d'avoir mais qui seraient intéressants

NeededExperience: Ici mets le nombre d’années d’expérience que requiert l’entreprise pour le poste, si il n’y en a pas mets “NA” et uniquement le chiffre, rien d'autre

LegalRequirements : Mets ici si il faut que le candidat réponde à des requêtes légales tels que le droit de travailler au Canada par exemple (si ce n'est pas indiqué dans l'offre, "NA" suffit)

Tasks : liste des tâches à réaliser en tant qu’employé à ce poste

StudyRequirements : Années d’études nécessaires ou niveau d’étude

Voici la description du poste : ${description}
      `;

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      if (
        response &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        const response_text = response.data.choices[0].text.trim();

        console.log("RESPONSE FROM API : ");
        console.log(response_text);

        let structured_description = {
          JobTitle: "",
          CompanyName: "",
          JobLocation: "",
          JobType: "",
          ProgrammingType: "",
          YearlySalary: "",
          HourlySalary: "",
          WorkFromHome: "",
          ApplicationLimitDate: "",
          JobIndustry: "",
          RequiredHardSkills: "",
          PreferredHardSkills: "",
          RequiredSoftSkills: "",
          PreferredSoftSkills: "",
          NeededExperience: "",
          LegalRequirements: "",
          Tasks: "",
          StudyRequirements: "",
          StudyPreferences: "",
          LegalPreferences: "",
        };

        try {
          const cleaned_response = dJSON.parse(response_text);

          structured_description = cleaned_response;
        } catch (err) {
          console.log("SOMETHING WENT WRONG WITH THE PARSING");
          console.error(err);
          issues.push(i);
        }

        console.log("STRUCTURED DESCRIPTION : ");
        console.log(structured_description);

        console.log("GOTTEN STRUCTURED TEXT");
        resolve(structured_description);
      } else {
        console.error("No sentiment analysis response received");
        issues.push(i);
      }
    } catch (err) {
      issues.push(i);
      reject(err);
    }
  });
};

const appendToCSV = (structured_description, path) => {
  let fields = [
    "JobTitle",
    "CompanyName",
    "JobLocation",
    "JobType",
    "ProgrammingType",
    "YearlySalary",
    "HourlySalary",
    "WorkFromHome",
    "ApplicationLimitDate",
    "JobIndustry",
    "RequiredHardSkills",
    "PreferredHardSkills",
    "RequiredSoftSkills",
    "PreferredSoftSkills",
    "NeededExperience",
    "LegalRequirements",
    "Tasks",
    "StudyRequirements",
    "StudyPreferences",
    "LegalPreferences",
  ];

  const toCSV = {
    data: structured_description,
    fields,
    header: false,
  };

  const file_path = path + "/databases/structured_descriptions.csv";
  const newLine = "\r\n";

  fs.stat(file_path, (err, stat) => {
    if (err == null) {
      console.log("File exists");

      //write the actual data and end with newline
      try {
        const opts = { fields, header: false };
        const parser = new Parser(opts);

        const csv = parser.parse(structured_description) + newLine;

        fs.appendFile(file_path, csv, function (err) {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      //write the headers and newline
      console.log("New file, just writing headers");
      fields = fields + newLine;

      fs.writeFile(file_path, fields, function (err) {
        if (err) throw err;
        console.log("file saved");
      });
    }
  });
};

const createCSV = (structured_descriptions, path) => {
  console.log(structured_descriptions);

  const csvString = [
    [
      "JobTitle",
      "CompanyName",
      "JobLocation",
      "JobType",
      "ProgrammingType",
      "YearlySalary",
      "HourlySalary",
      "WorkFromHome",
      "ApplicationLimitDate",
      "JobIndustry",
      "RequiredHardSkills",
      "PreferredHardSkills",
      "RequiredSoftSkills",
      "PreferredSoftSkills",
      "NeededExperience",
      "LegalRequirements",
      "Tasks",
      "StudyRequirements",
      "StudyPreferences",
      "LegalPreferences",
    ],
    [
      ...structured_descriptions.map((desc) => [
        desc.JobTitle,
        desc.CompanyName,
        desc.JobLocation,
        desc.JobType,
        desc.ProgrammingType,
        desc.YearlySalary,
        desc.HourlySalary,
        desc.WorkFromHome,
        desc.ApplicationLimitDate,
        desc.JobIndustry,
        desc.RequiredHardSkills,
        desc.PreferredHardSkills,
        desc.RequiredSoftSkills,
        desc.PreferredSoftSkills,
        desc.NeededExperience,
        desc.LegalRequirements,
        desc.Tasks,
        desc.StudyRequirements,
        desc.StudyPreferences,
        desc.LegalPreferences,
      ]),
    ],
  ]
    .map((e) => e.join(","))
    .join("\n");

  console.log(csvString);

  const file_path = path + "/databases/structured_descriptions.csv";

  fs.writeFile(file_path, csvString, "utf8", (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("FILE WRITTEN");
    }
  });
};
