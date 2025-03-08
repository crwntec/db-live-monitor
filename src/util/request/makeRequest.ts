import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { xml2json } from "xml-js";

export async function makeRequest<T>(url: string, options: AxiosRequestConfig = {}): Promise<T | null> {
  try {
    const response: AxiosResponse | null = await axios.get(url, options);
    
    if (response && response.data) {
      const jsonData = JSON.parse(xml2json(response.data.toString())) as T;
      return jsonData;
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
  
  return null;
}
