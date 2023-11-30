import { errlog } from "../../../error";
import { delay, getRandom } from "../../../utils";
import { showMessageWithConfirm, showProgress } from "../../../common/interactive";
import { BackgroundConfiguration } from "../../../workspace/background";
import { backgroundSendMessage } from "../webview/executeWebview";
import { closeRandomBackground, showMessageByModal } from "../utils";
import { settingImage } from "../webview/executeSetting";
import { modifyCssFileForBackground } from "./modify";
import type { Progress } from "vscode";







