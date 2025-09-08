import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';
import { getAccessToken } from '../services/services.js';
import { AIRCRAFT_ALL_URL, AIRCRAFT_SINGLE_URL } from '../constant/constant.js';

const TEMP_DOWNLOAD_DIR = './temp';

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

let cache = {
  data: null,
  timestamp: 0, 
}

const CACHE_TTL = 60 * 5000; // 5분 캐시

const getOpenSkyApi = async () => {
  const token = await getAccessToken();
  const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};
  const response = await fetch(AIRCRAFT_ALL_URL, {
      method: 'GET',
      headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data =  await response.json();
  return data;
}

export const getAllAircraftDirectData = async (req, res) => {
  try{
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_TTL) {
      console.log("캐시 사용");
      return res.json(cache.data);
    }

    console.log("OpenSky API 호출");
    const data = await getOpenSkyApi();
    cache = { data, timestamp: now };

    res.json(data);
  } catch(error){
      console.warn(error);
      throw error;
  }
}

export const getSingleAircraftData = async (req, res) => {
  try{
    const { icao24, begin, end } = req.query;

    if (!icao24 || !begin || !end) {
      return res.status(400).json({ message: "icao24, begin, end는 필수입니다." });
    }
    const token = await getAccessToken();
    const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};
    const url = `${AIRCRAFT_SINGLE_URL}?icao24=${encodeURIComponent(icao24)}&begin=${encodeURIComponent(begin)}&end=${encodeURIComponent(end)}`;
    const response = await fetch(`${url}`, {
        method: 'GET',
        headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data =  await response.json();
    res.json(data);
  } catch(error){
      console.warn(error);
      throw error;
  }
}