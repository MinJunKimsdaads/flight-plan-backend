import { handleCors } from "../services/corsConfig.js";

// 환경 변수
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const REPO_PATH = process.env.REPO_PATH;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

export default async function handler(req, res) {
  try {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    } else {
        return res.status(403).json({ message: "CORS 정책에 의해 차단된 요청입니다." });
    }
    // GitHub API: 레포지토리 특정 폴더 내용 가져오기
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${REPO_PATH}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: 'GitHub API 호출 실패' });
    }

    const files = await response.json();

    // .json 파일만 필터링 & 최신순 정렬 (파일 이름이 타임스탬프라고 가정)
    const jsonFiles = files
      .filter((file) => file.type === 'file' && file.name.endsWith('.json'))
      .sort((a, b) => {
        const aTime = parseInt(a.name.replace('.json', ''));
        const bTime = parseInt(b.name.replace('.json', ''));
        return bTime - aTime;
      });

    if (jsonFiles.length === 0) {
      return res.status(404).json({ message: '파일이 존재하지 않습니다.' });
    }

    const latestFile = jsonFiles[0];

    // 최신 파일 다운로드
    const fileResponse = await fetch(latestFile.download_url);
    if (!fileResponse.ok) {
      return res.status(fileResponse.status).json({ message: '파일 다운로드 실패' });
    }

    const parsedData = await fileResponse.json();

    res.json(parsedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 에러 발생' });
  }
};