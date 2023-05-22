function customURLEncode(str) {
  const encodedStr = [];
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    const charCode = char.charCodeAt(0);
    if (charCode > 127) {
      encodedStr.push(`%${charCode.toString(16).toUpperCase()}`);
    } else {
      encodedStr.push(encodeURIComponent(char));
    }
  }
  return encodedStr.join("");
}

export default customURLEncode