const { contextBridge, ipcRenderer } = require('electron')

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Sistema de notificaciones
  notify: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  // Operaciones de archivos
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog-advanced', options),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  saveFile: (content) => ipcRenderer.invoke('save-file-dialog', content),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog-advanced', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // Sistema
  showInExplorer: (path) => ipcRenderer.invoke('show-in-explorer', path),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Operaciones Git
  gitStatus: (repoPath) => ipcRenderer.invoke('git-status', repoPath),
  gitValidateRepository: (repoPath) => ipcRenderer.invoke('git-validate-repository', repoPath),
  gitCreateTag: (repoPath, tagName, message) =>
    ipcRenderer.invoke('git-create-tag', repoPath, tagName, message),
  gitPushTags: (repoPath, remote) => ipcRenderer.invoke('git-push-tags', repoPath, remote),
  gitGetRemotes: (repoPath) => ipcRenderer.invoke('git-get-remotes', repoPath),
  gitValidateForRelease: (repoPath) => ipcRenderer.invoke('git-validate-for-release', repoPath),
  gitGetTags: (repoPath, sortBySemver, tagPrefix) =>
    ipcRenderer.invoke('git-get-tags', repoPath, sortBySemver, tagPrefix),
  gitGetTagsWithDetails: (repoPath, sortBySemver, tagPrefix) =>
    ipcRenderer.invoke('git-get-tags-with-details', repoPath, sortBySemver, tagPrefix),
  gitGetCommitsBetweenTags: (repoPath, fromTag, toTag) =>
    ipcRenderer.invoke('git-get-commits-between-tags', repoPath, fromTag, toTag),
  gitGetLatestTag: (repoPath, tagPrefix) => ipcRenderer.invoke('git-get-latest-tag', repoPath, tagPrefix),
  gitCommit: (repoPath, message) => ipcRenderer.invoke('git-commit', repoPath, message),
  gitGetCurrentBranch: (repoPath) => ipcRenderer.invoke('git-get-current-branch', repoPath),
  gitIsClean: (repoPath) => ipcRenderer.invoke('git-is-clean', repoPath),
  gitGetCommits: (repoPath, limit) => ipcRenderer.invoke('git-get-commits', repoPath, limit),
  gitGetCommitsSinceLastTag: (repoPath, tagPrefix) =>
    ipcRenderer.invoke('git-get-commits-since-last-tag', repoPath, tagPrefix),
  gitGetCommitsForReleaseType: (repoPath, currentVersion, releaseType, tagPrefix) =>
    ipcRenderer.invoke('git-get-commits-for-release-type', repoPath, currentVersion, releaseType, tagPrefix),
  gitExtractCollaborators: (commits) => ipcRenderer.invoke('git-extract-collaborators', commits),

  // Template engine
  templateRender: (templateContent, data) =>
    ipcRenderer.invoke('template-render', templateContent, data),
  templateValidate: (templateContent) => ipcRenderer.invoke('template-validate', templateContent),
  templatePreview: (templateContent, data) =>
    ipcRenderer.invoke('template-preview', templateContent, data),
  templateSave: (templateData) => ipcRenderer.invoke('template-save', templateData),
  templateLoad: (templateId) => ipcRenderer.invoke('template-load', templateId),

  // Base de datos
  dbInsertRepository: (repoData) => ipcRenderer.invoke('db-insert-repository', repoData),
  dbListRepositories: (filters) => ipcRenderer.invoke('db-list-repositories', filters),
  dbUpdateRepository: (id, updates) => ipcRenderer.invoke('db-update-repository', id, updates),
  dbDeleteRepository: (id) => ipcRenderer.invoke('db-delete-repository', id),
  dbSaveTemplate: (templateData) => ipcRenderer.invoke('db-save-template', templateData),
  dbGetTemplates: (category) => ipcRenderer.invoke('db-get-templates', category),
  dbDeleteTemplate: (id) => ipcRenderer.invoke('db-delete-template', id),
  dbSetConfig: (key, value) => ipcRenderer.invoke('db-set-config', key, value),
  dbGetConfig: (key) => ipcRenderer.invoke('db-get-config', key),
  dbInsertRelease: (releaseData) => ipcRenderer.invoke('db-insert-release', releaseData),
  dbListReleases: () => ipcRenderer.invoke('db-list-releases'),
  dbGetSecondaryRepositories: (mainRepoId) =>
    ipcRenderer.invoke('db-get-secondary-repositories', mainRepoId),
  dbGetMainRepositories: () => ipcRenderer.invoke('db-get-main-repositories'),
  dbGetAvailableSecondaryRepositories: (excludeMainRepoId) =>
    ipcRenderer.invoke('db-get-available-secondary-repositories', excludeMainRepoId),
  dbUpdateSecondaryRepositories: (mainRepoId, secondaryRepoIds) =>
    ipcRenderer.invoke('db-update-secondary-repositories', mainRepoId, secondaryRepoIds),

  // Releases
  releaseValidatePrerequisites: (config) =>
    ipcRenderer.invoke('release-validate-prerequisites', config),
  releaseGenerateChangelog: (config) => ipcRenderer.invoke('release-generate-changelog', config),
  releaseCreate: (config) => ipcRenderer.invoke('release-create', config),
  releaseGetHistory: (repoPath, limit) =>
    ipcRenderer.invoke('release-get-history', repoPath, limit),
  releaseSuggestVersion: (repoPath, currentVersion) =>
    ipcRenderer.invoke('release-suggest-version', repoPath, currentVersion),

  // Unified releases
  releaseCollectMultiRepositoryData: (
    mainRepoId,
    mainRepoName,
    mainRepoPath,
    mainRepoTagPrefix,
    secondaryRepositories,
    targetVersion
  ) =>
    ipcRenderer.invoke(
      'release-collect-multi-repository-data',
      mainRepoId,
      mainRepoName,
      mainRepoPath,
      mainRepoTagPrefix,
      secondaryRepositories,
      targetVersion
    ),
  releaseGenerateUnifiedChangelog: (unifiedData, templateOrId) =>
    ipcRenderer.invoke('release-generate-unified-changelog', unifiedData, templateOrId),

  // Configuración
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),

  // CodebaseHQ
  codebaseCreateDeployment: (config, deployment) =>
    ipcRenderer.invoke('codebase-create-deployment', config, deployment),
  codebaseTestConnection: (config) => ipcRenderer.invoke('codebase-test-connection', config),
  codebaseValidateConfig: (config) => ipcRenderer.invoke('codebase-validate-config', config),
  codebaseGetDeployments: (config) => ipcRenderer.invoke('codebase-get-deployments', config),
  codebaseGetActivity: (config, page) => ipcRenderer.invoke('codebase-get-activity', config, page),

  // Teams
  teamsSendReleaseNotification: (config, notification) =>
    ipcRenderer.invoke('teams-send-release-notification', config, notification),
  teamsTestConnection: (config) => ipcRenderer.invoke('teams-test-connection', config),
  teamsValidateConfig: (config) => ipcRenderer.invoke('teams-validate-config', config),

  // JIRA
  jiraTestConnection: () => ipcRenderer.invoke('jira-test-connection'),
  jiraGetConfig: () => ipcRenderer.invoke('jira-get-config'),
  jiraFindIssuesFromCommits: (commits) =>
    ipcRenderer.invoke('jira-find-issues-from-commits', commits),
  jiraSearchIssues: (jql, maxResults) => ipcRenderer.invoke('jira-search-issues', jql, maxResults),
  jiraCreateVersion: (versionData) => ipcRenderer.invoke('jira-create-version', versionData),
  jiraGetProjectVersions: (projectKey) =>
    ipcRenderer.invoke('jira-get-project-versions', projectKey),
  jiraCreateReleaseWithIssues: (versionName, commits, releaseNotes, releaseDate) =>
    ipcRenderer.invoke(
      'jira-create-release-with-issues',
      versionName,
      commits,
      releaseNotes,
      releaseDate
    ),
  jiraAddIssuesFixVersion: (issueKeys, versionId) =>
    ipcRenderer.invoke('jira-add-issues-fix-version', issueKeys, versionId),

  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Debug
  dbGetTableStructure: () => ipcRenderer.invoke('db-get-table-structure'),

  // Eventos del sistema
  onAppUpdate: (callback) => ipcRenderer.on('app-update-available', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})

// Información del entorno
contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
})
