require("dotenv").config();

const {
  getDescriptions,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/helpers/index.js");

const {
  getStructuredText,
} = require("/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/profiles/structuring.js");

const main = async () => {
  const directory_path =
    "/Users/Thomas/Documents/projects/ia-pipeline/ia-pipeline/src/profiles/";

  //Get descriptions
  const { descriptions } = await getDescriptions(
    directory_path + "data/cleaned_profiles/"
  );

  let titles = descriptions.map((item) => item.title);

  //Keep only summary
  const getShortenedDescriptions = async (descriptions) => {
    let shortened_descriptions = [];

    for (profile of descriptions) {
      if (profile.description.split(" ").length < 1000) {
        shortened_description = profile.description;
      } else {
        const index = profile.description.indexOf("PROFESSIONAL EXPERIENCE");
        shortened_description = profile.description.slice(0, index);
        shortened_descriptions.push(shortened_description);
      }
    }

    return shortened_descriptions;
  };

  const shortened_descriptions = await getShortenedDescriptions(descriptions);

  //Translate every single one

  const randomEntries = shortened_descriptions.slice(300, 400);
  const randomTitles = titles.slice(300, 400);
  console.log(
    titles.findIndex((el) => el == "Sr. QA ETL Tester Resume Rochester, MN")
  );
  /* for (let i = 0; i < 100; i++) {
    const randomIndex = Math.floor(
      Math.random() * shortened_descriptions.length
    );
    randomEntries.push(shortened_descriptions[randomIndex]);
    randomTitles.push(titles[randomIndex]);
  } */

  //Translation and structuring in to usable JSON

  const structured_text = await getStructuredText(
    randomEntries,
    directory_path,
    randomTitles
  );

  /* console.log(structured_text); */
};

main();
