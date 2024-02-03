export {};
declare global {
	/** 扩展版本号 */
	const EXTENSION_VERSION: string;

	/** NODE运行环境 */
	const NODE_ENV: 'development' | 'production' | 'none';

	/** 是否是生产环境 */
	const IS_PRODUCTION: boolean;

	/** 是否是开发环境 */
	const IS_DEVELOPMENT: boolean;

	/** 发布用户姓名 */
	const PUBLISHER: string;

	/** 项目名 */
	const PACKAGE_NAME: string;
}
