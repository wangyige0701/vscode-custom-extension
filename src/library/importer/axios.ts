import type { AxiosStatic, AxiosRequestConfig as _AxiosRequestConfig, AxiosResponse as _AxiosResponse } from "axios";
import { dynamicImportObject } from "..";

/** axios动态实例 */
const axios = dynamicImportObject<AxiosStatic>("axios", () => require("axios"));

export default axios;

export type AxiosResponse = _AxiosResponse;
export type AxiosRequestConfig = _AxiosRequestConfig;
