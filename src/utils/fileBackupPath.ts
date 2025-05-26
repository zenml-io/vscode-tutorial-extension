import { existsSync } from "fs";

export default function fileBackupPath(filePath: string) {
  const backupPath = filePath.replace("/pipelines/", "/pipelinesBackup/");

  if (backupPath.includes("/pipelinesBackup/") && existsSync(backupPath)) {
    return backupPath;
  } else {
    return undefined;
  }
}
