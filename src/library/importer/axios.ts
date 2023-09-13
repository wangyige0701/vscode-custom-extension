import type { AxiosStatic, AxiosRequestConfig as $AxiosRequestConfig, AxiosResponse as $AxiosResponse } from "axios";
import { dynamicImportObject } from "..";

/** axios动态实例 */
const axios = dynamicImportObject<AxiosStatic>("axios", () => require("axios"));

export default axios;

export type AxiosResponse = $AxiosResponse;
export type AxiosRequestConfig = $AxiosRequestConfig;