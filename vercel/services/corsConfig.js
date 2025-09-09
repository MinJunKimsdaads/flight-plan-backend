const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

export function handleCors(req, res){
    const origin = req.headers.origin;

    if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

        // OPTIONS 요청은 미리 응답
        if (req.method === "OPTIONS") {
        res.status(200).end();
        return false; // 다음 로직을 실행하지 않도록
        }

        return true; // 정상 요청이면 true 반환
    } else {
        res.status(403).json({ message: "CORS 정책에 의해 차단된 요청입니다." });
        return false;
    }
}