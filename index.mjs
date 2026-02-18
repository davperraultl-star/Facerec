import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
const api = {
  // Patient operations
  patients: {
    list: (filters) => ipcRenderer.invoke("patient:list", filters),
    get: (id) => ipcRenderer.invoke("patient:get", id),
    create: (data) => ipcRenderer.invoke("patient:create", data),
    update: (id, data) => ipcRenderer.invoke("patient:update", id, data),
    delete: (id) => ipcRenderer.invoke("patient:delete", id),
    search: (query) => ipcRenderer.invoke("patient:search", query),
    getStats: () => ipcRenderer.invoke("patient:stats"),
    getRecent: (limit) => ipcRenderer.invoke("patient:recent", limit)
  },
  // Settings operations
  settings: {
    get: (key) => ipcRenderer.invoke("settings:get", key),
    set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
    getMultiple: (keys) => ipcRenderer.invoke("settings:getMultiple", keys),
    setMultiple: (entries) => ipcRenderer.invoke("settings:setMultiple", entries)
  },
  // Visit operations
  visits: {
    create: (data) => ipcRenderer.invoke("visit:create", data),
    get: (id) => ipcRenderer.invoke("visit:get", id),
    list: (patientId) => ipcRenderer.invoke("visit:list", patientId),
    update: (id, data) => ipcRenderer.invoke("visit:update", id, data),
    delete: (id) => ipcRenderer.invoke("visit:delete", id)
  },
  // Photo operations
  photos: {
    import: (sourcePath, patientId, visitId, photoState) => ipcRenderer.invoke("photo:import", sourcePath, patientId, visitId, photoState),
    get: (id) => ipcRenderer.invoke("photo:get", id),
    list: (visitId) => ipcRenderer.invoke("photo:list", visitId),
    update: (id, data) => ipcRenderer.invoke("photo:update", id, data),
    delete: (id) => ipcRenderer.invoke("photo:delete", id),
    rotate: (id, degrees) => ipcRenderer.invoke("photo:rotate", id, degrees),
    flip: (id, direction) => ipcRenderer.invoke("photo:flip", id, direction),
    crop: (id, left, top, width, height) => ipcRenderer.invoke("photo:crop", id, left, top, width, height),
    getFilePath: (relativePath) => ipcRenderer.invoke("photo:getFilePath", relativePath),
    exportAll: (visitId) => ipcRenderer.invoke("photo:exportAll", visitId),
    selectFiles: () => ipcRenderer.invoke("photo:selectFiles")
  },
  // Treatment operations
  treatments: {
    create: (data) => ipcRenderer.invoke("treatment:create", data),
    get: (id) => ipcRenderer.invoke("treatment:get", id),
    list: (visitId) => ipcRenderer.invoke("treatment:list", visitId),
    update: (id, data) => ipcRenderer.invoke("treatment:update", id, data),
    delete: (id) => ipcRenderer.invoke("treatment:delete", id)
  },
  // Treatment Area operations
  treatmentAreas: {
    create: (data) => ipcRenderer.invoke("treatmentArea:create", data),
    list: (treatmentId) => ipcRenderer.invoke("treatmentArea:list", treatmentId),
    update: (id, data) => ipcRenderer.invoke("treatmentArea:update", id, data),
    delete: (id) => ipcRenderer.invoke("treatmentArea:delete", id)
  },
  // Product catalog
  products: {
    list: () => ipcRenderer.invoke("product:list"),
    listAll: () => ipcRenderer.invoke("product:listAll"),
    get: (id) => ipcRenderer.invoke("product:get", id),
    create: (data) => ipcRenderer.invoke("product:create", data),
    update: (id, data) => ipcRenderer.invoke("product:update", id, data),
    delete: (id) => ipcRenderer.invoke("product:delete", id)
  },
  // Treated area catalog
  treatedAreas: {
    list: () => ipcRenderer.invoke("treatedArea:list"),
    listAll: () => ipcRenderer.invoke("treatedArea:listAll"),
    get: (id) => ipcRenderer.invoke("treatedArea:get", id),
    create: (data) => ipcRenderer.invoke("treatedArea:create", data),
    update: (id, data) => ipcRenderer.invoke("treatedArea:update", id, data),
    delete: (id) => ipcRenderer.invoke("treatedArea:delete", id)
  },
  // Treatment Categories
  treatmentCategories: {
    list: () => ipcRenderer.invoke("treatmentCategory:list"),
    listAll: () => ipcRenderer.invoke("treatmentCategory:listAll"),
    get: (id) => ipcRenderer.invoke("treatmentCategory:get", id),
    getBySlug: (slug) => ipcRenderer.invoke("treatmentCategory:getBySlug", slug),
    create: (data) => ipcRenderer.invoke("treatmentCategory:create", data),
    update: (id, data) => ipcRenderer.invoke("treatmentCategory:update", id, data),
    delete: (id) => ipcRenderer.invoke("treatmentCategory:delete", id)
  },
  // Portfolio operations
  portfolios: {
    create: (data) => ipcRenderer.invoke("portfolio:create", data),
    get: (id) => ipcRenderer.invoke("portfolio:get", id),
    list: () => ipcRenderer.invoke("portfolio:list"),
    update: (id, data) => ipcRenderer.invoke("portfolio:update", id, data),
    delete: (id) => ipcRenderer.invoke("portfolio:delete", id)
  },
  // Portfolio Item operations
  portfolioItems: {
    create: (data) => ipcRenderer.invoke("portfolioItem:create", data),
    list: (portfolioId) => ipcRenderer.invoke("portfolioItem:list", portfolioId),
    delete: (id) => ipcRenderer.invoke("portfolioItem:delete", id)
  },
  // Compare visits
  compare: {
    photos: (beforeVisitId, afterVisitId) => ipcRenderer.invoke("compare:photos", beforeVisitId, afterVisitId)
  },
  // Annotation operations
  annotations: {
    create: (data) => ipcRenderer.invoke("annotation:create", data),
    listForTreatment: (treatmentId) => ipcRenderer.invoke("annotation:listForTreatment", treatmentId),
    update: (id, data) => ipcRenderer.invoke("annotation:update", id, data),
    delete: (id) => ipcRenderer.invoke("annotation:delete", id)
  },
  // Consent operations
  consents: {
    create: (data) => ipcRenderer.invoke("consent:create", data),
    get: (id) => ipcRenderer.invoke("consent:get", id),
    listForPatient: (patientId) => ipcRenderer.invoke("consent:listForPatient", patientId),
    listForVisit: (visitId) => ipcRenderer.invoke("consent:listForVisit", visitId),
    delete: (id) => ipcRenderer.invoke("consent:delete", id)
  },
  // Consent Template operations
  consentTemplates: {
    create: (data) => ipcRenderer.invoke("consentTemplate:create", data),
    get: (id) => ipcRenderer.invoke("consentTemplate:get", id),
    list: () => ipcRenderer.invoke("consentTemplate:list"),
    update: (id, data) => ipcRenderer.invoke("consentTemplate:update", id, data),
    delete: (id) => ipcRenderer.invoke("consentTemplate:delete", id)
  },
  // Case search
  search: {
    cases: (filters) => ipcRenderer.invoke("search:cases", filters)
  },
  // User / Practitioner operations
  users: {
    list: () => ipcRenderer.invoke("user:list"),
    listAll: () => ipcRenderer.invoke("user:listAll"),
    get: (id) => ipcRenderer.invoke("user:get", id),
    create: (data) => ipcRenderer.invoke("user:create", data),
    update: (id, data) => ipcRenderer.invoke("user:update", id, data),
    delete: (id) => ipcRenderer.invoke("user:delete", id)
  },
  // Backup operations
  backup: {
    create: () => ipcRenderer.invoke("backup:create"),
    list: () => ipcRenderer.invoke("backup:list"),
    restore: (filename) => ipcRenderer.invoke("backup:restore", filename),
    delete: (filename) => ipcRenderer.invoke("backup:delete", filename)
  },
  // Export operations
  exports: {
    visitReport: (visitId) => ipcRenderer.invoke("export:visitReport", visitId),
    portfolioReport: (portfolioId) => ipcRenderer.invoke("export:portfolioReport", portfolioId),
    openFile: (filePath) => ipcRenderer.invoke("export:openFile", filePath)
  }
};
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
