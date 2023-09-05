import { createExParamPromise, range } from "..";
import { errlog } from "../../error";
import { cryHex } from "../hash";
import { checksumsMap } from "./data";
import { getChecksumsData, getFullPathOfChecksum, readChecksumsData } from "./utils";


export function checksumsInit () {
    getChecksumsData().then(data => {
        const paths = data.map(item => item.path);
        const hashs = data.map(item => item.hash);
        return createExParamPromise(getFullPathOfChecksum(paths), paths, hashs);
    }).then(([paths, originpaths, hashs]) => {
        for (const i of range(paths.length)) {
            const path = paths[i];
            checksumsMap.set(cryHex(path), {
                path,
                value: hashs[i],
                regexp: new RegExp(`(^[\\w\\W]*"${originpaths[i]}"\\s*:\\s*")([^"]*)("[\\w\\W]*$)`),
                reset (content: string, hash: string) {
                    return content.replace(this.regexp, (_, $1, $2, $3) => `${$1}${hash}${$3}`);
                }
            });
        }
    }).then(() => {
        return readChecksumsData();
    }).then((data) => {
        checksumsMap.origin.forEach(({ regexp }) => {
            console.log(data.match(regexp));
        })
    }).catch(err => {
        errlog(err);
    });
}