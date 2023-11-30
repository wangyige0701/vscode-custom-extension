import { addImageToStorage } from "..";
import { errlog, $rej } from "../../../error";
import { base64ByFiletypeAndData, imageToBase64Type } from "../../../common/file";
import { showMessageWithConfirm } from "../../../common/interactive";
import { imageUrl } from "../../../utils";
import { GetImage } from "../../../common/request";
import { BackgroundConfiguration } from "../../../workspace/background";
import { backgroundSendMessage } from "../webview/executeWebview";
import { getExternalCssModifyOpacityContent, getExternalFileContent, setSourceCssImportInfo, writeExternalCssFile } from "./modify";
import { getNewBackgroundOpacity, isWindowReloadToLoadBackimage } from "../utils";


