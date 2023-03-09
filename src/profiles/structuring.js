const fs = require("fs");
const { Parser } = require("@json2csv/plainjs");
var json2csv = require("json2csv");
const dJSON = require("dirty-json");

const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

const getStructuredText = async (text, directory_path) => {
  let structured_profiles = [];

  let issues = [];

  //Looping through the translated text
  for (let i = 0; i < text.length; i++) {
    const profile = text[i];

    const structured_profile = await getStructuredProfile(profile, i, issues);

    console.log(`finished working on ${structured_profile.ProfileTitle} `);

    console.log("APPENDING TO JSON");
    const path = directory_path + "data/structured_profiles.json";
    updateJSON(structured_profile, path);

    await new Promise((resolve) => setTimeout(resolve, 45000));
    console.log("finished timeout");

    structured_profiles.push(structured_profile);
  }

  console.log(issues);

  return structured_profiles;
};

module.exports = { getStructuredText };

const updateJSON = (text, path) => {
  console.log("UPDATING JSON");

  console.log("STRUCTURED DESCRIPTION TO BE ADDED TO JSON");
  console.log(text);

  fs.readFile(path, function (err, data) {
    const json = JSON.parse(data);

    json.push(text);

    const stringified_JSON = JSON.stringify(json);
    fs.writeFile(path, stringified_JSON, () => {});
  });
};

const getStructuredProfile = async (profile, i, issues) => {
  console.log("GETTING STRUCTURED TEXT");
  return new Promise(async (resolve, reject) => {
    console.log("STARTING API CALL");

    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      const prompt = `
      Here is a profile for a candidate for a job offer in the IT sector: 

      ${profile}


      Then, fill in the following JSON model based on the text from the profile.
      If you are unable to fill in a variable enter "NA". 
      Only respond with the valid JSON file where the values are in french and nothing else!

      {
          "ProfileTitle": "",
          "ProgrammingType": "",
          "WorkedIndustries": "",
          "Location": "",
          "TechHardSkills":"",
          "OtherHardSkills":"",
          "SoftSkills":"", 
          InferedSoftSkills: "",
          "Tools":"",	
          "SumYearsExperience":"",	
          "LegalAvailabilities":"",	
          "Responsibilities":"",	
          "Studies":"",
          "RIASEC":""
      }


      Here are more details on how you should use the different variables:

      ProfileTitle : Give the profile a name based on the text
      ProgrammingType	: The profile can be for a single type or multiple, choose among the following types : web, logiciel, mobile, donnees, geomatique, jeux-videos, general. I there are multiple types simply list them and put a comma in between them.
      Location : Where the candidate from the profile is based or the last know location
      WorkedIndustries : list the industries the candidate has worked in before
      TechHardSkills : list the technical hard skills of the candidate
      OtherHardSkills	: list other hard skills the candidate has
      SoftSkills : list the soft skills the candidate has
      InferedSoftSkills: try and infer soft skills from the text
      Tools	: list the tools the candidate is familiar with
      SumYearsExperience : Here I want a number which is the total years experience the candidate has working
      LegalAvailabilities	: If the profile mentions anything regarding the legal status of the candidate put it here
      Responsibilities	: list the responsibilities the candidate had in their last job
      Studies : list what and where the candidate studied
      RIASEC : classify the profile according to the RIASEC test (Realistic, Investigative, Artistic, Social, Enterprising, and Conventional). If the profile can fit 3 classifications, separate them by a comma and order them by confidence in the prediction. Only give me one word or two/three separated by a comma here.
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
          ProfileTitle: "",
          ProgrammingType: "",
          WorkedIndustries: "",
          Location: "",
          TechHardSkills: "",
          OtherHardSkills: "",
          SoftSkills: "",
          InferedSoftSkills: "",
          Tools: "",
          SumYearsExperience: "",
          LegalAvailabilities: "",
          Responsibilities: "",
          Studies: "",
          RIASEC: "",
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
