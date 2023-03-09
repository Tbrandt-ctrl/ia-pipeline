require("dotenv").config();

const {
  getDescriptions,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/helpers/index.js");

const {
  getTranslatedText,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/profiles/translating.js");

const {
  getStructuredText,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/profiles/structuring.js");

const main = async () => {
  console.log("HELLO WORLD");

  const directory_path =
    "/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/profiles/";

  //Get descriptions
  const descriptions = await getDescriptions(
    directory_path + "data/cleaned_profiles/"
  );

  //Keep only summary
  const getShortenedDescriptions = async (descriptions) => {
    let shortened_descriptions = [];

    for (description of descriptions) {
      const index = description.indexOf("PROFESSIONAL EXPERIENCE");
      let shortened_description = description.slice(0, index);
      shortened_descriptions.push(shortened_description);
    }

    return shortened_descriptions;
  };

  const shortened_descriptions = await getShortenedDescriptions(descriptions);

  //Translate every single one

  const randomEntries = [];
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(
      Math.random() * shortened_descriptions.length
    );
    randomEntries.push(shortened_descriptions[randomIndex]);
  }

  const translated_text = await getTranslatedText(randomEntries);

  //Structure them into usable JSON

  const structured_text = await getStructuredText(
    translated_text,
    directory_path
  );

  console.log(structured_text);
};

main();
