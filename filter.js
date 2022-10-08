
import _ from "lodash";
import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";

/**
 * Returns the new filtered array with highlighted parts.
 * @param data {Array<Object>} - The collection to iterate over.
 * @param inputValue {string} - The input value.
 * @return {Array} - Returns the new filtered array.
 */
export const filterByNames = (data, inputValue) => {
  // Create a dynamic regex expression object with ignore case sensitivity
  const re = new RegExp(_.escapeRegExp(inputValue), "i");
  // clone the original data deeply
  // as we need to modify the array while iterating it
  const clonedData = _.cloneDeep(data);
  const results = clonedData.filter((object) => {
    // use filter instead of some
    // to make sure all items are checked
    // first check object.list and then check object.name
    // to avoid skipping list iteration when name matches
    return object.list.filter((item) => {
      if (re.test(item.name)) {
        // Calculates the characters to highlight in text based on query
        const matches = match(item.name, inputValue);
        // Breaks the given text to parts based on matches.
        // After that create a new property named `parts` and assign an array to it.
        item["parts"] = parse(item.name, matches);
        return true;
      } else {
        return false;
      }
    }).length > 0 || re.test(object.name);
  });
  return results;
};
