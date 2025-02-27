import axios from "axios";
import { xml2json } from 'xml-js'

export async function makeRequest(url, options = {}) {
      // console.log(url)
      const response = await axios.get(url, options).catch((error) => { console.log(error)})
      if (response) {
        return JSON.parse(xml2json(response.data.toString()));
      } else {
       return null;
      }
  }