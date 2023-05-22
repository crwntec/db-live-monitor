import customURLEncode from "./customDecoding.js";
const originalString = "Köln";
const encodedString = customURLEncode(originalString);

console.log(encodedString);