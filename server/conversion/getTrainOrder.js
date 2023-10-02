const getClass = (fahrzeugtyp) => {
  const klasse = fahrzeugtyp.slice(0, 1);
  switch (klasse) {
    case "A":
      const _ =
        fahrzeugtyp.slice(1, 2) == "R"
          ? "Halbspeisewagen 1.Klasse"
          : "1. Klasse";
      return _;
    case "B":
      const _b =
        fahrzeugtyp.slice(1, 2) == "R"
          ? "Halbspeisewagen 2.Klasse"
          : "2. Klasse";
      return _b;
    case "W":
      const _w =
        fahrzeugtyp.slice(1, 2) == "R" ? "IC-Speisewagen" : "Schlafwagen";
      return _w
    default:
      break;
  }
};

const formatCategory = (inputString) => {
  const index = inputString.toLowerCase().indexOf("wagen");
  if (index !== -1) {
    const result = inputString.slice(0, index + "wagen".length);

    // Convert the result to lowercase
    const lowerCaseString = result.toLowerCase();

    // Split the string into words
    const words = lowerCaseString.split(" ");

    // Capitalize the first letter of each word
    const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    );

    // Join the words back to form the normalized string
    const normalizedString = capitalizedWords.join(" ");

    return normalizedString;
  }
  return inputString;
};
const normalizeCap = (str) => {
  str = str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
  return str;
};
const strip = (str) => str.slice(1, 4);

const constructcoach = (coach) => {
  return {
    id: coach.wagenordnungsnummer,
    typ:
      coach.kategorie == "LOK"
        ? "BR" + strip(coach.fahrzeugtyp)
        : coach.fahrzeugtyp,
    isLocomotive: coach.kategorie == "LOK",
    isPowercar: coach.kategorie == "TRIEBKOPF",
    isControlcar: coach.kategorie.includes("STEUERWAGEN"),
    class: getClass(coach.fahrzeugtyp),
    baureihe:
      coach.kategorie == "LOK"
        ? coach.fahrzeugnummer.slice(5, 8)
        : coach.fahrzeugnummer.slice(4, 8),
    kategorie:
      coach.kategorie == "LOK" || coach.kategorie == "TRIEBKOPF"
        ? normalizeCap(coach.kategorie)
        : formatCategory(coach.kategorie),
    ordnungsNummer: coach.fahrzeugnummer.slice(8, 12),
    abschnitt: coach.fahrzeugsektor,
    austtattung: coach.allFahrzeugausstattung.map((e) => e.ausstattungsart),
  };
};

export const getTrainOrder = (data) => {
  let fzg1 = data.data.istformation.allFahrzeuggruppe[0];
  let fzg2 = data.data.istformation.allFahrzeuggruppe[1];
  let dotra = false;
  if (fzg2 !== undefined) {
    dotra = fzg2.allFahrzeug[0].kategorie !== "LOK";
  }
  let baureihe = "";
  let coaches = [];
  let coachesFzg2 = [];
  let onlyPlanData = data.data.istformation.istplaninformation;
  fzg1.allFahrzeug.forEach((coach) => {
    if (coach.kategorie == "LOK") {
      baureihe = "Lok + Wagen"
    }
    coaches.push(constructcoach(coach));
  });
  if (dotra) {
    fzg2.allFahrzeug.forEach((coach) => {
      coachesFzg2.push(constructcoach(coach));
    });
  }
  switch (coaches[0].baureihe) {
    case "5401":
      baureihe = "401 (ICE 1)";
      break;
    case "5402":
      baureihe = "402 (ICE 2)";
      break;
    case "5403":
      baureihe = "403 (ICE 3)";
      break;
    case "5406":
      baureihe = "406 (ICE 3MS)";
      break;
    case "5407":
      baureihe = "407 (Velaro D)";
      break;
    case "5408":
      baureihe = "408 (ICE 3neo)";
      break;
    case "5411":
      baureihe = "411 (ICE T)";
      break;
    case "5415":
      baureihe = "408 (ICE T)";
      break;

    case "0812":
    case "5812":
      baureihe = "412.0 (ICE 4 12tlg.)";
      break;
    case "6812":
    case "7812":
      baureihe = "412.2 (ICE 4 7tlg.)";
      break;

    default:
      if (coaches[-1].baureihe == "5402") {
        baureihe = "402 (ICE 2)";
      }
      break;
  }
  return {
    baureihe: baureihe,
    firstTrain: coaches,
    doubleTraction: dotra,
    secondTrain: coachesFzg2,
    onlyPlanData: onlyPlanData,
  };
};
