const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

//OPEN AI

const getProcessedText = async (description) => {
  console.log("GETTING THE PROCESSED TEXT");

  return new Promise(async (resolve, reject) => {
    console.log("STARTING API CALL FOR PROCESSING");
    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY_JOEL,
      });
      const openai = new OpenAIApi(configuration);

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Voici un poste d'emploi, si le texte est en anglais traduit le en français (si une partie du texte est déjà en français, efface la partie anglaise). Si le texte était déjà en français corrige seulement les erreurs d'encodage et enlève les parties en anglais. Voici le texte: + ${description}`,
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

module.exports = { getProcessedText };
