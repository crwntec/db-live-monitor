import {Tooltip} from "flowbite-react";
import {Wind, PhoneOff, Gem, Accessibility, Baby, Users} from "lucide-react";
import {JSX} from "react";

const amenityIcons = new Map<string, { icon: JSX.Element; label: string }>([
    ["AIR_CONDITION", {icon: <Wind size={16}/>, label: "Klimaanlage"}],
    ["ZONE_QUIET", {icon: <PhoneOff size={16}/>, label: "Ruhebereich"}],
    [
        "SEATS_BAHN_COMFORT",
        {icon: <Gem size={16}/>, label: "Komfort-Sitzplätze"},
    ],
    [
        "SEATS_SEVERELY_DISABLED",
        {icon: <Accessibility size={16}/>, label: "Behindertenplätze"},
    ],
    ["CABIN_INFANT", {icon: <Baby size={16}/>, label: "Kleinkindabteil"}],
    [
        "WHEELCHAIR_SPACE",
        {icon: <Accessibility size={16}/>, label: "Rollstuhlplatz"},
    ],
    [
        "TOILET_WHEELCHAIR",
        {icon: <Accessibility size={16}/>, label: "Barrierefreies WC"},
    ],
    ["ZONE_FAMILY", {icon: <Users size={16}/>, label: "Familienbereich"}],
    ["BIKE_SPACE", {icon: <Wind size={16}/>, label: "Fahrradstellplatz"}],
]);
const UICCountryCodes = new Map<string, { long: string; short: string }>([
    ["10", {long: "Finnland", short: "FI"}],
    ["20", {long: "Russland", short: "RU"}],
    ["21", {long: "Belarus", short: "BY"}],
    ["22", {long: "Ukraine", short: "UA"}],
    ["24", {long: "Litauen", short: "LT"}],
    ["25", {long: "Lettland", short: "LV"}],
    ["26", {long: "Estland", short: "EE"}],
    ["51", {long: "Polen", short: "PL"}],
    ["54", {long: "Tschechien", short: "CZ"}],
    ["55", {long: "Ungarn", short: "HU"}],
    ["56", {long: "Slowakei", short: "SK"}],
    ["70", {long: "Vereinigtes Königreich", short: "GB"}],
    ["71", {long: "Spanien", short: "ES"}],
    ["72", {long: "Serbien", short: "RS"}],
    ["73", {long: "Griechenland", short: "GR"}],
    ["74", {long: "Schweden", short: "SE"}],
    ["76", {long: "Norwegen", short: "NO"}],
    ["78", {long: "Kroatien", short: "HR"}],
    ["79", {long: "Slowenien", short: "SI"}],
    ["80", {long: "Deutschland", short: "DE"}],
    ["81", {long: "Österreich", short: "AT"}],
    ["82", {long: "Luxemburg", short: "LU"}],
    ["83", {long: "Italien", short: "IT"}],
    ["84", {long: "Niederlande", short: "NL"}],
    ["85", {long: "Schweiz", short: "CH"}],
    ["86", {long: "Dänemark", short: "DK"}],
    ["87", {long: "Frankreich", short: "FR"}],
    ["88", {long: "Belgien", short: "BE"}],
]);

export function parseUICIdentifier(identifier: string) {
    const exchangeCode = identifier.substring(0, 2);
    const countryCode = identifier.substring(2, 4);
    const classNumber = identifier.substring(4, 8);
    const vehicleNumber = identifier.substring(8, 11);

    return {exchangeCode, countryCode, classNumber, vehicleNumber};
}

export function parseCountrycode(code: string) {
    return UICCountryCodes.get(code) || {long: "Unbekannt", short: "XX"};
}

export function parseClassNumber(classNumber: string) {
    return `BR ${classNumber.substring(1)}`;
}

export function formatUIC(identifier: string) {
    const {exchangeCode, countryCode, classNumber, vehicleNumber} =
        parseUICIdentifier(identifier);
    return `${exchangeCode}-${countryCode}-${classNumber}-${vehicleNumber}`;
}

export function getLongNameForClassNumber(classNumber: string) {
    const _classNumber = parseInt(classNumber.substring(1));
    switch (_classNumber) {
        case 147:
        case 146:
        case 681:
            return "IC2 Dosto";
        case 10:
        case 110:
            return "IC2 Kiss";
        case 101:
            return "IC1 Flachpark";
        case 193:
            return "Vectron Wagenpark";
        case 401:
            return "401 (ICE 1)";
        case 402:
        case 808:
            return "402 (ICE 2)";
        case 403:
            return "403 (ICE 3)";
        case 406:
            return "406 (ICE 3MS)";
        case 407:
            return "407 (Velaro D)";
        case 408:
            return "408 (ICE 3neo)";
        case 411:
            return "411 (ICE T)";
        case 415:
            return "408 (ICE T)";

        case 812:
            if (
                classNumber.substring(0, 1) == "0" ||
                classNumber.substring(0, 1) == "5"
            )
                return "412.0 (ICE 4 12tlg.)";
            return "412.2 (ICE 4 7tlg.)";
        case 491:
            return "ICE L"
        case 462:
            return "Desiro HC";
        case 420:
            return "S-Bahn 420";
        case 422:
        case 423:
        case 424:
            return "S-Bahn " + _classNumber;
        case 425:
            return "ET 425";
        case 426:
            return "Stadler Flirt (Zweiteilig)"
        case 427:
            return classNumber.substring(0,1)=='3' ? "Stadler FLirt 3XL (dreiteilig)": "Stadler Flirt 3 (dreiteilig)"
        case 428:
            return classNumber.substring(0,1)=='3' ? "Stadler FLirt 3XL (vierteilig)": "Stadler Flirt 3 (vierteilig)"
        case 429:
            return classNumber.substring(0,1)=='3' ? "Stadler FLirt 3XL (fünfteilig)": "Stadler Flirt 3 (fünfteilig)"
        case 430:
            return "S-Bahn 430";
        case 440:
            return "Alstom Coradia Continental";
        case 442:
            return "Talent 2"
        case 620:
            return "Lint 41";
        default:
            return "Wagen: " + classNumber;
    }
}

export function parseAmenities(amenityType: string) {
    const amenityIcon = amenityIcons.get(amenityType);
    return amenityIcon ? (
        <Tooltip content={amenityIcon.label}>{amenityIcon.icon}</Tooltip>
    ) : null;
}

export function parseCategory(category: string) {
    switch (category) {
        case "LOCOMOTIVE":
            return "Lok";
        case "POWERCAR":
            return "Triebkopf";
        case "PASSENGERCARRIAGE_ECONOMY_CLASS":
        case "PASSENGERCARRIAGE_FIRST_CLASS":
        case "PASSENGERCARRIAGE_FIRST_ECONOMY_CLASS":
            return "Reisezugwagen";
        case "DOUBLEDECK_ECONOMY_CLASS":
        case "DOUBLEDECK_FIRST_CLASS":
            return "Doppelstockwagen";
        case "HALFDININGCAR_FIRST_CLASS":
        case "HALFDININGCAR_ECONOMY_CLASS":
            return "Halbspeisewagen";
        case "DININGCAR":
            return "Speisewagen";
        case "CONTROLCAR_FIRST_CLASS":
        case "CONTROLCAR_ECONOMY_CLASS":
            return "Steuerwagen";
        case "CONTROLCAR_FIRST_ECONOMY_CLASS":
            return "Steuerwagen 1./2. Klasse";
        case "DOUBLEDECK_CONTROLCAR_ECONOMY_CLASS":
        case "DOUBLEDECK_CONTROLCAR_FIRST_CLASS":
            return "Dosto-Steuerwagen";
        default:
            return category;
    }
}
