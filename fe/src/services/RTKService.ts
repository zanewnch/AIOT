import { RequestUtils } from "../utils/RequestUtils";

const requestUtils = new RequestUtils();

export const getTableData = async (endpoint: string) => {
    try{
      const data = await requestUtils.get(endpoint);
      console.log(data);
      return data;
    }catch(error){
      console.error(`Error fetching data from ${endpoint}:`, error);
      return [];
    }
  }