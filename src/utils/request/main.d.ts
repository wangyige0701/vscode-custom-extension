import { RequestOptions } from "https";

export type RequestUrl = string | URL;

type method = 'get' | 'GET'

export interface RequestOptionsCustom extends RequestOptions {
    
}