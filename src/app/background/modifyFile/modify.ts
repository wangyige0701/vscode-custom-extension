/**
 * 修改css文件，修改部分包括vscode的源css文件和写入body背景样式的外部css文件
*/

import type { Disposable, Uri } from "vscode";
import type { ContentAndUri, info } from "../@types";
import { version } from "vscode";
import { dirname, join as pathjoin } from "path";
import { createExParamPromise, getDate } from "../../../utils";
import { createBuffer, createUri, isFileExits, newUri, readFileUri, uriDelete, writeFileUri } from "../../../common/file";
import { setStatusBarResolve } from "../../../common/interactive";
import { getNodeModulePath } from "../../../common/system";
import { reChecksum } from "../../../common/checksums";
import { BackgroundConfiguration } from "../../../workspace/background";
import { changeLoadState, getNewBackgroundOpacity, setBackgroundImageSuccess } from "../utils";
import { getVersion } from "../../../version";
import { WError, $rej } from "../../../error";
import { imageStoreUri } from "../store";







