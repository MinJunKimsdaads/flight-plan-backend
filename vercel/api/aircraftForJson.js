import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const TEMP_DOWNLOAD_DIR = '/tmp';

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  } else {
    return res.status(403).json({ message: "CORS 정책에 의해 차단된 요청입니다." });
  }
  const client = new ftp.Client();
  console.log(client);
  client.ftp.verbose = false;

  if (req.method === "OPTIONS") return res.status(200).end();
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

    console.log(list);

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

    const localFilePath = path.join(TEMP_DOWNLOAD_DIR, latestFile.name);

    await client.downloadTo(localFilePath, latestFile.name);

    const compressedBuffer = fs.readFileSync(localFilePath);
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

    fs.unlinkSync(localFilePath);

    res.status(200).json(parsedData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 에러 발생', error: err.message });
  } finally {
    client.close();
  }
}