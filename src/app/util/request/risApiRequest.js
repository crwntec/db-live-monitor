import axios from "axios"

export const risApiRequest = async (url, options = {}) => {    
    const response = await axios.get(url, options).catch((error) => {
      console.log(error.request);
    });
    return response.data;

 }