import ftp from 'basic-ftp';
import fs from "fs";
import path from "path";

const TEMP_DOWNLOAD_DIR = "./temp";

export const getAllAircraftData = async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.SFTP_HOST,
      user: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
      port: process.env.SFTP_PORT, // FTP 포트
      secure: false,
    });

    await client.cd(process.env.SFTP_PATH_AIRCRAFT_ALL);

    const list = await client.list();

    const jsonFiles = list
      .filter((file) => file.isFile && file.name.endsWith(".json"))
      .sort((a, b) => {
        const aTime = parseInt(a.name.replace(".json", ""));
        const bTime = parseInt(b.name.replace(".json", ""));
        return bTime - aTime;
      });

    if (jsonFiles.length === 0) {
      return res.status(404).json({ message: "파일이 존재하지 않습니다." });
    }

    const latestFile = jsonFiles[0];

    if (!fs.existsSync(TEMP_DOWNLOAD_DIR)) {
      fs.mkdirSync(TEMP_DOWNLOAD_DIR, { recursive: true });
    }

    const localFilePath = path.resolve(TEMP_DOWNLOAD_DIR, latestFile.name);

    // FTP에서 로컬 임시 파일로 다운로드
    await client.downloadTo(localFilePath, latestFile.name);

    // 로컬 파일 읽기
    const jsonData = fs.readFileSync(localFilePath, "utf-8");
    const parsedData = JSON.parse(jsonData);

    // 필요하면 임시파일 삭제 (선택)
    fs.unlinkSync(localFilePath);

    res.json(parsedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 에러 발생" });
  } finally {
    client.close();
  }
};