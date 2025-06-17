import packageJson from '../../package.json';

export const getAppVersion = (): string => {
  return packageJson.version;
};

export const getLastUpdated = (): string => {
  return new Date().toLocaleDateString();
};

export const getBuildInfo = () => {
  const buildDate = process.env.BUILD_DATE || new Date().toISOString();
  const gitCommit = process.env.GIT_COMMIT || 'unknown';
  
  return {
    version: getAppVersion(),
    buildDate,
    gitCommit: gitCommit.substring(0, 7), // Short commit hash
    lastUpdated: getLastUpdated()
  };
};