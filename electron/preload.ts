import { contextBridge, ipcRenderer } from 'electron';

const api = {
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    get: (id: string) => ipcRenderer.invoke('templates:get', id),
    save: (t: any) => ipcRenderer.invoke('templates:save', t),
    delete: (id: string) => ipcRenderer.invoke('templates:delete', id)
  },
  reports: {
    list: () => ipcRenderer.invoke('reports:list'),
    get: (id: string) => ipcRenderer.invoke('reports:get', id),
    save: (r: any) => ipcRenderer.invoke('reports:save', r),
    delete: (id: string) => ipcRenderer.invoke('reports:delete', id),
    createFromTemplate: (payload: any) => ipcRenderer.invoke('reports:createFromTemplate', payload)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (s: any) => ipcRenderer.invoke('settings:set', s)
  },
  ai: {
    hasKey: () => ipcRenderer.invoke('ai:hasKey'),
    setKey: (key: string) => ipcRenderer.invoke('ai:setKey', key),
    deleteKey: () => ipcRenderer.invoke('ai:deleteKey'),
    process: (req: any) => ipcRenderer.invoke('ai:process', req)
  },
  dialogs: {
    openImportFile: () => ipcRenderer.invoke('dialog:openImportFile'),
    chooseFolder: () => ipcRenderer.invoke('dialog:chooseFolder'),
    pickImage: () => ipcRenderer.invoke('dialog:pickImage')
  },
  images: {
    saveDataUrl: (dataUrl: string) => ipcRenderer.invoke('images:saveDataUrl', dataUrl),
    getDataUrl: (filePath: string) => ipcRenderer.invoke('images:getDataUrl', filePath)
  },
  importFile: {
    parse: (filePath: string) => ipcRenderer.invoke('import:parseFile', filePath),
    loadFullSheet: (filePath: string, sheetName?: string) => ipcRenderer.invoke('import:loadFullSheet', filePath, sheetName)
  },
  exportReport: {
    run: (report: any, format: 'pdf' | 'docx' | 'xlsx') => ipcRenderer.invoke('export:run', { report, format }),
    list: (reportId: string) => ipcRenderer.invoke('exports:list', reportId)
  },
  app: {
    openDataFolder: () => ipcRenderer.invoke('app:openDataFolder')
  }
};

contextBridge.exposeInMainWorld('api', api);

export type PreloadApi = typeof api;