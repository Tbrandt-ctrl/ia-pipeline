const {
  getDescriptions,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/helpers/index.js");

const {
  getStructuredText,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/offers/structuring.js");

require("dotenv").config();

const main = async () => {
  const directory_path =
    "/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/offers/";

  const { descriptions } = await getDescriptions(
    directory_path + "/textFiles/preprocessed/"
  );

  let titles = descriptions.map((item) => item.title);

  let preprocessed_descriptions = [];

  for (profile of descriptions) {
    description = profile.description;
    preprocessed_descriptions.push(description);
  }

  const randomEntries = preprocessed_descriptions.slice(63);
  const randomTitles = titles.slice(63);

  console.log("TITRES");
  randomTitles.map((el) => console.log(el));

  console.log(
    randomTitles.findIndex((el) => el === "A inc. - Programmeur web ( T11 )") //62
  );

  let issues = [];

  const structured_text = await getStructuredText(
    randomEntries,
    directory_path,
    randomTitles,
    issues
  );
};

main();
