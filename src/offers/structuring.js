const fs = require("fs");
const dJSON = require("dirty-json");

const { Configuration, OpenAIApi } = require("openai");

const {
  getProcessedText,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/offers/processing.js");

const getStructuredText = async (descriptions, path, titles, issues) => {
  let structured_descriptions = [];

  console.log(`CURRENTLY WORKING ON ${descriptions.length} ITEMS`);

  for (let i = 0; i <= descriptions.length; i++) {
    console.log(`THIS IS ITEM NUMBER: ${i}`);

    const description = descriptions[i];

    console.log("GETTING PROCESSED DESCRIPTION");
    const processed_description = await getProcessedText(description);

    console.log("PROCESSED DESCRIPTION: ");
    console.log(processed_description);

    await new Promise((resolve) => setTimeout(resolve, 45000));
    console.log("finished timeout for processing");

    const structured_description = await getStructuredDescription(
      processed_description,
      i,
      issues
    );

    console.log(
      `finished working on ${structured_description.JobTitle} with API`
    );

    structured_description.OfficialTitle = titles[i];
    structured_descriptions.push(structured_description);

    //appendToCSV(structured_description, path);
    updateJSON(structured_description, path);

    await new Promise((resolve) => setTimeout(resolve, 45000));
    console.log("finished timeout for structuring");
  }

  return structured_descriptions;
};

const updateJSON = (structured_description, path) => {
  console.log("UPDATING JSON");

  console.log("STRUCTURED DESCRIPTION TO BE ADDED TO JSON");
  console.log(structured_description);

  const file_path = path + "/databases/descriptions/final_descriptions.json";

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
        apiKey: process.env.OPENAI_API_KEY_FATOU,
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

ProgrammingType: Une de ces options selon le type de programmation le plus demandé pour l'offre: web, logiciel, mobile, système, scientifique ou analyste donnees, gestion donees, geomatique, jeux-videos, general

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

module.exports = { getStructuredText };
