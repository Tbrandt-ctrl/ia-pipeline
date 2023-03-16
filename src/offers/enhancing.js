const {
  getJSON,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/helpers/index.js");

const dJSON = require("dirty-json");

require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const main = async () => {
  //get descriptions
  const directory_path =
    "/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/offers/";

  const descriptions = await getJSON(
    directory_path + "databases/descriptions/final_descriptions.json"
  );

  descriptions.slice(0, 1).forEach(async (description) => {
    const i = descriptions.indexOf(description);

    // Nettoyage des types de descriptions
    const cleaned_types = getCleanedTypes(description.ProgrammingType);
    description.ProgrammingType = cleaned_types;

    // Modifying the description based on the main type
    const main_type = cleaned_types[0];

    let current_file;

    switch (main_type) {
      case "web":
        current_file = "web.json";
    }

    if (current_file) {
      const enhancing_JSON_path =
        directory_path + "databases/fiches_metier/" + current_file;

      const enhancing_json = await getJSON(enhancing_JSON_path);

      const new_description = await handleTypes(description, enhancing_json, i);
      /* console.log(new_description); */
    }
  });
};

main();

const handleTypes = async (description, enhancing_json, i) => {
  let issues = [];

  const enhanced_tasks = await getEnhancedTasks(
    description,
    enhancing_json,
    issues,
    i
  );

  console.log(enhanced_tasks);

  const enhanced_soft_skills = await getEnhancedSoftSkills(
    description,
    enhancing_json,
    issues,
    i
  );

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

  description_new_elements.RIASEC = enhancing_json.RIASEC;
  description_new_elements.OtherTitles = enhancing_json.OtherTitles;

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
        apiKey: process.env.OPENAI_API_KEY_FATOU,
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
  //Define the correct job type
  //Add RIASEC
  //Add softskils
  return;
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
    "gestion donees",
    "Gestion donees",
    "Gestion donées",
    "gestion donées",
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
