import type { CapabilityApiRow } from "../../CapabilityPage/index.js";
import { proTextFieldApiRows, splitStringApiRows } from "../pro-textfield.js";
import { apiPropertyDetails } from "./property-details.js";
import { controlApiRows } from "./controls.js";
import { pickerApiRows } from "./pickers.js";
import { overlayApiRows } from "./overlays.js";
import { navigationApiRows } from "./navigation.js";
import { feedbackApiRows } from "./feedback.js";
import { layoutFileApiRows } from "./layout-files.js";

const canonicalApiRows = [
  ...controlApiRows,
  ...pickerApiRows,
  ...overlayApiRows,
  ...navigationApiRows,
  ...feedbackApiRows,
  ...layoutFileApiRows,
];

const allApiRows = canonicalApiRows.map((row) => {
  const details = apiPropertyDetails[row.component];
  return details ? { ...row, propertyDetails: { ...details, ...row.propertyDetails } } : row;
});

function rowsForComponents(...components: string[]) {
  const wanted = new Set(components);
  return allApiRows.filter((row) => wanted.has(row.component));
}

export const sectionApiRows: Record<string, CapabilityApiRow[]> = {
  button: rowsForComponents("Button", "ButtonGroup"),
  cascader: rowsForComponents("Cascader"),
  "textfield-textarea": rowsForComponents("TextField", "Textarea"),
  "pro-textfield": [
    ...proTextFieldApiRows,
    ...rowsForComponents("TextField")
      .filter((row) => !proTextFieldApiRows.some((own) => own.name === row.name))
      .map((row) => ({ ...row, component: "ProTextField" })),
    ...splitStringApiRows,
  ],
  checkbox: rowsForComponents("Checkbox", "CheckboxGroup"),
  radio: rowsForComponents("Radio", "RadioGroup"),
  switch: rowsForComponents("Switch"),
  slider: rowsForComponents("Slider"),
  select: rowsForComponents("Select"),
  "date-picker": rowsForComponents("DatePicker", "RangeDatePicker"),
  "time-picker": rowsForComponents("TimePicker", "RangeTimePicker"),
  dialog: rowsForComponents("Dialog"),
  drawer: rowsForComponents("Drawer"),
  tooltip: rowsForComponents("Tooltip"),
  ellipsis: rowsForComponents("Ellipsis"),
  "copy-text": rowsForComponents("CopyText"),
  detail: rowsForComponents("Detail", "DetailSection", "DetailItem"),
  popover: rowsForComponents("Popover"),
  popconfirm: rowsForComponents("Popconfirm"),
  "dropdown-menu": rowsForComponents("DropdownMenu"),
  tabs: rowsForComponents("Tabs"),
  menu: rowsForComponents("Menu", "Breadcrumb"),
  pagination: rowsForComponents("Pagination"),
  tree: rowsForComponents("Tree"),
  transfer: rowsForComponents("Transfer"),
  alert: rowsForComponents("Alert"),
  message: rowsForComponents("Message"),
  empty: rowsForComponents("Empty"),
  loading: rowsForComponents("Loading"),
  progress: rowsForComponents("Progress"),
  tag: rowsForComponents("Tag"),
  badge: rowsForComponents("Badge"),
  steps: rowsForComponents("Steps"),
  typography: rowsForComponents("Typography"),
  space: rowsForComponents("Space"),
  list: rowsForComponents("List"),
  colorpicker: rowsForComponents("ColorPicker"),
  "context-menu": rowsForComponents("ContextMenu"),
  "config-provider": rowsForComponents("ConfigProvider"),
  timeline: rowsForComponents("Timeline"),
  spin: rowsForComponents("Spin"),
  image: rowsForComponents("Image"),
  notification: rowsForComponents("Notification"),
  affix: rowsForComponents("Affix"),
  resizebox: rowsForComponents("ResizeBox"),
  box: rowsForComponents("Box"),
  grid: rowsForComponents("Grid"),
  stack: rowsForComponents("Stack"),
  card: rowsForComponents("Card"),
  divider: rowsForComponents("Divider"),
  collapsible: rowsForComponents("Collapsible"),
  "anchor-scroll-progress": rowsForComponents("Anchor", "ScrollProgress"),
  "upload-file-preview": rowsForComponents(
    "Upload",
    "FileList",
    "FileItem",
    "FileCard",
    "FilePreview",
    "FileRender",
    "FilePreviewDialog",
  ),
};
