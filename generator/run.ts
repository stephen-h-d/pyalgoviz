
import {page_object as edit_page_object} from "../src/edit_page.js";
import {page_object as load_dialog_object} from "../src/load_dialog.js";
import { genCode } from "./genCode.js";

genCode(edit_page_object, "src/generated/classes");
genCode(load_dialog_object, "src/generated/load_dialog_classes");
