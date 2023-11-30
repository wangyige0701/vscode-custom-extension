import type { Uri, FileType, Disposable } from "vscode";
import type { BackCheckComplete, CodeRefreshType, bufferAndCode, codeChangeType } from "./@types";
import { createExParamPromise, delay, getHashCode, range, bisectionAsce } from "../../utils";
import { createBuffer, imageToBase64, newUri, readDirectoryUri, readFileUri, uriDelete, writeFileUri } from "../../common/file";
import { selectFile, setStatusBarResolve, showProgress } from "../../common/interactive";
import { WError, errlog, $rej } from "../../error";
import { BackgroundConfiguration } from "../../workspace/background";
import { changeLoadState, showMessageByModal, isWindowReloadToLoadBackimage, setBackgroundImageSuccess } from "./utils";
import { backgroundSendMessage } from "./webview/executeWebview";
import { checExternalDataIsRight, deleteBackgroundCssFileModification, setSourceCssImportInfo } from "./modify/modify";
import { randomSettingBackground } from "./modify/modifyRandom";
import { createCompressDirectory, deleteCompressByCode, getCompressImage } from "./compress/compress";
import { imageStoreUri } from "./store";

