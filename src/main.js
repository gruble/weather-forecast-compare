import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import "nve-designsystem/css/nve.css";
import {
  icons,
  registerIconLibrary,
} from "nve-designsystem/registerIcons/systemLibraryCustomization.js";

registerIconLibrary("system", {
  resolver: (name) => {
    return `data:image/svg+xml, ${encodeURIComponent(icons[name])}`;
  },
});

createApp(App).mount("#app");
