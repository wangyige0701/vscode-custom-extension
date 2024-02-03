import zhcn from '@/language/zh-cn.json';

const languages = {
	zhcn: {
		title: '简体中文',
		json: zhcn,
	},
} as const;

type Languages = typeof languages;

const cache = new Map<string, string>();

const selectLanguage = 'zhcn';

function getText(path: string): string {
	if (!cache.has(path)) {
		const paths = path.split('.');
		const jsonTarget = languages[selectLanguage].json ?? {};
		let posi: any = jsonTarget;
		for (const pathItem of paths) {
			if (!posi) {
				break;
			}
			posi = posi[pathItem];
		}
		cache.set(path, posi ?? '');
	}
	return cache.get(path)!;
}

export function $t(path: string) {
	const text = getText(path);
	return text;
}
