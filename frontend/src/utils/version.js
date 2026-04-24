// Sistema de versionado automático
export const getAppVersion = () => {
  // Intentar obtener la versión del package.json
  const version = import.meta.env.VITE_APP_VERSION || '1.4.0';
  const buildDate = import.meta.env.VITE_BUILD_DATE || new Date().toISOString();
  const commitHash = import.meta.env.VITE_COMMIT_HASH || 'dev';
  
  return {
    version,
    buildDate,
    commitHash,
    fullVersion: `v${version} (${commitHash.substring(0, 7)})`
  };
};

export const checkForUpdates = async () => {
  try {
    const response = await fetch('/VERSION');
    if (response.ok) {
      const versionText = await response.text();
      const lines = versionText.split('\n');
      const serverVersion = lines[0].trim();
      const currentVersion = getAppVersion().version;
      
      return {
        hasUpdate: serverVersion !== currentVersion,
        serverVersion,
        currentVersion
      };
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
  return { hasUpdate: false };
};
