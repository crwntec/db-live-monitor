export async function parseRemarks(remarks) {
  let hints = []
  let parsedRemarks = []

  await remarks.forEach(async element => {
      const translated = {
          id: Math.random().toString(16).slice(2),
          code: element.code,
          type: element.type,
          summary: element.summary,
          text: element.text
      };
    if (element.type == "hint") {
        hints.push(translated)
    } else if (element.type == "status" && !element.text.includes('Information')) {
        parsedRemarks.push(translated)
    }
  });
  return [hints, parsedRemarks]
}
