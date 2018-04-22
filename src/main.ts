require('./assets/fonts.css')
require('./assets/app.css')
require('./assets/bvc.css')

import { initTranslator, CurrentLocale } from './Translator'
import { initRelativeFormat } from './utils/RelativeFormat'
// import * as queryString  from 'query-string'
// const windowLocation = window.location;
// const parsedQueryString = queryString.parse(windowLocation.search);
const locale: string = "ru"; // parsedQueryString.lang === "ru" ? "ru" : "en";
initTranslator(locale);
initRelativeFormat();

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import AppVM, { formatDateTime } from './view_models/AppVM'
import * as counterpart from 'counterpart'
// import * as $ from "jquery";
// import './demo';
import VueGoodTable from 'vue-good-table';
// import the styles 
import 'vue-good-table/dist/vue-good-table.css'

Vue.use(VueGoodTable); 

Vue.config.productionTip = false;

const appVM = new AppVM();

/* eslint-disable no-new */
const appVMP = new Vue({
  data: appVM,
  computed: {
    currentLocale: function(): string {
      return CurrentLocale;
    },
    // pathname: function(): string {
    //   return windowLocation.pathname;
    // },  
  },
  methods: {
    tt: function (key: string|string[], options?: object): string {
      return counterpart(key, options);
    },
    formatDateTime: formatDateTime,
    hideSettings: function (event: any) {
      appVM.hideSettingsPanel();
    },
    smartToggleSettings: function (event: Event) {
      const srcElement = event.srcElement;
      if (srcElement && srcElement.classList.contains("toggle-menu")) {
        appVM.showSettingsPanel();
      } else {
        appVM.hideSettingsPanel();
      }
    },
    saveSettings: function (event: any) {
      appVM.applySettings();
    },
  }
});
appVMP.$mount("#content");

