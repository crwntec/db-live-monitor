import { CarriageSequenceT } from "@/types/carriageSequence";
import axios, { AxiosError } from "axios";

export const getCarriageSequence = async ({
  category,
  date,
  evaNumber,
  number,
  time,
}: {
  category: string;
  date: string;
  evaNumber: string;
  number: number;
  time: Date;
}) : Promise<CarriageSequenceT | null> => {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://www.bahn.de/web/api/reisebegleitung/wagenreihung/vehicle-sequence`,
    params: {
      category,
      date,
      evaNumber,
      number,
      time,
    },
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error: AxiosError | unknown) {
    if (axios.isAxiosError(error) && (error.response?.status == 500 || error.response?.status == 404) {
      return null;
    }
    console.error("Error fetching carriage sequence:", error);
    throw error;
  }
};
