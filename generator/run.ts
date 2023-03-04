
import {page_object as edit_page_object} from "../src/containers/edit_page.js";
import {page_object as load_dialog_object} from "../src/containers/load_dialog.js";
import { genCode } from "./genCode.js";

genCode(edit_page_object, "classes");
genCode(load_dialog_object, "load_dialog_classes");
