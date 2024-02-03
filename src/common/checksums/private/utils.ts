import type { GetChecksumsData } from '../@types';
import { createHash } from 'crypto';
import path from 'path';
import { WError, $rej } from '@/error';
import { createExParamPromise } from '@/utils';
import { getNodeModulePath } from '../../system';
import { createUri, isFileExits, readFileUri } from '../../file';

/** 捕获校验和数据位置 */
const getChecksumsPositionRegexp = /^([\w\W]*"checksums"\s*:\s*\{)([^\{\}]*)(\}[\w\W]*)$/;

/** 依次获取校验和所有数据 */
const getChecksumsDataRegexp = /(?:"(.*)"\s*:\s*"(.*)")/g;

/** 通过根路径获取product.json文件的实际路径 */
export function getProductFileName(root: string) {
	return path.join(root, 'product.json');
}

/**
 * 计算文件校验和
 * @param content 需要计算的文件内容
 */
export function computeFileChecksums(content: string): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			const result = createHash('sha256').update(content).digest('base64').replace(/=+$/, '');
			resolve(result);
		} catch (error) {
			reject($rej(error, computeFileChecksums.name));
		}
	});
}

/** 获取product.json文件的位置 */
export function getProductRoot(): string {
	const modulePath = getNodeModulePath();
	if (!modulePath) {
		throw new WError('NodeModule is Undefined', {
			position: 'Function',
			FunctionName: getProductRoot.name,
			description: 'Current Module is not main module.',
		});
	}
	return path.join(modulePath, '..');
}

/** 获取当前所有校验和数据 */
export function getChecksumsData(): Promise<Array<GetChecksumsData>> {
	return new Promise((resolve, reject) => {
		readChecksumsData()
			.then(str => {
				return str.match(getChecksumsPositionRegexp);
			})
			.then(reg => {
				if (reg) {
					return reg[2].matchAll(getChecksumsDataRegexp);
				}
			})
			.then(res => {
				if (res) {
					const array = [...res];
					return array.reduce(
						(prev, curr) => {
							prev.push({
								path: curr[1],
								hash: curr[2],
							});
							return prev;
						},
						<Array<GetChecksumsData>>[],
					);
				}
			})
			.then(allContent => {
				if (!allContent || allContent.length <= 0) {
					return resolve([]);
				}
				resolve(allContent);
			})
			.catch(err => {
				reject($rej(err, getChecksumsData.name));
			});
	});
}

/** 读取校验和文件的数据 */
function readChecksumsData(): Promise<string> {
	return new Promise((resolve, reject) => {
		const uri = createUri(getProductFileName(getProductRoot()));
		createExParamPromise(isFileExits(uri), uri)
			.then(([state, path]) => {
				if (state) {
					// 文件存在
					return readFileUri(path);
				}
			})
			.then(value => {
				if (value) {
					return resolve(value.toString());
				}
				resolve('');
			})
			.catch(err => {
				reject($rej(err, readChecksumsData.name));
			});
	});
}

/**
 * 获取所有校验和文件内路径属性的完整路径
 * @param pathValues 配置文件中所有校验和文件的相对路径
 * @returns 根据根路径生成的所有需要计算校验和文件的绝队路径
 */
export function getFullPathOfChecksum(pathValues: string[]): Promise<string[]> {
	return new Promise(resolve => {
		const result = pathValues.map(pathValue => createUri(path.join(getCheckRoot(), pathValue)).toString());
		resolve(result);
	});
}

/** 获取检测校验和文件的根目录 */
function getCheckRoot(): string {
	return path.join(getProductRoot(), 'out');
}
