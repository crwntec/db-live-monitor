import axios from "axios";
import { xml2json } from 'xml-js'

export async function makeRequest(url) {
    try {
      const response = await axios.get(url);
      if (response.status >= 200 && response.status < 400) {
        return JSON.parse(xml2json(response.data.toString()));
      } else {
        throw new Error(`HTTP request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }