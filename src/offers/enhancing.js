const {
  getJSON,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/helpers/index.js");

const dJSON = require("dirty-json");
const fs = require("fs");

require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const main = async () => {
  //get descriptions
  const directory_path =
    "/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/offers/";

  const descriptions = await getJSON(
    directory_path + "databases/descriptions/final_descriptions.json"
  );

  console.log(descriptions.length);

  let new_descriptions = [];

  for (let i = 1; i < descriptions.slice(27).length; i++) {
    const description = descriptions[i];

    // Nettoyage des types de descriptions
    const cleaned_types = getCleanedTypes(description.ProgrammingType);
    description.ProgrammingType = cleaned_types;

    // Modifying the description based on the main type
    const main_type = cleaned_types[0];

    let current_file;

    switch (main_type) {
      case "web":
        current_file = "json/web.json";
        break;
      case "logiciel":
        current_file = "json/logiciel.json";
        break;
      case "systeme":
        current_file = "json/système.json";
        break;
      case "general":
        current_file = "json/general.json";
        break;
      case "mobile":
        current_file = "json/mobile WIP.json";
        break;
      case "jeux-videos":
        current_file = "json/jeux_videos WIP.json";
        break;
      case "geomatique":
        current_file = "json/geomatique WIP.json";
        break;
      case "scientifique ou analyste donnees":
        current_file = "json/analyste_donnees.json";
        break;
      case "gestion donnees":
        current_file = "json/gestion_donnees.json";
        break;
      default:
        current_file = undefined;
    }

    console.log(main_type);

    if (current_file) {
      console.log(current_file);
      const enhancing_JSON_path =
        directory_path + "databases/fiches_metier/" + current_file;

      const enhancing_json = await getJSON(enhancing_JSON_path);
      const new_description = await handleTypes(description, enhancing_json, i);

      //write to JSON
      updateJSON(new_description, directory_path);

      console.log("DONE");
      new_descriptions.push(new_description);
    }
  }

  /* const new_descriptions = await Promise.all(
    descriptions.slice(1).map(async (description) => {
      const i = descriptions.indexOf(description);

      // Nettoyage des types de descriptions
      const cleaned_types = getCleanedTypes(description.ProgrammingType);
      description.ProgrammingType = cleaned_types;

      // Modifying the description based on the main type
      const main_type = cleaned_types[0];

      let current_file;

      switch (main_type) {
        case "web":
          current_file = "json/web.json";
        case "logiciel":
          current_file = "json/logiciel.json";
        case "systeme":
          current_file = "json/système.json";
        case "general":
          current_file = "json/general.json";
        case "mobile":
          current_file = "json/mobile WIP.json";
        case "jeux-videos":
          current_file = "json/jeux_videos WIP.json";
        case "geomatique":
          current_file = "json/geomatique WIP.json";
        case "scientifique ou analyste donnees":
          current_file = "json/analyste_donnees.json";
        case "gestion donnees":
          current_file = "json/gestion_donnees.json";
      }

      if (current_file) {
        const enhancing_JSON_path =
          directory_path + "databases/fiches_metier/" + current_file;
        const enhancing_json = await getJSON(enhancing_JSON_path);
        const new_description = await handleTypes(
          description,
          enhancing_json,
          i
        );

        //write to JSON
        updateJSON(new_description, directory_path);

        console.log("DONE");
        return new_description;
      }
    })
  ); */
};

main();

const updateJSON = (new_description, path) => {
  console.log("UPDATING JSON");

  console.log("ENHANCED DESCRIPTION TO BE ADDED TO JSON");
  console.log(new_description);

  const file_path = path + "databases/descriptions/enhanced_descriptions.json";

  fs.readFile(file_path, function (err, data) {
    const json = JSON.parse(data);

    json.push(new_description);

    const stringified_JSON = JSON.stringify(json);
    fs.writeFile(file_path, stringified_JSON, () => {});
  });
};

const handleTypes = async (description, enhancing_json, i) => {
  let issues = [];

  const enhanced_tasks = await getEnhancedTasks(
    description,
    enhancing_json,
    issues,
    i
  );
  console.log(enhanced_tasks);
  await new Promise((resolve) => setTimeout(resolve, 45000));
  console.log("done with the tasks timeout");

  /* const enhanced_tasks = []; */

  const enhanced_soft_skills = await getEnhancedSoftSkills(
    description,
    enhancing_json,
    issues,
    i
  );
  console.log(enhanced_soft_skills);
  await new Promise((resolve) => setTimeout(resolve, 45000));
  console.log("done with the softskills timeout");

  /* const enhanced_soft_skills = []; */

  const new_description = await addElements(
    description,
    enhancing_json,
    enhanced_tasks,
    enhanced_soft_skills
  );

  console.log(issues);

  return new_description;
};

const addElements = async (
  description,
  enhancing_json,
  enhanced_tasks,
  enhanced_soft_skills
) => {
  let description_new_elements = description;

  const cleanExperience = (xp) => {
    let cleaned;

    if (xp === "NA") {
      cleaned = "NA";
    }

    const matches = xp.match(/\d+/g);

    if (matches) {
      const numbers = matches.map((match) => parseInt(match));
      let temp_cleaned;

      if (numbers.length === 1) {
        temp_cleaned = numbers[0];
      } else {
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        temp_cleaned = Math.round(sum / numbers.length);
      }

      cleaned = temp_cleaned;
    }
    return cleaned;
  };

  const cleaned_experience = cleanExperience(description.NeededExperience);

  const needed_experience =
    cleaned_experience === "NA"
      ? "NA"
      : cleaned_experience > 2
      ? "expérimenté"
      : "débutant";

  description_new_elements.RIASEC = enhancing_json.RIASEC;
  description_new_elements.OtherTitles = enhancing_json.OtherTitles;
  description_new_elements.Tasks = enhanced_tasks.Tasks;
  description_new_elements.RequiredSoftSkills =
    enhanced_soft_skills.RequiredSoftSkills;
  description_new_elements.PreferredSoftSkills =
    enhanced_soft_skills.PreferredSoftSkills;

  description_new_elements.CompetencyLevel = needed_experience;

  return description_new_elements;
};

const getEnhancedTasks = async (description, enhancing_json, issues, i) => {
  const current_tasks = description.Tasks;

  // To string functions
  const primary_functions = enhancing_json.PrimaryFunctions.join("; \n");

  //To string activités
  const work_activities = enhancing_json.WorkActivities.join("; \n");

  const prompt = `
    Voici une liste de tâches à réaliser dans le cadre d’un emploi et décrits dans une offre d’emploi:

    ${current_tasks}

    Voici une liste de fonctions plus générale pour ce type d’emploi:
    ${primary_functions}

    Voici une liste d’activités plus générales pour ce type d’emploi:
    ${work_activities}

    En partant de la liste de tâches à réaliser dans le cadre d’un emploi (la première liste), créer une nouvelle liste qui intègre les fonctions et les activités plus générales pour ce type d’emploi. Attention de garder l’ordre d’importance quand tu les intègres.
    Cette nouvelle liste devra utiliser le même format qu’une array javascript et donc ressembler à ceci :

    “Tasks”: [“tâche 1”, “tâche 2”]

    Répond uniquement avec cette liste dans ce format
    `;

  //Add tasks

  return new Promise(async (resolve, reject) => {
    console.log("STARTING API CALL FOR THE TASKS");
    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY_JOEL,
      });
      const openai = new OpenAIApi(configuration);

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

        let tasks = {};

        try {
          const cleaned_response = dJSON.parse(response_text);

          tasks = cleaned_response;
        } catch (err) {
          console.log("SOMETHING WENT WRONG WITH THE PARSING");
          console.error(err);
          issues.push(i);
        }

        console.log("FINAL TASKS : ");
        console.log(tasks);

        console.log("GOTTEN FINAL TASKS TEXT");
        resolve(tasks);
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

const getEnhancedSoftSkills = async (
  description,
  enhancing_json,
  issues,
  i
) => {
  const current_required_softskills = description.RequiredSoftSkills;
  const current_prefered_softskills = description.PreferredSoftSkills;

  // To string functions
  const habibilites = enhancing_json.Habilities.join("; \n");

  //To string activités
  const competencies = enhancing_json.Competencies.join("; \n");
  const personal_attributes = enhancing_json.PersonalAttributes.join("; \n");

  const prompt = `
    Partie 1

    Voici une liste de softskills nécessaires à avoir dans le cadre d’un emploi et décrits dans une offre d’emploi:

    ${current_required_softskills}

    Voici une liste de softskills plus générale pour ce type d’emploi:
    ${habibilites}

    En partant de la liste de softskills nécessaires dans le cadre d’un emploi (la première liste), créer une nouvelle liste qui intègre les softskills plus généraux pour ce type d’emploi. Attention de garder l’ordre d’importance quand tu les intègres.
    Cette nouvelle liste devra utiliser le même format qu’une array javascript et donc ressembler à ceci :

    “RequiredSoftSkills”: [“softskill 1”, “softskill 2”]

    Partie 2

    Voici une liste de softskills qu’il est intéressant à avoir dans le cadre d’un emploi et décrits dans une offre d’emploi (même emploi que pour les softskills nécessaires):

    ${current_prefered_softskills}

    Voici une liste de softskills intéressants à avoir plus générales pour ce type d’emploi:

    ${personal_attributes}
    ${competencies}

    En partant de la liste de softskills intéressants à avoir dans le cadre d’un emploi, créer une nouvelle liste qui intègre les softskills intéressants à avoir plus généraux pour ce type d’emploi. Attention de garder l’ordre d’importance quand tu les intègres.
    Cette nouvelle liste devra utiliser le même format qu’une array javascript et donc ressembler à ceci :

    “PreferredSoftSkills”: [“softskill 1”, “softskill 2”]

    Partie 3

    Maintenant que tu as réalisé les parties 1 et 2 répond uniquement avec une array d’array javascript dans le format suivant et grâce à ce que tu as fait dans les parties 1 et 2:


    {
    “RequiredSoftSkills”: [“softskill 1”, “softskill 2”],
    “PreferredSoftSkills”: [“softskill 1”, “softskill 2”]
    }
    `;
  console.log(prompt);

  //Add softskills

  return new Promise(async (resolve, reject) => {
    console.log("STARTING API CALL FOR THE SOFTSKILLS");
    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY_JOEL,
      });
      const openai = new OpenAIApi(configuration);

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

        let softskills = {};

        try {
          const cleaned_response = dJSON.parse(response_text);

          softskills = cleaned_response;
        } catch (err) {
          console.log("SOMETHING WENT WRONG WITH THE PARSING");
          console.error(err);
          issues.push(i);
        }

        function extractSoftSkills(softskills) {
          if ("Réponse" in softskills) {
            return softskills["Réponse"];
          } else if ("Réponse " in softskills) {
            return softskills["Réponse "];
          } else {
            return softskills;
          }
        }

        console.log("FINAL SOFTSKILLS BEFORE LAST CLEANUP: ");
        console.log(softskills);

        const extractedSkills = extractSoftSkills(softskills);

        softskills = extractedSkills;
        console.log("FINAL EXTRACTED SOFTSKILLS");
        console.log(extractedSkills);
        console.log("FINAL SOFTSKILLS : ");
        console.log(softskills);

        const removeQuotes = (str) => str.replace(/^“|”$/g, "");
        const clean_softskills = {};

        for (const [key, value] of Object.entries(softskills)) {
          const newKey = removeQuotes(key);
          const newVal = value.map(removeQuotes);
          clean_softskills[newKey] = newVal;
        }

        console.log("GOTTEN FINAL SOFTSKILLS TEXT");
        resolve(clean_softskills);
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

const getCleanedTypes = (descriptionType) => {
  const types = descriptionType ? descriptionType.split(",") : ["NA"];

  const allowed_types = [
    "Web",
    "web",
    "Logiciel",
    "logiciel",
    "mobile",
    "Mobile",
    "jeux-videos",
    "Jeux-videos",
    "general",
    "General",
    "géomatique",
    "Géomatique",
    "geomatique",
    "Geomatique",
    "scientifique ou analyste donnees",
    "gestion donnees",
    "Gestion donnees",
    "Gestion données",
    "gestion données",
    "NA",
    "Système",
    "Systeme",
    "systeme",
    "système",
  ];

  const equivalent_types = [
    {
      type: "web",
      equivalents: ["PHP", "Symfony", "Full-Stack", "PHP & Symfony"],
    },
    {
      type: "logiciel",
      equivalents: [
        "java",
        "C-C++",
        "Java",
        "Python",
        "Python 3",
        "python 3",
        "python",
        "C- C++",
        "C",
        "C++",
        "C#",
        "COBOL",
        "cobol",
      ],
    },
    { type: "systeme", equivalents: ["architecture logicielle"] },
    {
      type: "gestion donnees",
      equivalents: [
        "SQL",
        "SQL-Server",
        "SQL Server",
        "SQL-server",
        "SQL server",
        "SQL (PostgreSQL",
        "PostgreSQL",
      ],
    },
  ];

  const cleaned_types = types
    .map((type) => {
      // Check if the type is an equivalent type
      for (const equivType of equivalent_types) {
        if (equivType.equivalents.includes(type.trim())) {
          return equivType.type;
        }
      }
      // If the type is not an equivalent type, return the original type
      return type.trim();
    })
    .filter((type) => allowed_types.includes(type))
    .map((type) => type.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) // remove accents
    .map((type) =>
      type !== "NA" ? type.replace(/[^a-zA-Z\s]/g, "").toLowerCase() : "NA"
    )
    .filter((value, index, self) => self.indexOf(value) === index);

  return cleaned_types;
};
