import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';

const TEMP_DOWNLOAD_DIR = '/tmp';

export const getAllAircraftData = async (req, res) => {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.SFTP_HOST,
      user: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
      port: process.env.SFTP_PORT,
      secure: false,
    });

    await client.cd(process.env.SFTP_PATH_AIRCRAFT_ALL);

    const list = await client.list();

    const jsonFiles = list
      .filter((file) => file.isFile && file.name.endsWith('.json.gz'))
      .sort((a, b) => {
        const aTime = parseInt(a.name.replace('.json.gz', ''));
        const bTime = parseInt(b.name.replace('.json.gz', ''));
        return bTime - aTime;
      });

    if (jsonFiles.length === 0) {
      return res.status(404).json({ message: '파일이 존재하지 않습니다.' });
    }

    const latestFile = jsonFiles[0];

    if (!fs.existsSync(TEMP_DOWNLOAD_DIR)) {
      fs.mkdirSync(TEMP_DOWNLOAD_DIR, { recursive: true });
    }

    const localFilePath = path.resolve(TEMP_DOWNLOAD_DIR, latestFile.name);

    // FTP에서 로컬 임시 파일로 다운로드
    await client.downloadTo(localFilePath, latestFile.name);

    // 압축된 파일 읽기 (버퍼로)
    const compressedBuffer = fs.readFileSync(localFilePath);

    // gzip 압축 해제
    const decompressedBuffer = await new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks = [];

      const stream = Readable.from(compressedBuffer).pipe(gunzip);
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    const jsonString = decompressedBuffer.toString('utf-8');
    const parsedData = JSON.parse(jsonString);

    // 임시 파일 삭제
    fs.unlinkSync(localFilePath);

    res.json(parsedData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 에러 발생' });
  } finally {
    client.close();
  }
};