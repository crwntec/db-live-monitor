import { makeRequest } from "../request/makeRequest.js";

let parsedCats = [
  { cat: 0, text: "Unbekannt" },
  { cat: 1, text: "Unbekannt" },
  { cat: 2, text: "Polizeiliche Ermittlung" },
  { cat: 3, text: "Feuerwehreinsatz neben der Strecke" },
  { cat: 5, text: "Ärztliche Versorgung eines Fahrgastes" },
  { cat: 6, text: "Betätigen der Notbremse" },

  { cat: 7, text: "Personen im Gleis" },
  { cat: 8, text: "Notarzteinsatz am Gleis" },
  { cat: 9, text: "Streikauswirkungen" },
  { cat: 10, text: "Ausgebrochene Tiere im Gleis" },
  { cat: 11, text: "Unwetter" },
  { cat: 13, text: "Pass- und Zollkontrolle" },

  { cat: 15, text: "Beeinträchtigung durch Vandalismus" },
  { cat: 16, text: "Entschärfung einer Fliegerbombe" },
  { cat: 17, text: "Beschädigung einer Brücke" },
  { cat: 18, text: "Umgestürzter Baum im Gleis" },
  { cat: 19, text: "Unfall an einem Bahnübergang" },
  { cat: 20, text: "Tiere im Gleis" },
  { cat: 21, text: "Warten auf weitere Reisende" },
  { cat: 22, text: "Witterungsbedingte Störung" },
  { cat: 23, text: "Feuerwehreinsatz auf Bahngelände" },
  { cat: 24, text: "Verspätung aus dem Ausland" },
  { cat: 25, text: "Warten auf verspätete Zugteile" },
  { cat: 28, text: "Gegenstände im Gleis" },
  { cat: 29, text: "Ersatzverkehr mit Bus ist eingerichtet" },
  { cat: 30, text: "Unbekannt" },
  { cat: 31, text: "Bauarbeiten" },
  { cat: 32, text: "Verzögerung beim Ein-/Ausstieg" },
  { cat: 33, text: "Oberleitungsstörung" },
  { cat: 34, text: "Signalstörung" },
  { cat: 35, text: "Streckensperrung" },
  { cat: 36, text: "Technische Störung am Zug" },
  { cat: 37, text: "Technische Störung am Wagen" },
  { cat: 38, text: "Technische Störung an der Strecke" },
  { cat: 39, text: "Anhängen von zusätzlichen Wagen" },
  { cat: 40, text: "Stellwerksstörung/-ausfall" },
  { cat: 41, text: "Störung an einem Bahnübergang" },
  { cat: 42, text: "Außerplanmäßige Geschwindigkeitsbeschränkung" },
  { cat: 43, text: "Verspätung eines vorausfahrenden Zuges" },
  { cat: 44, text: "Warten auf einen entgegenkommenden Zug" },
  { cat: 45, text: "Überholung durch anderen Zug" },
  { cat: 46, text: "Warten auf freie Einfahrt" },
  { cat: 47, text: "Verspätete Bereitstellung" },
  { cat: 48, text: "Verspätung aus vorheriger Fahrt" },
  { cat: 55, text: "Technische Störung an einem anderen Zug" },

  { cat: 56, text: "Warten auf Fahrgäste aus einem Bus" },

  { cat: 57, text: "Zusätzlicher Halt" },

  { cat: 58, text: "Umleitung" },

  { cat: 59, text: "Schnee und Eis" },

  { cat: 60, text: "Reduzierte Geschwindigkeit wegen Sturm" },

  { cat: 61, text: "Türstörung" },

  { cat: 62, text: "Behobene technische Störung am Zug" },

  { cat: 63, text: "Technische Untersuchung am Zug" },
  { cat: 64, text: "Weichenstörung" },

  { cat: 65, text: "Erdrutsch" },

  { cat: 66, text: "Hochwasser" },

  { cat: 67, text: "Behördliche Anordnung" },
  { cat: 68, text: "Unbekannt" },

  { cat: 70, text: "WLAN nicht verfügbar" },

  { cat: 71, text: "WLAN in einzelnen Wagen nicht verfügbar" },
  { cat: 72, text: "Info/Entertainment nicht verfügbar" },
  { cat: 73, text: "Mehrzweckabteil vorne" },

  { cat: 74, text: "Mehrzweckabteil hinten" },

  { cat: 75, text: "1. Klasse vorne" },

  { cat: 76, text: "1. Klasse hinten" },

  { cat: 77, text: "Ohne 1. Klasse" },

  { cat: 78, text: "Ersatzverkehr mit Bus ist eingerichtet" },
  { cat: 79, text: "Ohne Mehrzweckabteil" },

  { cat: 80, text: "Abweichende Wagenreihung" },

  { cat: 81, text: "Fahrzeugtausch" },
  { cat: 82, text: "Mehrere Wagen fehlen" },

  { cat: 83, text: "Störung der fahrzeuggebundenen Einstiegshilfe" },
  { cat: 84, text: "Zug verkehrt richtig gereiht" },

  { cat: 85, text: "Ein Wagen fehlt" },

  { cat: 86, text: "Keine Reservierungsanzeige" },

  { cat: 87, text: "Einzelne Wagen ohne Reservierungsanzeige" },

  { cat: 88, text: "Keine Qualitätsmängel" },

  { cat: 89, text: "Reservierungen sind wieder vorhanden" },

  { cat: 90, text: "Kein gastronomisches Angebot" },

  { cat: 91, text: "Eingeschränkte Fahrradbeförderung" },
  { cat: 92, text: "Keine Fahrradbeförderung" },
  { cat: 93, text: "Fehlende oder gestörte behindertengerechte Einrichtung" },

  { cat: 94, text: "Ersatzbewirtschaftung" },

  { cat: 95, text: "Ohne behindertengerechtes WC" },

  { cat: 96, text: "Der Zug ist stark überbesetzt" },

  { cat: 97, text: "Der Zug ist überbesetzt" },

  { cat: 98, text: "Sonstige Qualitätsmängel" },

  { cat: 99, text: "Verzögerungen im Betriebsablauf" },
];

const getWings = (tripId, wings) =>
  makeRequest(
    `https://iris.noncd.db.de/iris-tts/timetable/wingdef/${tripId}/${wings}`
  );

const convertIRISTime = (timestamp) => {
  // Fix year handling by adding 2000
  const year = `20${timestamp.substring(0, 2)}`;
  const month = timestamp.substring(2, 4);
  const day = timestamp.substring(4, 6);
  const hour = timestamp.substring(6, 8);
  const minute = timestamp.substring(8, 10);

  return new Date(`${year}-${month}-${day}T${hour}:${minute}`);
};


const messageLookup = (cat) => parsedCats.find((e) => e.cat == cat);

export const convertTimetable = (data1, data2, changes) => {
  return new Promise(async (resolve) => {
    let dataTimetable = data2
      ? {
          attributes: data1.attributes,
          elements: [...data1.elements, ...data2.elements[0].elements],
        }
      : data1;

    const changesTimetable = changes.elements[0];
    if (!dataTimetable.attributes || !changesTimetable.elements) return;

    let newJSON = { station: dataTimetable.attributes.station, stops: [] };
    dataTimetable.elements = dataTimetable.elements.filter(
      (e) => e !== undefined
    );
    changesTimetable.elements = changesTimetable.elements.filter(
      (e) => e !== undefined
    );

    const processStop = async (e) => {
      const foundChanges =
        changesTimetable.elements.find(
          (o) => o.attributes.id == e.attributes.id
        ) ||
        changes.elements[0].elements.find(
          (o) => o.attributes.id == e.attributes.id
        );

      let delayMessages = [];

      const newArr = foundChanges?.elements.find((o) => o.name == "ar");
      const newDep = foundChanges?.elements.find((o) => o.name == "dp");
      
      newArr?.elements?.filter((e) => e !== undefined).forEach((element) => {
        const category = messageLookup(element.attributes.c);
        if (category && e.attributes.d) {
          delayMessages.push({ ...category, timestamp: convertIRISTime(e.attributes.ts) });
        }
      });
      if (delayMessages.length > 0) console.log(delayMessages);

      const line = e.elements.find((o) => o.name == "tl");
      const arrival = e.elements.find((o) => o.name == "ar");
      const departure = e.elements.find((o) => o.name == "dp");

      const hasArrival = arrival !== undefined;
      const hasDeparture = departure !== undefined;

      const arrString = hasArrival ? arrival.attributes.pt : "-";
      const depString = hasDeparture ? departure.attributes.pt : "-";

      const irisArPath = hasArrival ? arrival.attributes.ppth.split("|") : [];
      const plannedPath = hasDeparture
        ? departure.attributes.ppth.split("|")
        : [];
      const irisDpPath = newDep?.attributes?.ppth?.split("|") || [];

      const hasWings =
        (hasArrival
          ? hasDeparture
            ? arrival.attributes.wings || departure.attributes.wings
            : arrival.attributes.wings
          : departure.attributes.wings) !== undefined;
      const wings = hasWings
        ? arrival.attributes.wings || departure.attributes.wings
        : [];

      let wing = null;
      if (hasWings) {
        const wingDef = (await getWings(e.attributes.id, wings)).elements[0]
          .elements;
        if (wingDef) {
          const start = wingDef.find((e) => e.name == "start");
          const end = wingDef.find((e) => e.name == "end");
          wing = {
            origin: e.attributes.id,
            wing: wings,
            start: {
              station: start.attributes["st-name"],
              pt: start.attributes.pt,
            },
            end: { station: end.attributes["st-name"], pt: end.attributes.pt },
          };
        }
      }

      const cat = line.attributes.f;
      const lineString =
        cat == "F" ||
        !(hasArrival ? arrival.attributes.l : departure.attributes.l)
          ? line.attributes.n
          : hasArrival
          ? arrival.attributes.l
          : departure.attributes.l;

      const stopObj = {
        tripId: e.attributes.id,
        hasArrival,
        hasDeparture,
        when: {
          arrival: hasArrival ? convertIRISTime(arrString) : "-",
          departure: hasDeparture ? convertIRISTime(depString) : "-",
        },
        plannedWhen: {
          arrival: hasArrival ? convertIRISTime(arrString) : "-",
          departure: hasDeparture ? convertIRISTime(depString) : "-",
        },
        canceled: newArr?.attributes?.cs == "c",
        delayMessages: delayMessages,
        onlyPlanData: irisDpPath.length == 0 && hasDeparture,
        platform: hasArrival
          ? newArr?.attributes?.cp || arrival.attributes.pp
          : newDep?.attributes?.cp || departure.attributes.pp,
        plannedPlatform: hasArrival
          ? arrival.attributes.pp
          : departure.attributes.pp,
        hasWings,
        wing,
        from: hasArrival ? irisArPath[0] : dataTimetable.attributes.station,
        to: hasDeparture
          ? plannedPath[plannedPath.length - 1]
          : dataTimetable.attributes.station,
        line: {
          fahrtNr: line.attributes.n,
          name: `${line.attributes.c} ${lineString}`,
          productName: line.attributes.c,
          operator: line.attributes.o,
        },
      };
      return stopObj;
    };

    const processedStops = await Promise.all(
      dataTimetable.elements.map(processStop)
    );
    const uniqueProcessedStops = processedStops.filter(
      (item, index, array) =>
        array.findIndex(
          (el) =>
            el.tripId === item.tripId || el.line.fahrtNr === item.line.fahrtNr
        ) === index
    );

    newJSON.stops = uniqueProcessedStops;

    resolve(newJSON);
  });
};
