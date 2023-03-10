const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

const getTranslatedProfile = async (profile, i, issues) => {
  console.log("GETTING TRANSLATED TEXT");
  return new Promise(async (resolve, reject) => {
    console.log("STARTING API CALL FOR TRANSLATION");

    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      const prompt = `
      Translate this text to french : ${profile}
      `;

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 2000,
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

        console.log("RESPONSE FROM API(TRANSLATION) : ");
        console.log(response_text);

        translated_profile = response_text;

        console.log("TRANSLATED PROFILE : ");
        console.log(translated_profile);

        console.log("GOTTEN TRANSLATED TEXT");
        resolve(translated_profile);
      } else {
        console.error("No sentiment analysis response received");
        issues.push(`translation issues at ${i}`);
      }
    } catch (err) {
      issues.push(`translation issues at ${i}`);
      reject(err);
    }
  });
};

module.exports = { getTranslatedProfile };
